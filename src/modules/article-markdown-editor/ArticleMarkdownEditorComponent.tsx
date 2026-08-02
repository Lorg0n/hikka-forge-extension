import {
	type ClipboardEvent as ReactClipboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import {
	Bold,
	ChevronDown,
	Check,
	Code2,
	Copy,
	EyeOff,
	Film,
	Heading2,
	Image,
	Italic,
	Link2,
	List,
	ListOrdered,
	Plus,
	Redo2,
	Quote,
	RotateCcw,
	Smile,
	Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useContentUI } from "@/contexts/ContentUIContext";
import { uploadArticleImage } from "@/services/articleImageUploadService";
import { editorApi, editorIds } from "@/services/editorApiService";

import { markdownToPlate, plateToMarkdown } from "./articleMarkdownConverter";

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
		return url.searchParams.get("v") || url.pathname.split("/").pop() || null;
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
	const contentUI = useContentUI();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const editor = useRef(
		editorApi(editorIds.article, { timeout: 2000 }),
	).current;
	const originalEditorRef = useRef<HTMLElement | null>(null);
	const originalEditorBodyRef = useRef<HTMLElement | null>(null);
	const originalDisplayRef = useRef("");
	const submitRetryRef = useRef(false);
	const syncSequenceRef = useRef(0);
	const [markdown, setMarkdown] = useState("");
	const [copied, setCopied] = useState(false);
	const [mode, setMode] = useState<"visual" | "markdown">("visual");
	const [isSwitching, setIsSwitching] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncError, setSyncError] = useState<string | null>(null);
	const [emojiOpen, setEmojiOpen] = useState(false);
	const [history, setHistory] = useState<string[]>([]);
	const [future, setFuture] = useState<string[]>([]);
	const [uploadingImages, setUploadingImages] = useState(0);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null);

	const getOriginalEditor = useCallback(() => {
		if (originalEditorRef.current?.isConnected)
			return originalEditorRef.current;
		const sibling = contentUI?.host.previousElementSibling;
		if (!(sibling instanceof HTMLElement)) return null;
		originalEditorRef.current = sibling;
		originalDisplayRef.current = sibling.style.display;
		return sibling;
	}, [contentUI]);

	const getOriginalEditorBody = useCallback(() => {
		if (originalEditorBodyRef.current?.isConnected)
			return originalEditorBodyRef.current;
		const original = getOriginalEditor();
		const editable = original?.querySelector<HTMLElement>(
			'[data-slate-editor="true"]',
		);
		if (!original || !editable) return null;

		let body = editable;
		while (body.parentElement && body.parentElement !== original) {
			body = body.parentElement;
		}
		originalEditorBodyRef.current = body;
		originalDisplayRef.current = body.style.display;
		return body;
	}, [getOriginalEditor]);

	const setOriginalEditorVisible = useCallback(
		(visible: boolean) => {
			const body = getOriginalEditorBody();
			if (!body) return;
			body.style.display = visible ? originalDisplayRef.current : "none";
		},
		[getOriginalEditorBody],
	);

	useEffect(() => {
		const original = getOriginalEditor();
		if (!original) return;

		const updateToolbarTarget = () => {
			const toolbar = original.querySelector<HTMLElement>(
				'[role="toolbar"][variant="top"], [role="toolbar"][aria-orientation="horizontal"]',
			);
			const content = toolbar?.firstElementChild;
			setToolbarTarget(content instanceof HTMLElement ? content : toolbar);
		};

		updateToolbarTarget();
		const observer = new MutationObserver(updateToolbarTarget);
		observer.observe(original, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, [getOriginalEditor]);

	const syncToOriginal = useCallback(
		async (value: string) => {
			const sequence = ++syncSequenceRef.current;
			setIsSyncing(true);
			setSyncError(null);
			try {
				await editor.set(markdownToPlate(value));
			} catch (error) {
				if (sequence === syncSequenceRef.current) {
					setSyncError(
						error instanceof Error
							? error.message
							: "Не вдалося оновити оригінальний редактор.",
					);
				}
				throw error;
			} finally {
				if (sequence === syncSequenceRef.current) setIsSyncing(false);
			}
		},
		[editor],
	);

	useEffect(() => {
		return () => setOriginalEditorVisible(true);
	}, [setOriginalEditorVisible]);

	useEffect(() => {
		if (mode !== "markdown") return;
		const timer = window.setTimeout(() => {
			void syncToOriginal(markdown).catch(() => undefined);
		}, 300);
		return () => window.clearTimeout(timer);
	}, [markdown, mode, syncToOriginal]);

	useEffect(() => {
		if (mode !== "markdown") return;

		const handleSubmit = (event: SubmitEvent) => {
			if (!(event.target instanceof HTMLFormElement)) return;
			if (submitRetryRef.current) {
				submitRetryRef.current = false;
				return;
			}

			event.preventDefault();
			event.stopImmediatePropagation();
			const form = event.target;
			const submitter =
				event.submitter instanceof HTMLElement ? event.submitter : undefined;
			void syncToOriginal(markdown)
				.then(() => {
					submitRetryRef.current = true;
					form.requestSubmit(
						submitter instanceof HTMLButtonElement ||
							submitter instanceof HTMLInputElement
							? submitter
							: undefined,
					);
				})
				.catch(() => undefined);
		};

		document.addEventListener("submit", handleSubmit, true);
		return () => document.removeEventListener("submit", handleSubmit, true);
	}, [markdown, mode, syncToOriginal]);

	const openMarkdownMode = async () => {
		setIsSwitching(true);
		setSyncError(null);
		try {
			const value = await editor.get();
			const nextMarkdown = plateToMarkdown(value);
			setMarkdown(nextMarkdown);
			setHistory([]);
			setFuture([]);
			setOriginalEditorVisible(false);
			setMode("markdown");
			window.requestAnimationFrame(() => textareaRef.current?.focus());
		} catch (error) {
			setSyncError(
				error instanceof Error
					? error.message
					: "Не вдалося прочитати оригінальний редактор.",
			);
		} finally {
			setIsSwitching(false);
		}
	};

	const openVisualMode = async () => {
		setIsSwitching(true);
		try {
			await syncToOriginal(markdown);
			setOriginalEditorVisible(true);
			setMode("visual");
		} catch {
			// Keep Markdown visible until its value is accepted by the editor.
		} finally {
			setIsSwitching(false);
		}
	};

	const updateMarkdown = (nextValue: string, start?: number, end?: number) => {
		if (nextValue === markdown) return;
		setHistory((current) => [...current.slice(-49), markdown]);
		setFuture([]);
		setMarkdown(nextValue);
		window.requestAnimationFrame(() => {
			if (!textareaRef.current || start === undefined || end === undefined)
				return;
			textareaRef.current.focus();
			textareaRef.current.setSelectionRange(start, end);
		});
	};

	const undo = () => {
		const previous = history[history.length - 1];
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
		setUploadError(null);
		imageInputRef.current?.click();
	};

	const insertUploadedImages = (
		images: Array<{ alt: string; url: string }>,
	) => {
		if (images.length === 0 || !textareaRef.current) return;
		const { selectionStart, selectionEnd, value } = textareaRef.current;
		const markdownImages = images
			.map(({ alt, url }) => `![${alt.replace(/\]|\[/g, "")}](${url})`)
			.join("\n\n");
		const nextValue = `${value.slice(0, selectionStart)}${markdownImages}${value.slice(selectionEnd)}`;
		updateMarkdown(
			nextValue,
			selectionStart + markdownImages.length,
			selectionStart + markdownImages.length,
		);
	};

	const insertImages = async (files: FileList | File[] | null) => {
		const imageFiles = Array.from(files ?? []).filter((file) =>
			file.type.startsWith("image/"),
		);
		if (imageFiles.length === 0) return;

		setUploadError(null);
		setUploadingImages(imageFiles.length);
		const results = await Promise.allSettled(
			imageFiles.map(async (file) => ({
				alt: file.name.replace(/\.[^.]+$/, "") || "Зображення",
				...(await uploadArticleImage(file)),
			})),
		);
		const uploaded = results.flatMap((result) =>
			result.status === "fulfilled" ? [result.value] : [],
		);
		const failed = results.find((result) => result.status === "rejected");
		if (failed?.status === "rejected") {
			setUploadError(
				failed.reason instanceof Error
					? failed.reason.message
					: "Не вдалося завантажити зображення.",
			);
		}
		insertUploadedImages(uploaded);
		setUploadingImages(0);
		if (imageInputRef.current) imageInputRef.current.value = "";
	};

	const handlePaste = (event: ReactClipboardEvent<HTMLTextAreaElement>) => {
		const clipboardItems = Array.from(event.clipboardData?.items ?? []);
		const files = clipboardItems
			.filter((item) => item.kind === "file" && item.type.startsWith("image/"))
			.map((item) => item.getAsFile())
			.filter((file): file is File => file !== null);
		if (files.length === 0) return;

		event.preventDefault();
		void insertImages(files);
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

	const modeButton = (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className="h-8 min-w-8 cursor-pointer gap-1 rounded-md bg-transparent px-1.5 transition-[color,box-shadow] outline-hidden hover:bg-muted hover:text-muted-foreground aria-pressed:bg-muted aria-pressed:text-accent-foreground"
			onClick={() =>
				void (mode === "markdown" ? openVisualMode() : openMarkdownMode())
			}
			disabled={isSwitching}
			aria-pressed={mode === "markdown"}
			title={
				mode === "markdown"
					? "Повернутися до візуального редактора"
					: "Увімкнути Markdown режим"
			}
			data-state="closed"
			data-orientation="horizontal"
		>
			<Code2 className="size-4" aria-hidden="true" />
			<span>MD</span>
		</Button>
	);

	const toolbarModePortal = toolbarTarget && mode === "visual"
		? createPortal(
				<div className="group/toolbar-group relative flex">
					<div className="flex items-center">{modeButton}</div>
				</div>,
				toolbarTarget,
			)
		: null;

	if (mode === "visual") {
		return (
			<>
				{toolbarModePortal}
				{!toolbarTarget && (
					<div className="mt-2 flex justify-end">{modeButton}</div>
				)}
				{syncError && (
					<p className="mt-1 text-right text-xs text-destructive" role="alert">
						{syncError}
					</p>
				)}
			</>
		);
	}

	return (
		<>
			<section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/35 px-3 py-2">
					<div className="flex items-center gap-1">
						{modeButton}
						<div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
						<button
							type="button"
							className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
							onClick={() => updateMarkdown("")}
							title="Очистити редактор"
						>
							<RotateCcw className="size-3.5" aria-hidden="true" />
							Очистити
						</button>
						<button
							type="button"
							className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
					<span
						className={`text-xs ${syncError ? "text-destructive" : "text-muted-foreground"}`}
					>
						{syncError ??
							(isSyncing ? "Синхронізація..." : "Збережено в редакторі Hikka")}
					</span>
				</div>

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
					<ToolbarButton
						label="Зображення"
						icon={Image}
						onClick={insertImage}
					/>
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

				<div className="flex min-h-72 min-w-0 flex-col">
					<textarea
						ref={textareaRef}
						value={markdown}
						onChange={(event) => updateMarkdown(event.target.value)}
						onPaste={handlePaste}
						className="min-h-72 flex-1 resize-y bg-transparent p-4 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
						placeholder="Напишіть Markdown..."
						aria-label="Markdown текст статті"
					/>
				</div>
				{(uploadingImages > 0 || uploadError) && (
					<p
						className={`border-t border-border px-4 py-2 text-xs ${uploadError ? "text-destructive" : "text-muted-foreground"}`}
						role={uploadError ? "alert" : undefined}
					>
						{uploadError ?? `Завантаження зображень: ${uploadingImages}...`}
					</p>
				)}

				<p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
					Вставте зображення через Ctrl+V або кнопку «Зображення» — воно
					завантажиться як вкладення Hikka та вставиться у Markdown.
				</p>
			</section>
		</>
	);
}
