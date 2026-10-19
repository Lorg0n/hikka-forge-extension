import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import forgeLogo from "@/assets/logo.svg";
import { editorApi, editorIds, type EditorNode, type EditorValue } from "@/services/editorApiService";
import { StickerService, type StickerCategory, type StickerItem } from "@/services/stickerService";

const COMMENTS = "#comments";
const COMMENT_TOOLBAR = `${COMMENTS} [role="toolbar"][aria-orientation="horizontal"]`;
const MOBILE_TOOLBAR = `[data-slot="page-sheet-content"] [role="toolbar"][aria-orientation="horizontal"]`;
const TOOLBAR = `${COMMENT_TOOLBAR}, ${MOBILE_TOOLBAR}`;
const TOKEN = /:emote\[([a-z0-9-]+)\]:/gi;
const IMAGE = "[data-hikka-forge-sticker]";
const stickerItems = new Map<string, StickerItem>();
let stickerCatalog: Promise<StickerItem[]> | null = null;

const stickerWidthUnits = (item: StickerItem): number => {
	const value = Number(item.widthUnits);
	return Number.isFinite(value) ? Math.min(12, Math.max(1, Math.round(value))) : 1;
};

type PickerAnchor = {
	element: HTMLElement;
};

function loadStickerCatalog(): Promise<StickerItem[]> {
	if (!stickerCatalog) {
		stickerCatalog = StickerService.listAllPacks()
			.then((packs) => StickerService.listAllItems(packs))
			.then((items) => {
				items.forEach((item) => stickerItems.set(item.slug, item));
				return items;
			})
			.catch((error) => {
				stickerCatalog = null;
				throw error;
			});
	}
	return stickerCatalog;
}

function hasEditorContent(nodes: EditorNode[]): boolean {
	return nodes.some((node) => "text" in node
		? node.text.trim().length > 0
		: hasEditorContent(node.children));
}

function appendToLastTextNode(nodes: EditorNode[], text: string): boolean {
	for (let index = nodes.length - 1; index >= 0; index -= 1) {
		const node = nodes[index];
		if ("text" in node) {
			node.text += text;
			return true;
		}
		if (appendToLastTextNode(node.children, text)) return true;
	}
	return false;
}

async function insertSticker(editorId: string, slug: string) {
	const editor = editorApi(editorId);
	const value: EditorValue = await editor.get();
	const token = `:emote[${slug}]:`;

	if (hasEditorContent(value)) {
		if (!appendToLastTextNode(value, ` ${token}`)) {
			throw new Error("The editor document has no text node to append the sticker to.");
		}
		await editor.set(value);
		return;
	}

	await editor.set([{ type: "p", children: [{ text: token }] }]);
}

function contentEditorId(): string | null {
	const segments = window.location.pathname.split("/").filter(Boolean);
	const slug = segments.at(-1);
	const type = segments.at(-2)?.replace(/s$/, "");
	return type && slug
		? editorIds.comment(type as Parameters<typeof editorIds.comment>[0], decodeURIComponent(slug))
		: null;
}

function toolbarForAnchor(anchor: HTMLElement): HTMLElement {
	return anchor.closest<HTMLElement>(COMMENT_TOOLBAR) ??
		anchor.closest<HTMLElement>(MOBILE_TOOLBAR) ??
		anchor;
}

function renderTokens(root: HTMLElement, items: Map<string, StickerItem>) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];
	let node: Node | null;
	while ((node = walker.nextNode())) {
		const text = node as Text;
		if (text.parentElement?.closest(`${IMAGE}, [contenteditable="true"]`)) continue;
		TOKEN.lastIndex = 0;
		if (TOKEN.test(text.data)) nodes.push(text);
	}
	for (const text of nodes) {
		TOKEN.lastIndex = 0;
		const fragment = document.createDocumentFragment();
		let cursor = 0;
		let match: RegExpExecArray | null;
		while ((match = TOKEN.exec(text.data))) {
			fragment.append(document.createTextNode(text.data.slice(cursor, match.index)));
			const slug = match[1];
			const item = slug ? items.get(slug) : undefined;
			if (!item) {
				fragment.append(document.createTextNode(match[0]));
			} else {
				const wrapper = document.createElement("span");
				const image = document.createElement("img");
				wrapper.dataset.hikkaForgeSticker = slug;
				wrapper.title = match[0];
				wrapper.style.display = "inline-flex";
				wrapper.style.verticalAlign = "middle";
				wrapper.style.margin = "0 0.12em";
					wrapper.style.width = `${stickerWidthUnits(item) * 3}em`;
					wrapper.style.maxWidth = "100%";
					wrapper.style.height = "3em";
				image.src = item.url;
				image.alt = item.alt ?? item.title;
				image.loading = "lazy";
				image.decoding = "async";
					image.style.width = "100%";
					image.style.height = "100%";
				image.style.objectFit = "contain";
					image.style.objectPosition = "left center";
				wrapper.append(image);
				fragment.append(wrapper);
			}
			cursor = match.index + match[0].length;
		}
		fragment.append(document.createTextNode(text.data.slice(cursor)));
		text.replaceWith(fragment);
	}
}

function editorCandidates(toolbar: HTMLElement): string[] {
	const commentThread = toolbar.closest<HTMLElement>(".comment-thread[id]")?.id;
	const reference = toolbar.closest("[data-reference], [data-comment-reference]")?.getAttribute("data-reference") ??
		toolbar.closest("[data-comment-reference]")?.getAttribute("data-comment-reference");
	const threadCandidates = commentThread ? [editorIds.reply(commentThread), editorIds.edit(commentThread)] : [];
	const referenceCandidates = reference ? [editorIds.reply(reference), editorIds.edit(reference)] : [];
	const root = contentEditorId();
	const result = root ? [...threadCandidates, ...referenceCandidates, root] : [...threadCandidates, ...referenceCandidates];
	return [...new Set(result)];
}

function pickerPosition(anchor: HTMLElement, panelHeight: number) {
	const rect = anchor.getBoundingClientRect();
	const panelWidth = 320;
	const left = Math.max(8, Math.min(rect.left + rect.width / 2 - panelWidth / 2, window.innerWidth - panelWidth - 8));
	const aboveTop = rect.top - panelHeight - 8;
	const belowTop = rect.bottom + 8;
	const top = aboveTop >= 8
		? aboveTop
		: Math.min(belowTop, window.innerHeight - panelHeight - 8);
	return { left, top };
}

function StickerPreview({ item }: { item: StickerItem }) {
	const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
	const [attempt, setAttempt] = useState(0);
	useEffect(() => { setStatus("loading"); setAttempt(0); }, [item.url]);
	const fill: React.CSSProperties = {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		width: "100%",
		height: "100%",
	};
	return <span className={`overflow-hidden rounded-md ${status === "loaded" ? "bg-transparent" : "bg-muted/40"}`} style={{ position: "absolute", display: "block", top: 4, right: 4, bottom: 4, left: 4 }}>
		{status === "loading" && <span className="flex items-center justify-center" style={fill}><span className="animate-spin rounded-full border-2 border-muted-foreground/25 border-t-muted-foreground" style={{ display: "block", width: 16, height: 16 }} /></span>}
		{status === "error" && <span role="button" tabIndex={0} className="flex items-center justify-center text-xs text-muted-foreground hover:text-foreground" style={fill} title="Повторити завантаження" onClick={(event) => { event.stopPropagation(); setStatus("loading"); setAttempt((value) => value + 1); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.stopPropagation(); setStatus("loading"); setAttempt((value) => value + 1); } }}>↻</span>}
		<img key={attempt} src={item.url} alt={item.alt ?? item.title} onLoad={() => setStatus("loaded")} onError={() => setStatus("error")} ref={(image) => { if (image?.complete && image.naturalWidth > 0) setStatus("loaded"); }} className="m-auto object-contain transition-opacity" style={{ ...fill, display: "block", opacity: status === "loaded" ? 1 : 0 }} />
	</span>;
}

async function findEditor(toolbar: HTMLElement): Promise<string | null> {
	for (const id of editorCandidates(toolbar)) {
		try {
			await editorApi(id, { timeout: 1_000 }).get();
			return id;
		} catch { /* editor is not mounted */ }
	}
	return null;
}

function Picker({ anchor, onClose }: { anchor: PickerAnchor; onClose: () => void }) {
	const [items, setItems] = useState<StickerItem[]>([]);
	const [categories, setCategories] = useState<StickerCategory[]>([]);
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [insertionError, setInsertionError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [editorId, setEditorId] = useState<string | null>(null);
	const [position, setPosition] = useState(() => pickerPosition(anchor.element, 280));
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		void Promise.all([StickerService.listCategories(), loadStickerCatalog()])
			.then(([nextCategories, nextItems]) => { if (active) { setCategories(nextCategories); setItems(nextItems); nextItems.forEach((item) => stickerItems.set(item.slug, item)); } })
			.catch((value) => active && setError(value instanceof Error ? value.message : String(value)))
			.finally(() => active && setLoading(false));
		void findEditor(toolbarForAnchor(anchor.element)).then(setEditorId);
		return () => { active = false; };
	}, [anchor, reloadKey]);

	useEffect(() => {
		const close = (event: MouseEvent) => {
			const path = event.composedPath();
			if (!path.includes(ref.current as EventTarget) && !path.includes(anchor.element)) onClose();
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [anchor, onClose]);

	useLayoutEffect(() => {
		const updatePosition = () => {
			const panelHeight = Math.min(ref.current?.offsetHeight ?? 280, window.innerHeight - 16);
			const nextPosition = pickerPosition(anchor.element, panelHeight);
			if (!ref.current) {
				setPosition(nextPosition);
				return;
			}
			ref.current.style.left = `${nextPosition.left}px`;
			ref.current.style.top = `${nextPosition.top}px`;
		};
		let frame: number | null = null;
		const schedulePositionUpdate = () => {
			if (frame !== null) return;
			frame = window.requestAnimationFrame(() => {
				frame = null;
				updatePosition();
			});
		};
		updatePosition();
		window.addEventListener("scroll", schedulePositionUpdate, true);
		window.addEventListener("resize", schedulePositionUpdate);
		return () => {
			if (frame !== null) window.cancelAnimationFrame(frame);
			window.removeEventListener("scroll", schedulePositionUpdate, true);
			window.removeEventListener("resize", schedulePositionUpdate);
		};
	}, [anchor, categories.length, error, items.length, loading, query]);

	const visible = useMemo(() => items.filter((item) =>
		(!category || item.categories.some((value) => value.slug === category)) &&
		(!query || `${item.title} ${item.slug}`.toLowerCase().includes(query.toLowerCase()))), [items, category, query]);
	const selectSticker = async (item: StickerItem) => {
		const toolbar = toolbarForAnchor(anchor.element);
		const candidates = [...new Set([editorId, ...editorCandidates(toolbar)].filter((id): id is string => Boolean(id)))];
		setInsertionError(null);

		for (const candidate of candidates) {
			try {
				await insertSticker(candidate, item.slug);
				setEditorId(candidate);
				onClose();
				return;
			} catch { /* try the next mounted editor */ }
		}
		setInsertionError(`Не вдалося знайти активний редактор (${candidates.join(", ") || "ID не визначено"}).`);
	};
	return createPortal(<div ref={ref} className="fixed w-80 max-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border bg-popover p-2 text-popover-foreground shadow-md" style={{ ...position, zIndex: 2147483647, isolation: "isolate" }}>
		<div className="mb-2 flex items-center gap-2"><div className="relative min-w-0 flex-1"><svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук стікерів" className="h-10 w-full rounded-full border-0 bg-muted pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none" /></div></div>
		<div className="mb-3 flex gap-1 overflow-x-auto"><button type="button" onClick={() => setCategory(null)} className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${!category ? "border-sky-600/80 bg-sky-500/10 text-sky-700 dark:border-sky-400/80 dark:bg-sky-400/10 dark:text-sky-300" : "border-border bg-muted/60 text-foreground/75 hover:bg-muted hover:text-foreground dark:bg-white/[0.08] dark:text-muted-foreground dark:hover:bg-white/[0.12]"}`}>Усі</button>{categories.map((value) => <button type="button" key={value.slug} onClick={() => setCategory(value.slug)} className={`whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs transition-colors ${category === value.slug ? "border-sky-600/80 bg-sky-500/10 text-sky-700 dark:border-sky-400/80 dark:bg-sky-400/10 dark:text-sky-300" : "border-border bg-muted/60 text-foreground/75 hover:bg-muted hover:text-foreground dark:bg-white/[0.08] dark:text-muted-foreground dark:hover:bg-white/[0.12]"}`}>{value.title}</button>)}</div>
		{error && <div className="flex items-center justify-between gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive"><span>Не вдалося завантажити стікери.</span><button type="button" className="rounded-md border border-destructive/30 px-2 py-1 text-xs hover:bg-destructive/10" onClick={() => setReloadKey((value) => value + 1)}>Повторити</button></div>}
		{insertionError && <p className="px-2 pb-2 text-xs text-destructive">{insertionError}</p>}
				{loading && <div className="flex max-h-64 flex-wrap content-start gap-2 overflow-hidden" style={{ maxHeight: "16rem" }}>{Array.from({ length: 5 }, (_, index) => <span key={index} className="shrink-0 animate-pulse rounded-md bg-muted" style={{ display: "block", width: "3.25rem", height: "3.25rem" }} />)}</div>}
			{!loading && !error && <div className="flex max-h-64 flex-wrap content-start items-start gap-2 overflow-y-auto" style={{ maxHeight: "16rem" }}>{visible.map((item) => { const widthUnits = stickerWidthUnits(item); return <button type="button" key={item.slug} title={item.title} style={{ width: `min(${widthUnits * 3.25}rem, 100%)`, height: "3.25rem", contain: "layout size paint" }} onClick={(event) => { event.stopPropagation(); void selectSticker(item).catch(console.warn); }} className="relative block min-h-0 min-w-0 shrink-0 overflow-hidden rounded-md hover:bg-muted"><StickerPreview item={item} /></button>; })}</div>}
		{!loading && !error && visible.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Нічого не знайдено</p>}
	</div>, document.body);
}

export default function CommentGifComponent() {
	const [anchor, setAnchor] = useState<PickerAnchor | null>(null);
	useEffect(() => {
		const update = () => { document.querySelectorAll<HTMLElement>(TOOLBAR).forEach((toolbar) => { if (toolbar.querySelector("[data-hikka-sticker-trigger]")) return; const group = toolbar.querySelector<HTMLElement>(":scope > div:first-child"); if (!group) return; const button = document.createElement("button"); button.type = "button"; button.dataset.hikkaStickerTrigger = "true"; button.className = "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md bg-transparent px-1.5 text-sm font-medium transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground"; button.title = "Відкрити стікери"; button.setAttribute("aria-label", "Відкрити стікери"); button.innerHTML = `<img src="${forgeLogo}" alt="" aria-hidden="true" width="16" height="16" style="display:block;object-fit:contain"/>`; button.addEventListener("mousedown", (event) => event.preventDefault()); button.addEventListener("click", () => setAnchor((current) => current?.element === button ? null : { element: button })); group.querySelector(".flex.items-center")?.append(button); }); };
		update(); const observer = new MutationObserver(update); observer.observe(document.body, { childList: true, subtree: true }); return () => observer.disconnect();
	}, []);
	useEffect(() => {
		let comments: HTMLElement | null = null;
		let commentsObserver: MutationObserver | null = null;
		let active = true;

		const scan = () => {
			if (comments) renderTokens(comments, stickerItems);
		};
		const watchComments = () => {
			const nextComments = document.querySelector<HTMLElement>(COMMENTS);
			if (nextComments === comments) return;

			commentsObserver?.disconnect();
			comments = nextComments;
			if (!comments) return;

			scan();
			void loadStickerCatalog().then(() => active && scan()).catch(console.warn);
			commentsObserver = new MutationObserver(scan);
			commentsObserver.observe(comments, { childList: true, characterData: true, subtree: true });
		};

		watchComments();
		const pageObserver = new MutationObserver(watchComments);
		pageObserver.observe(document.body, { childList: true, subtree: true });
		return () => {
			active = false;
			commentsObserver?.disconnect();
			pageObserver.disconnect();
		};
	}, []);
	return anchor ? <Picker anchor={anchor} onClose={() => setAnchor(null)} /> : null;
}
