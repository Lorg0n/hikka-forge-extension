import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import forgeLogo from "@/assets/logo.svg";
import { editorApi, editorIds, type EditorNode, type EditorValue } from "@/services/editorApiService";
import { StickerService, type StickerCategory, type StickerItem } from "@/services/stickerService";

const COMMENTS = "#comments";
const FEED_COMMENT_CONTENT = "article .prose";
const TOKEN_ROOTS = `${COMMENTS}, ${FEED_COMMENT_CONTENT}`;
const COMMENT_TOOLBAR = `${COMMENTS} [role="toolbar"][aria-orientation="horizontal"]`;
const MOBILE_TOOLBAR = `[data-slot="page-sheet-content"] [role="toolbar"][aria-orientation="horizontal"]`;
const TOOLBAR = `${COMMENT_TOOLBAR}, ${MOBILE_TOOLBAR}`;
const TOKEN = /:emote\[([a-z0-9-]+)\]:/gi;
const IMAGE = "[data-hikka-forge-sticker]";
const STICKER_TOKEN = "[data-hikka-forge-sticker-token]";
const stickerItems = new Map<string, StickerItem>();
const stickerPackTitles = new Map<string, string>();
let stickerCatalog: Promise<StickerItem[]> | null = null;
let stickerPreviewTimer: number | null = null;
let stickerPreviewOverlay: HTMLElement | null = null;
const loadedStickerUrls = new Set<string>();
let pickerCatalog: { categories: StickerCategory[]; items: StickerItem[] } | null = null;

const stickerWidthUnits = (item: StickerItem): number => {
	const value = Number(item.widthUnits);
	return Number.isFinite(value) ? Math.min(12, Math.max(1, Math.round(value))) : 1;
};

const pickerStickerWidth = (widthUnits: number): string =>
	`min(${widthUnits * 2.75 + 0.5}rem, 100%)`;

type PickerAnchor = {
	element: HTMLElement;
};

function loadStickerCatalog(refresh = false): Promise<StickerItem[]> {
	if (!stickerCatalog || refresh) {
		const request = StickerService.listAllPacks()
			.then(async (packs) => {
				packs.forEach((pack) => stickerPackTitles.set(pack.slug, pack.title));
				return StickerService.listAllItems(packs);
			})
			.then((items) => {
				items.forEach((item) => stickerItems.set(item.slug, item));
				return items;
			})
			.catch((error) => {
				if (stickerCatalog === request) stickerCatalog = null;
				throw error;
			});
		stickerCatalog = request;
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
		if (!appendToLastTextNode(value, token)) {
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

function sheetCommentReference(toolbar: HTMLElement): string | null {
	const sheet = toolbar.closest<HTMLElement>('[data-slot="page-sheet-content"]');
	if (!sheet?.id) return null;

	const trigger = document.querySelector<HTMLElement>(
		`[aria-controls="${CSS.escape(sheet.id)}"]`,
	);
	return trigger?.closest<HTMLElement>(".comment-thread[id]")?.id ?? null;
}

function pickerPortalTarget(anchor: HTMLElement): HTMLElement {
	// A page sheet dismisses itself for interactions outside its DOM subtree. Keep
	// the picker in that subtree on mobile; otherwise selecting a sticker closes
	// the sheet and unmounts the editor before the insertion request can finish.
	return anchor.closest<HTMLElement>('[data-slot="page-sheet-content"]') ?? document.body;
}

function hideStickerPreview(): void {
	if (stickerPreviewTimer !== null) {
		window.clearTimeout(stickerPreviewTimer);
		stickerPreviewTimer = null;
	}
	stickerPreviewOverlay?.remove();
	stickerPreviewOverlay = null;
}

function showStickerPreview(wrapper: HTMLElement, item: StickerItem): void {
	hideStickerPreview();
	const overlay = document.createElement("div");
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-label", item.title);
	overlay.style.position = "fixed";
	overlay.style.zIndex = "2147483647";
	overlay.style.display = "flex";
	overlay.style.flexDirection = "column";
	overlay.style.alignItems = "center";
	overlay.style.gap = "6px";
	overlay.style.maxWidth = "min(340px, calc(100vw - 16px))";
	overlay.style.padding = "8px";
	overlay.style.border = "1px solid rgb(148 163 184 / 0.32)";
	overlay.style.borderRadius = "12px";
	overlay.style.background = "rgb(15 23 42 / 0.96)";
	overlay.style.boxShadow = "0 12px 32px rgb(0 0 0 / 0.38)";
	overlay.style.pointerEvents = "none";
	overlay.style.opacity = "0";
	overlay.style.transform = "translateY(4px)";
	overlay.style.transition = "opacity 140ms ease, transform 140ms ease";

	const image = document.createElement("img");
	image.src = item.url;
	image.alt = item.alt ?? item.title;
	image.style.display = "block";
	image.style.width = "auto";
	image.style.height = "auto";
	image.style.maxWidth = "320px";
	image.style.maxHeight = "280px";
	image.style.objectFit = "contain";
	image.style.borderRadius = "7px";
	overlay.append(image);
	const label = document.createElement("span");
	label.textContent = item.title;
	label.style.maxWidth = "100%";
	label.style.overflow = "hidden";
	label.style.textOverflow = "ellipsis";
	label.style.whiteSpace = "nowrap";
	label.style.color = "rgb(226 232 240)";
	label.style.font = "500 12px/16px system-ui, sans-serif";
	overlay.append(label);
	document.body.append(overlay);
	stickerPreviewOverlay = overlay;

	const positionOverlay = () => {
		if (stickerPreviewOverlay !== overlay) return;
		const wrapperRect = wrapper.getBoundingClientRect();
		const overlayRect = overlay.getBoundingClientRect();
		const left = Math.max(8, Math.min(
			wrapperRect.left + wrapperRect.width / 2 - overlayRect.width / 2,
			window.innerWidth - overlayRect.width - 8,
		));
		const above = wrapperRect.top - overlayRect.height - 10;
		const below = wrapperRect.bottom + 10;
		overlay.style.left = `${left}px`;
		overlay.style.top = `${above >= 8 ? above : Math.min(below, window.innerHeight - overlayRect.height - 8)}px`;
	};
	image.addEventListener("load", positionOverlay);
	positionOverlay();
	requestAnimationFrame(() => {
		if (stickerPreviewOverlay !== overlay) return;
		overlay.style.opacity = "1";
		overlay.style.transform = "translateY(0)";
	});
}

function attachStickerPreview(wrapper: HTMLElement, item: StickerItem): void {
	const start = () => {
		hideStickerPreview();
		stickerPreviewTimer = window.setTimeout(() => {
			stickerPreviewTimer = null;
			showStickerPreview(wrapper, item);
		}, 450);
	};
	wrapper.addEventListener("mouseenter", start);
	wrapper.addEventListener("mouseleave", hideStickerPreview);
}

function hasKnownStickerToken(value: string, items: Map<string, StickerItem>): boolean {
	TOKEN.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = TOKEN.exec(value))) {
		if (items.has(match[1])) return true;
	}
	return false;
}

function copyStickerTokens(event: ClipboardEvent): void {
	const selection = document.getSelection();
	if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !event.clipboardData) return;

	const fragment = selection.getRangeAt(0).cloneContents();
	const stickers = fragment.querySelectorAll<HTMLElement>(STICKER_TOKEN);
	if (stickers.length === 0) return;

	for (const sticker of stickers) {
		const token = sticker.dataset.hikkaForgeStickerToken;
		if (token) sticker.replaceWith(document.createTextNode(token));
	}

	event.clipboardData.setData("text/plain", fragment.textContent ?? "");
	event.preventDefault();
}

function renderTokens(root: Node, items: Map<string, StickerItem>) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];
	let node: Node | null;
	while ((node = walker.nextNode())) {
		const text = node as Text;
		if (text.parentElement?.closest(`${IMAGE}, [contenteditable="true"], script, style, textarea, input`)) continue;
		if (hasKnownStickerToken(text.data, items)) nodes.push(text);
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
				wrapper.dataset.hikkaForgeStickerToken = match[0];
				image.dataset.hikkaForgeStickerToken = match[0];
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
				attachStickerPreview(wrapper, item);
				fragment.append(wrapper);
			}
			cursor = match.index + match[0].length;
		}
		fragment.append(document.createTextNode(text.data.slice(cursor)));
		text.replaceWith(fragment);
	}
}

function renderTokenRoots(node: Node, items: Map<string, StickerItem>): void {
	const element = node.nodeType === Node.ELEMENT_NODE
		? node as Element
		: node.parentElement;
	if (!element) return;
	if (element.closest(IMAGE)) return;

	const containingRoot = element.closest(TOKEN_ROOTS);
	if (containingRoot) renderTokens(containingRoot, items);
	for (const root of element.querySelectorAll(TOKEN_ROOTS)) {
		if (root !== containingRoot) renderTokens(root, items);
	}
}

function editorCandidates(toolbar: HTMLElement): string[] {
	const commentThread = toolbar.closest<HTMLElement>(".comment-thread[id]")?.id;
	const sheetReference = sheetCommentReference(toolbar);
	const reference = toolbar.closest("[data-reference], [data-comment-reference]")?.getAttribute("data-reference") ??
		toolbar.closest("[data-comment-reference]")?.getAttribute("data-comment-reference");
	const threadCandidates = commentThread ? [editorIds.reply(commentThread), editorIds.edit(commentThread)] : [];
	const sheetCandidates = sheetReference ? [editorIds.reply(sheetReference), editorIds.edit(sheetReference)] : [];
	const referenceCandidates = reference ? [editorIds.reply(reference), editorIds.edit(reference)] : [];
	const root = contentEditorId();
	const result = root
		? [...sheetCandidates, ...threadCandidates, ...referenceCandidates, root]
		: [...sheetCandidates, ...threadCandidates, ...referenceCandidates];
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
	const [status, setStatus] = useState<"loading" | "loaded" | "error">(() =>
		loadedStickerUrls.has(item.url) ? "loaded" : "loading");
	const [attempt, setAttempt] = useState(0);
	useEffect(() => { setStatus(loadedStickerUrls.has(item.url) ? "loaded" : "loading"); setAttempt(0); }, [item.url]);
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
		<img key={attempt} src={item.url} alt={item.alt ?? item.title} onLoad={() => { loadedStickerUrls.add(item.url); setStatus("loaded"); }} onError={() => setStatus("error")} ref={(image) => { if (image?.complete && image.naturalWidth > 0) { loadedStickerUrls.add(item.url); setStatus("loaded"); } }} className="m-auto object-contain transition-opacity" style={{ ...fill, display: "block", opacity: status === "loaded" ? 1 : 0 }} />
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
	const [items, setItems] = useState<StickerItem[]>(() => pickerCatalog?.items ?? []);
	const [categories, setCategories] = useState<StickerCategory[]>(() => pickerCatalog?.categories ?? []);
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string | null>(null);
	const [loading, setLoading] = useState(() => pickerCatalog === null);
	const [error, setError] = useState<string | null>(null);
	const [insertionError, setInsertionError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [editorId, setEditorId] = useState<string | null>(null);
	const [position, setPosition] = useState(() => pickerPosition(anchor.element, 280));
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;
		const hasCachedCatalog = pickerCatalog !== null;
		if (hasCachedCatalog && reloadKey === 0) {
			setCategories(pickerCatalog.categories);
			setItems(pickerCatalog.items);
			setLoading(false);
		} else {
			setLoading(true);
		}
		setError(null);
		void Promise.all([StickerService.listCategories(), loadStickerCatalog(hasCachedCatalog)])
			.then(([nextCategories, nextItems]) => { pickerCatalog = { categories: nextCategories, items: nextItems }; if (active) { setCategories(nextCategories); setItems(nextItems); nextItems.forEach((item) => stickerItems.set(item.slug, item)); } })
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
	const groupedItems = useMemo(() => {
		const groups = new Map<string, StickerItem[]>();
		for (const item of visible) {
			const group = groups.get(item.packSlug);
			if (group) group.push(item);
			else groups.set(item.packSlug, [item]);
		}
		return [...groups.entries()].map(([slug, packItems]) => ({
			slug,
			title: stickerPackTitles.get(slug) ?? slug,
			items: packItems,
		}));
	}, [visible]);
	const filterButtonStyle = (selected: boolean): React.CSSProperties => selected
		? { background: "rgb(203 213 225)", borderColor: "rgb(148 163 184)", color: "rgb(15 23 42)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.16)" }
		: { background: "transparent", borderColor: "transparent", color: "rgb(148 163 184)" };
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
	return createPortal(<div ref={ref} className="fixed w-80 max-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md" style={{ ...position, zIndex: 2147483647, isolation: "isolate" }}>
		<div className="mx-2 mt-2 mb-2 flex items-center gap-2"><div className="relative min-w-0 flex-1"><svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук стікерів" className="h-10 w-full rounded-full border-0 bg-muted pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none" /></div></div>
		<div className="mx-2 mb-2.5 flex gap-1 overflow-x-auto pb-0.5">
			<button type="button" aria-pressed={!category} onClick={() => setCategory(null)} className="rounded-full border px-2.5 py-1 text-xs font-medium transition-[background-color,border-color,color,box-shadow] hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" style={filterButtonStyle(!category)}>Усі</button>
			{categories.map((value) => {
				const selected = category === value.slug;
				return <button type="button" aria-pressed={selected} key={value.slug} onClick={() => setCategory(value.slug)} className="whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-[background-color,border-color,color,box-shadow] hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" style={filterButtonStyle(selected)}>{value.title}</button>;
			})}
		</div>
		{error && <div className="mx-2 flex items-center justify-between gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive"><span>Не вдалося завантажити стікери.</span><button type="button" className="rounded-md border border-destructive/30 px-2 py-1 text-xs hover:bg-destructive/10" onClick={() => setReloadKey((value) => value + 1)}>Повторити</button></div>}
		{insertionError && <p className="mx-2 pb-2 text-xs text-destructive">{insertionError}</p>}
		{loading && <div className="edge-scrollbar max-h-64 overflow-y-auto px-3 pr-3" style={{ maxHeight: "16rem" }}>{[4, 3].map((tileCount, groupIndex, groups) => <section key={groupIndex} className="pb-3" style={groupIndex === groups.length - 1 ? { paddingBottom: "1rem" } : undefined}><div className="sticky top-0 z-10 mb-1.5 flex items-center gap-2 bg-popover py-1"><span className="animate-pulse rounded bg-muted" style={{ display: "block", width: groupIndex === 0 ? "5.5rem" : "7rem", height: "0.75rem" }} /><span className="h-px flex-1 bg-border" /><span className="animate-pulse rounded bg-muted" style={{ display: "block", width: "0.75rem", height: "0.65rem" }} /></div><div className="flex flex-wrap content-start items-start gap-2">{Array.from({ length: tileCount }, (_, index) => <span key={index} className="shrink-0 animate-pulse rounded-md bg-muted" style={{ display: "block", width: "3.25rem", height: "3.25rem" }} />)}</div></section>)}</div>}
			{!loading && !error && <div className="edge-scrollbar max-h-64 overflow-y-auto px-3 pr-3" style={{ maxHeight: "16rem" }}>{groupedItems.map((pack, index) => <section key={pack.slug} className="pb-3" style={index === groupedItems.length - 1 ? { paddingBottom: "1rem" } : undefined}><div className="sticky top-0 z-10 mb-1.5 flex items-center gap-2 bg-popover py-1"><span className="truncate text-xs font-semibold text-foreground">{pack.title}</span><span className="h-px flex-1 bg-border" /><span className="text-[11px] tabular-nums text-muted-foreground">{pack.items.length}</span></div><div className="flex flex-wrap content-start items-start gap-2">{pack.items.map((item) => { const widthUnits = stickerWidthUnits(item); return <button type="button" key={item.slug} title={item.title} style={{ width: pickerStickerWidth(widthUnits), height: "3.25rem", contain: "layout size paint" }} onClick={(event) => { event.stopPropagation(); void selectSticker(item).catch(console.warn); }} className="relative block min-h-0 min-w-0 shrink-0 overflow-hidden rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"><StickerPreview item={item} /></button>; })}</div></section>)}</div>}
		{!loading && !error && visible.length === 0 && <p className="mx-2 p-4 text-center text-sm text-muted-foreground">Нічого не знайдено</p>}
	</div>, pickerPortalTarget(anchor.element));
}

export default function CommentGifComponent() {
	const [anchor, setAnchor] = useState<PickerAnchor | null>(null);
	useEffect(() => {
		const update = () => { document.querySelectorAll<HTMLElement>(TOOLBAR).forEach((toolbar) => { if (toolbar.querySelector("[data-hikka-sticker-trigger]")) return; const group = toolbar.querySelector<HTMLElement>(":scope > div:first-child"); if (!group) return; const button = document.createElement("button"); button.type = "button"; button.dataset.hikkaStickerTrigger = "true"; button.className = "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md bg-transparent px-1.5 text-sm font-medium transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground"; button.title = "Відкрити стікери"; button.setAttribute("aria-label", "Відкрити стікери"); button.innerHTML = `<img src="${forgeLogo}" alt="" aria-hidden="true" width="16" height="16" style="display:block;object-fit:contain"/>`; button.addEventListener("mousedown", (event) => event.preventDefault()); button.addEventListener("click", () => setAnchor((current) => current?.element === button ? null : { element: button })); group.querySelector(".flex.items-center")?.append(button); }); };
		update(); const observer = new MutationObserver(update); observer.observe(document.body, { childList: true, subtree: true }); return () => observer.disconnect();
	}, []);
	useEffect(() => {
		let active = true;
		const scanDocument = () => document.querySelectorAll(TOKEN_ROOTS).forEach((root) => renderTokens(root, stickerItems));
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "characterData") {
					renderTokenRoots(mutation.target, stickerItems);
					continue;
				}
				for (const node of mutation.addedNodes) renderTokenRoots(node, stickerItems);
			}
		});
		observer.observe(document.body, { childList: true, characterData: true, subtree: true });
		document.addEventListener("copy", copyStickerTokens);
		void loadStickerCatalog().then(() => active && scanDocument()).catch(console.warn);
		return () => {
			active = false;
			observer.disconnect();
			document.removeEventListener("copy", copyStickerTokens);
		};
	}, []);
	return anchor ? <Picker anchor={anchor} onClose={() => setAnchor(null)} /> : null;
}
