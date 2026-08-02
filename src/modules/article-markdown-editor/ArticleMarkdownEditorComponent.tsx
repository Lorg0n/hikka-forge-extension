import {
	type ClipboardEvent as ReactClipboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { Code2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useContentUI } from "@/contexts/ContentUIContext";
import { uploadArticleImage } from "@/services/articleImageUploadService";
import { editorApi, editorIds } from "@/services/editorApiService";

import { markdownToPlate, plateToMarkdown } from "./articleMarkdownConverter";

type MarkdownAction =
	| "paragraph"
	| "heading3"
	| "bold"
	| "italic"
	| "quote"
	| "spoiler"
	| "link"
	| "list"
	| "orderedList";

const MENU_ACTIONS: Record<string, MarkdownAction> = {
	"Параграф": "paragraph",
	"Заголовок 3": "heading3",
	"Цитата": "quote",
	"Спойлер": "spoiler",
	"Непозначений список": "list",
	"Маркований список": "list",
	"Нумерований список": "orderedList",
};

function getYouTubeVideoId(value: string): string | null {
	try {
		const url = new URL(value);
		if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
		if (!url.hostname.includes("youtube.com")) return null;
		return url.searchParams.get("v") || url.pathname.split("/").pop() || null;
	} catch {
		return null;
	}
}

function applyMarkdownAction(
	textarea: HTMLTextAreaElement,
	action: MarkdownAction,
	argument?: string,
) {
	const value = textarea.value;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const selected = value.slice(start, end);
	let insertion = selected;
	let selectionStart = start;
	let selectionEnd = end;

	switch (action) {
		case "paragraph":
			insertion = selected || "Текст параграфа";
			selectionEnd = start + insertion.length;
			break;
		case "heading3":
			insertion = `### ${selected || "Заголовок"}`;
			selectionStart = start + 4;
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
			insertion = (selected || "Цитата")
				.split("\n")
				.map((line) => `> ${line}`)
				.join("\n");
			selectionStart = start + 2;
			selectionEnd = start + insertion.length;
			break;
		case "spoiler":
			insertion = `:::spoiler\n${selected || "Текст спойлера"}\n:::`;
			selectionStart = start + 11;
			selectionEnd = selectionStart + (selected || "Текст спойлера").length;
			break;
		case "link": {
			const text = selected || "текст посилання";
			insertion = `[${text}](${argument || "https://"})`;
			selectionStart = start + 1;
			selectionEnd = selectionStart + text.length;
			break;
		}
		case "list":
			insertion = (selected || "Елемент списку")
				.split("\n")
				.map((line) => `- ${line}`)
				.join("\n");
			selectionStart = start + 2;
			selectionEnd = start + insertion.length;
			break;
		case "orderedList":
			insertion = (selected || "Елемент списку")
				.split("\n")
				.map((line, index) => `${index + 1}. ${line}`)
				.join("\n");
			selectionStart = start + 3;
			selectionEnd = start + insertion.length;
			break;
	}

	return {
		value: `${value.slice(0, start)}${insertion}${value.slice(end)}`,
		selectionStart,
		selectionEnd,
	};
}

export default function ArticleMarkdownEditorComponent() {
	const contentUI = useContentUI();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const editor = useRef(
		editorApi(editorIds.article, { timeout: 2000 }),
	).current;
	const originalEditorRef = useRef<HTMLElement | null>(null);
	const originalEditorBodyRef = useRef<HTMLElement | null>(null);
	const originalDisplayRef = useRef("");
	const insertMenuOpenRef = useRef(false);
	const submitRetryRef = useRef(false);
	const syncSequenceRef = useRef(0);
	const [markdown, setMarkdown] = useState("");
	const [mode, setMode] = useState<"visual" | "markdown">("visual");
	const [isSwitching, setIsSwitching] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncError, setSyncError] = useState<string | null>(null);
	const [history, setHistory] = useState<string[]>([]);
	const [future, setFuture] = useState<string[]>([]);
	const [toolbarTarget, setToolbarTarget] = useState<HTMLElement | null>(null);
	const [markdownTarget, setMarkdownTarget] = useState<HTMLElement | null>(
		null,
	);

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

		originalEditorBodyRef.current = editable;
		originalDisplayRef.current = editable.style.display;
		setMarkdownTarget(editable.parentElement);
		return editable;
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
			const original = getOriginalEditor();
			if (!original || !event.target.contains(original)) return;
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
	}, [getOriginalEditor, markdown, mode, syncToOriginal]);

	const openMarkdownMode = async () => {
		setIsSwitching(true);
		setSyncError(null);
		try {
			const value = await editor.get();
			const nextMarkdown = plateToMarkdown(value);
			setMarkdown(nextMarkdown);
			setHistory([]);
			setFuture([]);
			const editable = getOriginalEditorBody();
			setMarkdownTarget(editable?.parentElement ?? null);
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

	const runMarkdownAction = (action: MarkdownAction, argument?: string) => {
		if (!textareaRef.current) return;
		const result = applyMarkdownAction(textareaRef.current, action, argument);
		updateMarkdown(result.value, result.selectionStart, result.selectionEnd);
	};

	const insertTextAtCursor = (text: string) => {
		if (!textareaRef.current) return;
		const { selectionStart, selectionEnd, value } = textareaRef.current;
		updateMarkdown(
			`${value.slice(0, selectionStart)}${text}${value.slice(selectionEnd)}`,
			selectionStart + text.length,
			selectionStart + text.length,
		);
	};

	const undo = () => {
		const previous = history[history.length - 1];
		if (previous === undefined) return;
		setHistory((current) => current.slice(0, -1));
		setFuture((current) => [markdown, ...current]);
		setMarkdown(previous);
		window.requestAnimationFrame(() => textareaRef.current?.focus());
	};

	const redo = () => {
		const next = future[0];
		if (next === undefined) return;
		setFuture((current) => current.slice(1));
		setHistory((current) => [...current, markdown]);
		setMarkdown(next);
		window.requestAnimationFrame(() => textareaRef.current?.focus());
	};

	const insertImages = async (files: FileList | File[] | null) => {
		const imageFiles = Array.from(files ?? []).filter((file) =>
			file.type.startsWith("image/"),
		);
		if (imageFiles.length === 0 || !textareaRef.current) return;

		const selectionStart = textareaRef.current.selectionStart;
		const selectionEnd = textareaRef.current.selectionEnd;
		const value = textareaRef.current.value;
		const results = await Promise.allSettled(
			imageFiles.map(async (file) => ({
				alt: file.name.replace(/\.[^.]+$/, "") || "Зображення",
				...(await uploadArticleImage(file)),
			})),
		);
		const uploaded = results.flatMap((result) =>
			result.status === "fulfilled" ? [result.value] : [],
		);
		if (uploaded.length === 0) return;

		const images = uploaded
			.map(({ alt, url }) => `![${alt.replace(/\]|\[/g, "")}](${url})`)
			.join("\n\n");
		updateMarkdown(
			`${value.slice(0, selectionStart)}${images}${value.slice(selectionEnd)}`,
			selectionStart + images.length,
			selectionStart + images.length,
		);
	};

	const handlePaste = (event: ReactClipboardEvent<HTMLTextAreaElement>) => {
		const files = Array.from(event.clipboardData?.items ?? [])
			.filter((item) => item.kind === "file" && item.type.startsWith("image/"))
			.map((item) => item.getAsFile())
			.filter((file): file is File => file !== null);
		if (files.length === 0) return;
		event.preventDefault();
		void insertImages(files);
	};

	useEffect(() => {
		if (mode !== "markdown" || !toolbarTarget) return;

		const historyButtons = Array.from(
			toolbarTarget.querySelectorAll<HTMLButtonElement>("button"),
		).filter(
			(button) =>
				button.querySelector("svg.lucide-undo-2, svg.lucide-undo2") ||
				button.querySelector("svg.lucide-redo-2, svg.lucide-redo2"),
		);
		const disabledStates = new Map(
			historyButtons.map((button) => [button, button.disabled]),
		);
		const enableHistoryButtons = () => {
			for (const button of historyButtons) button.disabled = false;
		};
		enableHistoryButtons();
		const disabledObserver = new MutationObserver(enableHistoryButtons);
		for (const button of historyButtons) {
			disabledObserver.observe(button, {
				attributes: true,
				attributeFilter: ["disabled"],
			});
		}

		const handleToolbarClick = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const button = target.closest<HTMLButtonElement>("button");
			if (!button || !toolbarTarget.contains(button)) return;

			if (button.querySelector("svg.lucide-plus")) {
				insertMenuOpenRef.current = true;
				return;
			}
			if (button.querySelector("svg.lucide-smile")) return;
			if (button.querySelector('input[type="file"]')) return;

			let action: (() => void) | undefined;
			if (button.querySelector("svg.lucide-bold")) {
				action = () => runMarkdownAction("bold");
			} else if (button.querySelector("svg.lucide-italic")) {
				action = () => runMarkdownAction("italic");
			} else if (button.querySelector("svg.lucide-link")) {
				action = () => {
					const url = window.prompt("Посилання", "https://");
					if (url?.trim()) runMarkdownAction("link", url.trim());
				};
			} else if (button.querySelector("svg.lucide-film")) {
				action = () => {
					const url = window.prompt("Посилання на YouTube відео");
					if (!url?.trim()) return;
					const videoId = getYouTubeVideoId(url.trim());
					if (videoId) {
						insertTextAtCursor(`\n::youtube-video[YouTube відео]{#${videoId}}\n`);
					}
				};
			} else if (
				button.querySelector("svg.lucide-undo-2, svg.lucide-undo2")
			) {
				action = undo;
			} else if (
				button.querySelector("svg.lucide-redo-2, svg.lucide-redo2")
			) {
				action = redo;
			}

			if (!action) return;
			event.preventDefault();
			event.stopImmediatePropagation();
			action();
		};

		const handleFileChange = (event: Event) => {
			const input = event.target;
			if (
				!(input instanceof HTMLInputElement) ||
				input.type !== "file" ||
				!toolbarTarget.contains(input)
			)
				return;
			event.stopImmediatePropagation();
			void insertImages(input.files).finally(() => {
				input.value = "";
			});
		};

		const handlePortalClick = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) return;

			const emojiButton = target.closest<HTMLButtonElement>("button[aria-label]");
			if (emojiButton?.querySelector('[data-emoji-set="native"]')) {
				const emoji = emojiButton.getAttribute("aria-label");
				if (emoji) insertTextAtCursor(emoji);
				return;
			}

			if (!insertMenuOpenRef.current) return;
			const menuItem = target.closest<HTMLElement>('[role="menuitem"]');
			if (!menuItem) return;
			insertMenuOpenRef.current = false;
			const action = MENU_ACTIONS[menuItem.textContent?.trim() ?? ""];
			if (action) runMarkdownAction(action);
		};

		toolbarTarget.addEventListener("click", handleToolbarClick, true);
		toolbarTarget.addEventListener("change", handleFileChange, true);
		document.addEventListener("click", handlePortalClick, true);
		return () => {
			disabledObserver.disconnect();
			for (const [button, disabled] of disabledStates) button.disabled = disabled;
			toolbarTarget.removeEventListener("click", handleToolbarClick, true);
			toolbarTarget.removeEventListener("change", handleFileChange, true);
			document.removeEventListener("click", handlePortalClick, true);
			insertMenuOpenRef.current = false;
		};
	}, [future, history, markdown, mode, toolbarTarget]);

	const modeButton = (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			className="h-8 min-w-8 cursor-pointer gap-1 rounded-md bg-transparent px-1.5 transition-[color,box-shadow] outline-hidden hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-muted data-[state=on]:text-accent-foreground"
			onClick={() =>
				void (mode === "markdown" ? openVisualMode() : openMarkdownMode())
			}
			disabled={isSwitching}
			aria-pressed={mode === "markdown"}
			data-state={mode === "markdown" ? "on" : "off"}
			title={
				mode === "markdown"
					? "Повернутися до візуального редактора"
					: "Увімкнути Markdown режим"
			}
			data-orientation="horizontal"
		>
			{isSwitching || isSyncing ? (
				<LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
			) : (
				<Code2 className="size-4" aria-hidden="true" />
			)}
			<span>MD</span>
		</Button>
	);

	const toolbarModePortal = toolbarTarget
		? createPortal(
					<div className="group/toolbar-group relative flex">
						<div className="flex items-center">{modeButton}</div>
					</div>,
					toolbarTarget,
				)
		: null;

	const markdownEditorPortal =
		markdownTarget && mode === "markdown"
			? createPortal(
					<textarea
						ref={textareaRef}
						value={markdown}
						onChange={(event) => updateMarkdown(event.target.value)}
						onPaste={handlePaste}
						className="min-h-44 flex-1 resize-y rounded-md bg-transparent p-4 font-mono text-sm leading-6 text-foreground ring-offset-background outline-none placeholder:text-muted-foreground/80"
						placeholder="Напишіть Markdown..."
						aria-label="Markdown текст статті"
					/>,
					markdownTarget,
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
			{toolbarModePortal}
			{!toolbarTarget && (
				<div className="mt-2 flex justify-end">{modeButton}</div>
			)}
			{markdownEditorPortal}
			{syncError && (
				<p
					className="mt-1 text-right text-xs text-destructive"
					role="alert"
				>
					{syncError}
				</p>
			)}
		</>
	);
}
