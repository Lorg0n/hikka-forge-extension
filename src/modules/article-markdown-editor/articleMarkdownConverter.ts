import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import { unified } from "unified";

import type {
	EditorElementNode,
	EditorNode,
	EditorTextNode,
	EditorValue,
} from "@/services/editorApiService";

interface MarkdownNode {
	type: string;
	value?: string;
	depth?: number;
	ordered?: boolean;
	url?: string;
	alt?: string;
	name?: string;
	attributes?: Record<string, string>;
	children?: MarkdownNode[];
}

type TextMarks = Omit<EditorTextNode, "text">;

const paragraph = (
	children: EditorNode[] = [{ text: "" }],
): EditorElementNode => ({
	type: "p",
	children: children.length > 0 ? children : [{ text: "" }],
});

const textContent = (node: MarkdownNode): string => {
	if (typeof node.value === "string") return node.value;
	return (node.children ?? []).map(textContent).join("");
};

function inlineNodes(
	nodes: MarkdownNode[],
	marks: TextMarks = {},
): EditorNode[] {
	return nodes.flatMap((node): EditorNode[] => {
		switch (node.type) {
			case "text":
				return [{ text: node.value ?? "", ...marks }];
			case "strong":
				return inlineNodes(node.children ?? [], { ...marks, bold: true });
			case "emphasis":
				return inlineNodes(node.children ?? [], { ...marks, italic: true });
			case "delete":
				return inlineNodes(node.children ?? [], {
					...marks,
					strikethrough: true,
				});
			case "link": {
				const children = inlineNodes(node.children ?? [], marks);
				return [
					{
						type: "a",
						url: node.url ?? "",
						children: children.length > 0 ? children : [{ text: "", ...marks }],
					},
				];
			}
			case "break":
				return [{ text: "\n", ...marks }];
			case "inlineCode":
				return [{ text: `\`${node.value ?? ""}\``, ...marks }];
			case "html":
				return [{ text: node.value ?? "", ...marks }];
			default:
				return node.children
					? inlineNodes(node.children, marks)
					: [{ text: node.value ?? "", ...marks }];
		}
	});
}

const youtubeUrl = (node: MarkdownNode): string => {
	const id = node.attributes?.id ?? node.attributes?.["#"];
	if (id) return `https://www.youtube.com/watch?v=${id}`;
	return node.url ?? textContent(node);
};

function paragraphBlocks(node: MarkdownNode): EditorElementNode[] {
	const result: EditorElementNode[] = [];
	let inline: MarkdownNode[] = [];

	const flushInline = () => {
		if (inline.length === 0) return;
		if (inline.every((child) => textContent(child).trim().length === 0)) {
			inline = [];
			return;
		}
		result.push(paragraph(inlineNodes(inline)));
		inline = [];
	};

	for (const child of node.children ?? []) {
		if (child.type === "image") {
			flushInline();
			result.push({
				type: "image",
				url: child.url ?? "",
				alt: child.alt ?? "",
				children: [{ text: "" }],
			});
			continue;
		}
		if (
			(child.type === "leafDirective" || child.type === "textDirective") &&
			child.name === "youtube-video"
		) {
			flushInline();
			result.push({
				type: "video",
				url: youtubeUrl(child),
				children: [{ text: "" }],
			});
			continue;
		}
		inline.push(child);
	}

	flushInline();
	return result.length > 0 ? result : [paragraph()];
}

function listItem(node: MarkdownNode): EditorElementNode {
	const children: EditorElementNode[] = [];

	for (const child of node.children ?? []) {
		if (child.type === "paragraph") {
			const content = inlineNodes(child.children ?? []);
			children.push({
				type: "lic",
				children: content.length > 0 ? content : [{ text: "" }],
			});
		} else if (child.type === "list") {
			children.push(list(child));
		} else {
			children.push({ type: "lic", children: [{ text: textContent(child) }] });
		}
	}

	return {
		type: "li",
		children:
			children.length > 0
				? children
				: [{ type: "lic", children: [{ text: "" }] }],
	};
}

function list(node: MarkdownNode): EditorElementNode {
	return {
		type: node.ordered ? "ol" : "ul",
		children: (node.children ?? []).map(listItem),
	};
}

function blockNodes(nodes: MarkdownNode[]): EditorElementNode[] {
	return nodes.flatMap((node): EditorElementNode[] => {
		switch (node.type) {
			case "paragraph":
				return paragraphBlocks(node);
			case "heading": {
				const children = inlineNodes(node.children ?? []);
				return [
					{
						type: `h${Math.min(Math.max(node.depth ?? 1, 1), 6)}`,
						children: children.length > 0 ? children : [{ text: "" }],
					},
				];
			}
			case "blockquote":
				return blockNodes(node.children ?? []).map((child) => ({
					type: "blockquote",
					children:
						child.type === "p"
							? child.children
							: [{ text: serializeBlock(child) }],
				}));
			case "list":
				return [list(node)];
			case "containerDirective":
				if (node.name === "spoiler") {
					const children = blockNodes(node.children ?? []);
					return [
						{
							type: "spoiler",
							children: children.length > 0 ? children : [paragraph()],
						},
					];
				}
				return blockNodes(node.children ?? []);
			case "image":
				return [
					{
						type: "image",
						url: node.url ?? "",
						alt: node.alt ?? "",
						children: [{ text: "" }],
					},
				];
			case "leafDirective":
			case "textDirective":
				if (node.name === "youtube-video") {
					return [
						{
							type: "video",
							url: youtubeUrl(node),
							children: [{ text: "" }],
						},
					];
				}
				return [paragraph([{ text: textContent(node) }])];
			case "code":
				return [paragraph([{ text: `\`\`\`\n${node.value ?? ""}\n\`\`\`` }])];
			case "thematicBreak":
				return [paragraph([{ text: "---" }])];
			case "html":
				return [paragraph([{ text: node.value ?? "" }])];
			default:
				return node.children
					? blockNodes(node.children)
					: [paragraph([{ text: node.value ?? "" }])];
		}
	});
}

function normalizeFakeMarkdown(markdown: string): string {
	const lines = markdown.split(/\r?\n/);
	const normalized: string[] = [];

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const nextLine = lines[index + 1];
		normalized.push(line);

		if (
			/^ {0,3}>/.test(line) &&
			nextLine !== undefined &&
			nextLine.trim().length > 0 &&
			!/^ {0,3}>/.test(nextLine)
		) {
			// CommonMark treats an unprefixed line as a lazy continuation of the
			// blockquote. Hikka's fake Markdown treats only `>`-prefixed lines as
			// quoted, so make that boundary explicit for Remark.
			normalized.push("");
		}
	}

	return normalized.join("\n");
}

export function markdownToPlate(markdown: string): EditorValue {
	const tree = unified()
		.use(remarkParse)
		.use(remarkDirective)
		.parse(normalizeFakeMarkdown(markdown)) as MarkdownNode;
	const value = blockNodes(tree.children ?? []);
	return value.length > 0 ? value : [paragraph()];
}

function escapeInline(value: string): string {
	return value.replace(/([\\`*_[\]])/g, "\\$1");
}

const isEditorTextNode = (node: EditorNode): node is EditorTextNode =>
	"text" in node && typeof node.text === "string";

const textMarksKey = (node: EditorTextNode): string =>
	`${Boolean(node.bold)}:${Boolean(node.italic)}:${Boolean(node.strikethrough)}`;

function serializeText(node: EditorTextNode): string {
	const hasMarks = Boolean(node.bold || node.italic || node.strikethrough);
	if (!hasMarks) return escapeInline(node.text);

	// CommonMark does not recognise emphasis when a closing delimiter is
	// preceded by whitespace (for example, `**text **`). Plate, however, often
	// keeps the space typed after a formatted word in the same text leaf. Keep
	// that whitespace outside the delimiters so converting the result back to
	// Plate restores the same marked text and the same spacing.
	const leadingWhitespace = node.text.match(/^\s*/)?.[0] ?? "";
	const trailingWhitespace = node.text.match(/\s*$/)?.[0] ?? "";
	const end = node.text.length - trailingWhitespace.length;
	const content = node.text.slice(leadingWhitespace.length, end);

	if (!content) return escapeInline(node.text);

	let value = escapeInline(content);
	if (node.bold) value = `**${value}**`;
	if (node.italic) value = `*${value}*`;
	if (node.strikethrough) value = `~~${value}~~`;
	return `${escapeInline(leadingWhitespace)}${value}${escapeInline(trailingWhitespace)}`;
}

function serializeInline(nodes: EditorNode[]): string {
	const mergedNodes: EditorNode[] = [];

	for (const node of nodes) {
		const previous = mergedNodes.at(-1);
		if (
			previous &&
			isEditorTextNode(previous) &&
			isEditorTextNode(node) &&
			textMarksKey(previous) === textMarksKey(node)
		) {
			previous.text += node.text;
			continue;
		}
		mergedNodes.push(isEditorTextNode(node) ? { ...node } : node);
	}

	return mergedNodes
		.map((node) => {
			if (isEditorTextNode(node)) return serializeText(node);

			const value = serializeInline(node.children);
			if (node.type === "a") return `[${value}](${String(node.url ?? "")})`;
			return value;
		})
		.join("");
}

function getYouTubeId(value: string): string {
	try {
		const url = new URL(value);
		if (url.hostname === "youtu.be") return url.pathname.slice(1);
		return url.searchParams.get("v") ?? url.pathname.split("/").pop() ?? value;
	} catch {
		return value;
	}
}

function serializeListItem(
	node: EditorElementNode,
	index: number,
	ordered: boolean,
): string {
	const marker = ordered ? `${index + 1}.` : "-";
	const content = node.children
		.map((child) =>
			"text" in child
				? serializeInline([child])
				: child.type === "lic"
					? serializeInline(child.children)
					: serializeBlock(child),
		)
		.join("\n");
	return `${marker} ${content.replace(/\n/g, "\n  ")}`;
}

function serializeBlock(node: EditorElementNode): string {
	if (/^h[1-6]$/.test(node.type)) {
		return `${"#".repeat(Number(node.type.slice(1)))} ${serializeInline(node.children)}`;
	}

	switch (node.type) {
		case "p":
		case "lic":
			return serializeInline(node.children);
		case "blockquote":
			return serializeInline(node.children)
				.split("\n")
				.map((line) => `> ${line}`)
				.join("\n");
		case "ul":
		case "ol":
			return node.children
				.filter((child): child is EditorElementNode => "type" in child)
				.map((child, index) =>
					serializeListItem(child, index, node.type === "ol"),
				)
				.join("\n");
		case "spoiler":
			return `:::spoiler\n${node.children
				.map((child) =>
					"text" in child ? serializeInline([child]) : serializeBlock(child),
				)
				.join("\n\n")}\n:::`;
		case "image":
			return `![${String(node.alt ?? "")}](${String(node.url ?? "")})`;
		case "image_group":
			return node.children
				.map((child) =>
					"text" in child ? serializeInline([child]) : serializeBlock(child),
				)
				.filter((child) => child.trim().length > 0)
				.join("\n");
		case "video":
			return `::youtube-video[YouTube відео]{#${getYouTubeId(String(node.url ?? ""))}}`;
		default:
			return serializeInline(node.children);
	}
}

const isMediaBlock = (node: EditorElementNode): boolean =>
	node.type === "image" || node.type === "image_group" || node.type === "video";

function blockSeparator(
	previous: EditorElementNode,
	current: EditorElementNode,
): string {
	if (isMediaBlock(previous) && isMediaBlock(current)) return "\n";
	if (previous.type === "p" && /^h[1-6]$/.test(current.type)) return "\n";
	if (previous.type === "blockquote" && current.type !== "blockquote") return "\n";
	return "\n\n";
}

export function plateToMarkdown(value: EditorValue): string {
	return value
		.map((node, index) => {
			const markdown = serializeBlock(node);
			if (index === 0) return markdown;
			return `${blockSeparator(value[index - 1], node)}${markdown}`;
		})
		.join("")
		.trim();
}
