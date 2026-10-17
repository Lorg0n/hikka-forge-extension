import { useEffect, useMemo, useRef, useState } from "react";

import forgeLogo from "@/assets/logo.svg";
import { editorApi, editorIds, type EditorNode, type EditorValue } from "@/services/editorApiService";
import { StickerService, type StickerCategory, type StickerItem } from "@/services/stickerService";

const COMMENTS = "#comments";
const TOOLBAR = `${COMMENTS} [role="toolbar"][aria-orientation="horizontal"]`;
const TOKEN = /:emote\[([a-z0-9-]+)\]:|:gif\[test\]:/gi;
const IMAGE = "[data-hikka-forge-sticker]";
const stickerItems = new Map<string, StickerItem>();

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
	const contentOffset = segments[0] === "comments" ? 1 : 0;
	const type = segments[contentOffset];
	const slug = segments[contentOffset + 1];
	if (!slug || !["anime", "manga", "novel", "article", "collection"].includes(type)) return null;
	return editorIds.comment(type as never, decodeURIComponent(slug));
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
			const slug = match[1] ?? "test";
			const item = items.get(slug);
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
				image.src = item.url;
				image.alt = item.alt ?? item.title;
				image.loading = "lazy";
				image.decoding = "async";
				image.style.width = "3em";
				image.style.height = "3em";
				image.style.objectFit = "contain";
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
	const result = [...threadCandidates, ...referenceCandidates];
	if (root) result.push(root);
	return [...new Set(result)];
}

function pickerPosition(anchor: HTMLElement, panelHeight: number) {
	const rect = anchor.getBoundingClientRect();
	const panelWidth = 320;
	const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8));
	const belowTop = rect.bottom + 8;
	const top = belowTop + panelHeight <= window.innerHeight
		? belowTop
		: Math.max(8, rect.top - panelHeight - 8);
	return { left, top };
}

function StickerPreview({ item }: { item: StickerItem }) {
	const [loaded, setLoaded] = useState(false);
	return <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted/40 p-1">
		{!loaded && <span className="absolute inset-1 animate-pulse rounded-md bg-muted" />}
		<img src={item.url} alt={item.alt ?? item.title} onLoad={() => setLoaded(true)} className={`relative max-h-full max-w-full object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} />
	</span>;
}

async function findEditor(toolbar: HTMLElement): Promise<string | null> {
	for (const id of editorCandidates(toolbar)) {
		try {
			await editorApi(id, { timeout: 350 }).get();
			return id;
		} catch { /* editor is not mounted */ }
	}
	return null;
}

function Picker({ anchor, onClose }: { anchor: HTMLElement; onClose: () => void }) {
	const [items, setItems] = useState<StickerItem[]>([]);
	const [categories, setCategories] = useState<StickerCategory[]>([]);
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editorId, setEditorId] = useState<string | null>(null);
	const [position, setPosition] = useState(() => pickerPosition(anchor, 280));
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;
		void Promise.all([StickerService.listCategories(), StickerService.listAllPacks()])
			.then(async ([nextCategories, packs]) => [nextCategories, await StickerService.listAllItems(packs)] as const)
			.then(([nextCategories, nextItems]) => { if (active) { setCategories(nextCategories); setItems(nextItems); nextItems.forEach((item) => stickerItems.set(item.slug, item)); } })
			.catch((value) => active && setError(value instanceof Error ? value.message : String(value)))
			.finally(() => active && setLoading(false));
		void findEditor(anchor.closest(TOOLBAR) as HTMLElement).then(setEditorId);
		return () => { active = false; };
	}, [anchor]);

	useEffect(() => {
		const close = (event: MouseEvent) => {
			const path = event.composedPath();
			if (!path.includes(ref.current as EventTarget) && !path.includes(anchor)) onClose();
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [anchor, onClose]);

	useEffect(() => {
		const updatePosition = () => {
			const panelHeight = Math.min(ref.current?.offsetHeight ?? 280, window.innerHeight - 16);
			setPosition(pickerPosition(anchor, panelHeight));
		};
		updatePosition();
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [anchor]);

	const visible = useMemo(() => items.filter((item) =>
		(!category || item.categories.some((value) => value.slug === category)) &&
		(!query || `${item.title} ${item.slug}`.toLowerCase().includes(query.toLowerCase()))), [items, category, query]);
	return <div ref={ref} className="fixed z-[2147483647] w-80 max-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border bg-popover p-2 text-popover-foreground shadow-md" style={position}>
		<div className="mb-2 flex items-center gap-2"><div className="relative min-w-0 flex-1"><svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук стікерів" className="h-10 w-full rounded-full border-0 bg-muted pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none" /></div></div>
		<div className="mb-3 flex gap-1 overflow-x-auto"><button type="button" onClick={() => setCategory(null)} className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${!category ? "border-sky-400/80 bg-sky-400/10 text-sky-300" : "border-border bg-white/[0.08] text-muted-foreground hover:bg-white/[0.12] hover:text-foreground"}`}>Усі</button>{categories.map((value) => <button type="button" key={value.slug} onClick={() => setCategory(value.slug)} className={`whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs transition-colors ${category === value.slug ? "border-sky-400/80 bg-sky-400/10 text-sky-300" : "border-border bg-white/[0.08] text-muted-foreground hover:bg-white/[0.12] hover:text-foreground"}`}>{value.title}</button>)}</div>
		{error && <p className="p-4 text-sm text-destructive">{error}</p>}
		{loading && <div className="grid grid-cols-5 gap-2">{Array.from({ length: 5 }, (_, index) => <span key={index} className="aspect-square w-full animate-pulse rounded-md bg-muted" />)}</div>}
		{!loading && !error && <div className="grid max-h-64 grid-cols-5 gap-2 overflow-y-auto">{visible.map((item) => <button type="button" key={item.slug} title={item.title} disabled={!editorId} onClick={() => { if (!editorId) return; void insertSticker(editorId, item.slug).then(() => StickerService.incrementUsage(item.slug)).catch(console.warn); onClose(); }} className="flex min-w-0 items-center justify-center rounded-md p-1 hover:bg-muted disabled:opacity-50"><StickerPreview item={item} /></button>)}</div>}
		{!loading && !error && visible.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Нічого не знайдено</p>}
	</div>;
}

export default function CommentGifComponent() {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	stickerItems.set("test", { slug: "test", title: "Test", description: null, alt: "Test", type: "animated", contentType: "image/avif", format: "avif", width: 96, height: 96, size: 0, url: "https://cdn.7tv.app/emote/01H0Z79Q2G0007779TR98GKAZ3/4x.avif", packSlug: "legacy", categories: [], usageCount: 0 });
	useEffect(() => {
		const comments = document.querySelector<HTMLElement>(COMMENTS);
		if (!comments) return;
		const update = () => { comments.querySelectorAll<HTMLElement>(TOOLBAR).forEach((toolbar) => { if (toolbar.querySelector("[data-hikka-sticker-trigger]")) return; const group = toolbar.querySelector<HTMLElement>(":scope > div:first-child"); if (!group) return; const button = document.createElement("button"); button.type = "button"; button.dataset.hikkaStickerTrigger = "true"; button.className = "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md bg-transparent px-1.5 text-sm font-medium transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground"; button.title = "Відкрити стікери"; button.setAttribute("aria-label", "Відкрити стікери"); button.innerHTML = `<img src="${forgeLogo}" alt="" aria-hidden="true" width="16" height="16" style="display:block;object-fit:contain"/>`; button.addEventListener("mousedown", (event) => event.preventDefault()); button.addEventListener("click", () => setAnchor(button)); group.querySelector(".flex.items-center")?.append(button); }); };
		update(); const observer = new MutationObserver(update); observer.observe(comments, { childList: true, subtree: true }); return () => observer.disconnect();
	}, []);
	useEffect(() => { const comments = document.querySelector<HTMLElement>(COMMENTS); if (!comments) return; const scan = () => { renderTokens(comments, stickerItems); }; scan(); const observer = new MutationObserver(scan); observer.observe(comments, { childList: true, characterData: true, subtree: true }); return () => observer.disconnect(); }, []);
	return anchor ? <Picker anchor={anchor} onClose={() => setAnchor(null)} /> : null;
}
