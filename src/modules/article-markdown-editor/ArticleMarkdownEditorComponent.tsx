import { useRef, useState } from "react";
import {
	Bold,
	ChevronDown,
	Check,
	Copy,
	EyeOff,
	Eye,
	Film,
	Heading2,
	Image,
	Italic,
	Link2,
	List,
	ListOrdered,
	Pencil,
	Plus,
	Redo2,
	Quote,
	RotateCcw,
	Smile,
	Undo2,
} from "lucide-react";

import MDViewer from "@/components/ui/markdown/MD-viewer";

type MarkdownAction =
	| "paragraph"
	| "heading3"
	| "heading4"
	| "heading5"
	| "bold"
	| "italic"
	| "quote"
	| "spoiler"
	| "link"
	| "list"
	| "orderedList";


const EMOJIS = [
	"😀", "😃", "😄", "😁", "😂", "🤣", "😊", "😍",
	"🤔", "😎", "😭", "😡", "👍", "👎", "👏", "🙏",
	"🔥", "✨", "❤️", "💔", "🎉", "✅", "⭐", "💡",
];

function getYouTubeVideoId(value: string): string | null {
	try {
		const url = new URL(value);
		if (url.hostname === "youtu.be") {
			return url.pathname.slice(1) || null;
		}
		if (!url.hostname.includes("youtube.com")) return null;
		return url.searchParams.get("v") || url.pathname.split("/").at(-1) || null;
	} catch {
		return null;
	}
}

const INSERT_ACTIONS: Array<{
	id: MarkdownAction;
	label: string;
	icon: typeof Heading2;
}> = [
	{ id: "paragraph", label: "Параграф", icon: Heading2 },
	{ id: "heading3", label: "Заголовок 3", icon: Heading2 },
	{ id: "heading4", label: "Заголовок 4", icon: Heading2 },
	{ id: "heading5", label: "Заголовок 5", icon: Heading2 },
	{ id: "quote", label: "Цитата", icon: Quote },
	{ id: "spoiler", label: "Спойлер", icon: EyeOff },
	{ id: "list", label: "Маркований список", icon: List },
	{ id: "orderedList", label: "Нумерований список", icon: ListOrdered },
];

const MARK_ACTIONS: Array<{
	id: MarkdownAction;
	label: string;
	icon: typeof Heading2;
}> = [
	{ id: "bold", label: "Жирний", icon: Bold },
	{ id: "italic", label: "Курсив", icon: Italic },
	{ id: "link", label: "Посилання", icon: Link2 },
];

function applyMarkdownAction(
	textarea: HTMLTextAreaElement,
	action: MarkdownAction,
): { value: string; selectionStart: number; selectionEnd: number } {
	const value = textarea.value;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const selected = value.slice(start, end);
	const lineStart = value.lastIndexOf("\n", start - 1) + 1;

	let insertion = selected;
	let selectionStart = start;
	let selectionEnd = end;

	switch (action) {
		case "paragraph":
			insertion = selected || "Текст параграфа";
			selectionStart = start;
			selectionEnd = start + insertion.length;
			break;
		case "heading3":
			insertion = `### ${selected || "Заголовок"}`;
			selectionStart = start + 4;
			selectionEnd = selectionStart + (selected || "Заголовок").length;
			break;
		case "heading4":
			insertion = `#### ${selected || "Заголовок"}`;
			selectionStart = start + 5;
			selectionEnd = selectionStart + (selected || "Заголовок").length;
			break;
		case "heading5":
			insertion = `##### ${selected || "Заголовок"}`;
			selectionStart = start + 6;
			selectionEnd = selectionStart + (selected || "Заголовок").length;
			break;
		case "bold":
			insertion = `**${selected || "жирний текст"}**`;
			selectionStart = start + 2;
			selectionEnd = selectionStart + (selected || "жирний текст").length;
			break;
		case "italic":
			insertion = `*${selected || "курсив"}*`;
			selectionStart = start + 1;
			selectionEnd = selectionStart + (selected || "курсив").length;
			break;
		case "quote":
			insertion = selected
				? selected
					.split("\n")
					.map((line) => `> ${line}`)
					.join("\n")
				: "> Цитата";
			selectionStart = start + 2;
			selectionEnd = selectionStart + insertion.length - 2;
			break;
		case "spoiler":
			insertion = `:::spoiler\n${selected || "Текст спойлера"}\n:::`;
			selectionStart = start + 11;
			selectionEnd = selectionStart + (selected || "Текст спойлера").length;
			break;
		case "link":
			insertion = `[${selected || "текст посилання"}](https://)`;
			selectionStart = start + 1;
			selectionEnd = selectionStart + (selected || "текст посилання").length;
			break;
		case "list":
			insertion = selected
				? selected
					.split("\n")
					.map((line) => `- ${line}`)
					.join("\n")
				: "- Елемент списку";
			selectionStart = lineStart + 2;
			selectionEnd = selectionStart + insertion.length - 2;
			break;
		case "orderedList":
			insertion = selected
				? selected
					.split("\n")
					.map((line, index) => `${index + 1}. ${line}`)
					.join("\n")
				: "1. Елемент списку";
			selectionStart = lineStart + 3;
			selectionEnd = selectionStart + insertion.length - 3;
			break;
	}

	return {
		value: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
		selectionStart,
		selectionEnd,
	};
}

function ToolbarButton({
	label,
	icon: Icon,
	onClick,
}: {
	label: string;
	icon: typeof Heading2;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			onClick={onClick}
			title={label}
			aria-label={label}
		>
			<Icon className="size-3.5" aria-hidden="true" />
			<span className="hidden sm:inline">{label}</span>
		</button>
	);
}

function InsertMenu({ onAction }: { onAction: (action: MarkdownAction) => void }) {
	const [open, setOpen] = useState(false);

	return (
		<div className="relative">
			<button
				type="button"
				className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => setOpen((current) => !current)}
				aria-expanded={open}
				aria-haspopup="menu"
				title="Вставити"
			>
				<Plus className="size-3.5" aria-hidden="true" />
				<span className="hidden sm:inline">Вставити</span>
				<ChevronDown className="size-3" aria-hidden="true" />
			</button>
			{open && (
				<div className="absolute top-full left-0 z-20 mt-1 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
					{INSERT_ACTIONS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
							onClick={() => {
								onAction(id);
								setOpen(false);
							}}
						>
							<Icon className="size-3.5" aria-hidden="true" />
							{label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export default function ArticleMarkdownEditorComponent() {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [markdown, setMarkdown] = useState("");
	const [copied, setCopied] = useState(false);
	const [isPreviewing, setIsPreviewing] = useState(false);
	const [emojiOpen, setEmojiOpen] = useState(false);
	const [history, setHistory] = useState<string[]>([]);
	const [future, setFuture] = useState<string[]>([]);

	const updateMarkdown = (nextValue: string, start?: number, end?: number) => {
		if (nextValue === markdown) return;
		setHistory((current) => [...current.slice(-49), markdown]);
		setFuture([]);
		setMarkdown(nextValue);
		window.requestAnimationFrame(() => {
			if (!textareaRef.current || start === undefined || end === undefined) return;
			textareaRef.current.focus();
			textareaRef.current.setSelectionRange(start, end);
		});
	};

	const undo = () => {
		const previous = history.at(-1);
		if (previous === undefined) return;
		setHistory((current) => current.slice(0, -1));
		setFuture((current) => [markdown, ...current]);
		setMarkdown(previous);
		window.requestAnimationFrame(() => {
			textareaRef.current?.focus();
			textareaRef.current?.setSelectionRange(previous.length, previous.length);
		});
	};

	const redo = () => {
		const next = future[0];
		if (next === undefined) return;
		setFuture((current) => current.slice(1));
		setHistory((current) => [...current, markdown]);
		setMarkdown(next);
		window.requestAnimationFrame(() => {
			textareaRef.current?.focus();
			textareaRef.current?.setSelectionRange(next.length, next.length);
		});
	};

	const insertEmoji = (emoji: string) => {
		if (!textareaRef.current) return;
		const { selectionStart, selectionEnd, value } = textareaRef.current;
		updateMarkdown(
			`${value.slice(0, selectionStart)}${emoji}${value.slice(selectionEnd)}`,
			selectionStart + emoji.length,
			selectionStart + emoji.length,
		);
		setEmojiOpen(false);
	};

	const insertVideo = () => {
		const url = window.prompt("Посилання на YouTube відео");
		if (!url?.trim()) return;
		const videoId = getYouTubeVideoId(url.trim());
		if (!videoId) {
			window.alert("Введіть коректне посилання на YouTube.");
			return;
		}
		insertTextAtCursor(`\n::youtube-video[YouTube відео]{#${videoId}}\n`);
	};

	const insertImage = () => {
		imageInputRef.current?.click();
	};

	const insertImages = async (files: FileList | null) => {
		const imageFiles = Array.from(files ?? []).filter((file) =>
			file.type.startsWith("image/"),
		);
		if (imageFiles.length === 0) return;

		const images = await Promise.all(
			imageFiles.map(
				(file) =>
					new Promise<string>((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () =>
							resolve(`![${file.name}](${String(reader.result)})`);
						reader.onerror = () => reject(reader.error);
						reader.readAsDataURL(file);
					}),
			),
		);
		insertTextAtCursor(images.join("\n\n"));
		if (imageInputRef.current) imageInputRef.current.value = "";
	};

	function insertTextAtCursor(text: string) {
		if (!textareaRef.current) return;
		const { selectionStart, selectionEnd, value } = textareaRef.current;
		updateMarkdown(
			`${value.slice(0, selectionStart)}${text}${value.slice(selectionEnd)}`,
			selectionStart + text.length,
			selectionStart + text.length,
		);
	}

	const handleAction = (action: MarkdownAction) => {
		if (!textareaRef.current) return;
		const result = applyMarkdownAction(textareaRef.current, action);
		updateMarkdown(result.value, result.selectionStart, result.selectionEnd);
	};

	const copyMarkdown = async () => {
		try {
			await navigator.clipboard.writeText(markdown);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			// Clipboard access can be unavailable in a content-script context.
			textareaRef.current?.focus();
			textareaRef.current?.select();
		}
	};

	const emojiMenu = (
		<div className="absolute top-full right-0 z-20 mt-1 grid w-56 grid-cols-8 gap-1 rounded-lg border border-border bg-popover p-2 text-2xl shadow-lg">
			{EMOJIS.map((emoji) => (
				<button
					key={emoji}
					type="button"
					className="flex size-6 items-center justify-center rounded hover:bg-accent"
					onClick={() => insertEmoji(emoji)}
					aria-label={`Вставити ${emoji}`}
				>
					{emoji}
				</button>
			))}
		</div>
	);

	return (
		<section className="mt-4 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/35 px-3 py-2">
				<div className="flex items-center gap-1">
					<button
						type="button"
						className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onClick={() => setIsPreviewing((current) => !current)}
						aria-pressed={isPreviewing}
						title={isPreviewing ? "Повернутися до редактора" : "Відкрити перегляд"}
					>
						{isPreviewing ? (
							<Pencil className="size-3.5" aria-hidden="true" />
						) : (
							<Eye className="size-3.5" aria-hidden="true" />
						)}
						{isPreviewing ? "Редагувати" : "Перегляд"}
					</button>
					<button
						type="button"
						className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onClick={() => updateMarkdown("")}
						title="Очистити редактор"
					>
						<RotateCcw className="size-3.5" aria-hidden="true" />
						Очистити
					</button>
					<button
						type="button"
						className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onClick={copyMarkdown}
						title="Скопіювати Markdown"
					>
						{copied ? (
							<Check className="size-3.5" aria-hidden="true" />
						) : (
							<Copy className="size-3.5" aria-hidden="true" />
						)}
						{copied ? "Скопійовано" : "Копіювати"}
					</button>
				</div>
			</div>

			{!isPreviewing && (
				<div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
					<InsertMenu onAction={handleAction} />
					{MARK_ACTIONS.map(({ id, label, icon }) => (
						<ToolbarButton
							key={id}
							label={label}
							icon={icon}
							onClick={() => handleAction(id)}
						/>
					))}
					<div className="mx-1 h-6 w-px bg-border" />
					<div className="relative">
						<ToolbarButton
							label="Емоджі"
							icon={Smile}
							onClick={() => setEmojiOpen((current) => !current)}
						/>
						{emojiOpen && emojiMenu}
					</div>
					<ToolbarButton label="Відео" icon={Film} onClick={insertVideo} />
					<ToolbarButton label="Зображення" icon={Image} onClick={insertImage} />
					<input
						ref={imageInputRef}
						type="file"
						accept="image/*"
						multiple
						className="hidden"
						onChange={(event) => void insertImages(event.target.files)}
					/>
					<div className="mx-1 h-6 w-px bg-border" />
					<ToolbarButton label="Назад" icon={Undo2} onClick={undo} />
					<ToolbarButton label="Вперед" icon={Redo2} onClick={redo} />
				</div>
			)}

			<div className="min-h-72">
				{!isPreviewing ? (
					<div className="flex min-h-72 min-w-0 flex-col">
						<textarea
							ref={textareaRef}
							value={markdown}
							onChange={(event) => updateMarkdown(event.target.value)}
							className="min-h-64 flex-1 resize-y bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
							placeholder="Напишіть Markdown..."
							aria-label="Markdown текст статті"
						/>
					</div>
				) : (
					<MDViewer
						className="min-h-64 overflow-auto p-4 text-[0.9375rem] leading-6 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:font-semibold [&_h5]:mb-2 [&_h5]:font-semibold [&_h6]:mb-2 [&_h6]:font-semibold"
						preserveLineBreaks
						components={{
							"youtube-video": ({ id, children }) => (
								<iframe
									title="YouTube відео"
									src={`https://www.youtube.com/embed/${String(id ?? "")}`}
									className="my-4 aspect-video w-full rounded-lg border-0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowFullScreen
								>
									{children}
								</iframe>
							),
						}}
					>
						{markdown.trim() ? markdown : "Перегляд з’явиться тут."}
					</MDViewer>
				)}
			</div>

			<p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
				Цей редактор працює окремо від поля «Зміст» і не змінює його автоматично.
			</p>
		</section>
	);
}
