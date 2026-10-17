import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";

import { editorApi } from "@/services/editorApiService";

const GIF_TOKEN = ":gif[test]:";
const GIF_URL =
	"https://cdn.7tv.app/emote/01H0Z79Q2G0007779TR98GKAZ3/4x.avif";
const GIF_SELECTOR = "[data-hikka-forge-gif]";

function getContentEditorId(): string | null {
	const parts = window.location.pathname.split("/").filter(Boolean);
	const type = parts[0];
	const slug = parts[1];

	if (!slug || !["anime", "manga", "novel", "article", "collection"].includes(type)) {
		return null;
	}

	return `comment-${type}-${decodeURIComponent(slug)}`;
}

function createGifNode(): HTMLSpanElement {
	const wrapper = document.createElement("span");
	const image = document.createElement("img");

	wrapper.dataset.hikkaForgeGif = "test";
	wrapper.title = GIF_TOKEN;
	wrapper.style.display = "inline-flex";
	wrapper.style.verticalAlign = "middle";
	wrapper.style.margin = "0 0.12em";

	image.src = GIF_URL;
	image.alt = GIF_TOKEN;
	image.loading = "lazy";
	image.decoding = "async";
	image.style.width = "3em";
	image.style.height = "3em";
	image.style.objectFit = "contain";

	wrapper.append(image);
	return wrapper;
}

function replaceTokens(root: HTMLElement): void {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let node: Node | null;

	while ((node = walker.nextNode())) {
		const textNode = node as Text;
		const parent = textNode.parentElement;
		if (
			!parent ||
			parent.closest(`${GIF_SELECTOR}, [contenteditable="true"]`) ||
			!textNode.data.includes(GIF_TOKEN)
		) {
			continue;
		}
		textNodes.push(textNode);
	}

	for (const textNode of textNodes) {
		const fragment = document.createDocumentFragment();
		const pieces = textNode.data.split(GIF_TOKEN);

		pieces.forEach((piece, index) => {
			if (piece) fragment.append(document.createTextNode(piece));
			if (index < pieces.length - 1) fragment.append(createGifNode());
		});

		textNode.replaceWith(fragment);
	}
}

function GifRenderer() {
	const scheduled = useRef<number | null>(null);

	useEffect(() => {
		const comments = document.querySelector<HTMLElement>("#comments");
		if (!comments) return;

		const scan = () => {
			scheduled.current = null;
			replaceTokens(comments);
		};
		const scheduleScan = () => {
			if (scheduled.current !== null) return;
			scheduled.current = window.requestAnimationFrame(scan);
		};

		scan();
		const observer = new MutationObserver(scheduleScan);
		observer.observe(comments, {
			childList: true,
			characterData: true,
			subtree: true,
		});

		return () => {
			observer.disconnect();
			if (scheduled.current !== null) window.cancelAnimationFrame(scheduled.current);
		};
	}, []);

	return null;
}

export default function CommentGifComponent() {
	const insertTestGif = async () => {
		const editorId = getContentEditorId();
		if (!editorId) return;

		try {
			await editorApi(editorId, { timeout: 2000 }).insert([
				{ type: "p", children: [{ text: GIF_TOKEN }] },
			]);
		} catch (error) {
			console.warn("[Hikka Forge] Не вдалося вставити тестову GIF-емодзі", error);
		}
	};

	return (
		<>
			<GifRenderer />
			<button
				type="button"
				className="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-2 rounded-md bg-transparent px-1.5 text-sm font-medium whitespace-nowrap outline-hidden transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				onMouseDown={(event) => event.preventDefault()}
				onClick={insertTestGif}
				aria-label="Відкрити стікери Hikka"
				title="Відкрити стікери Hikka"
			>
				<Icon icon="lucide:smile-plus" className="size-4" />
			</button>
		</>
	);
}
