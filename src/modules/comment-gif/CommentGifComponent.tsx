import { useEffect, useMemo, useState } from "react";

import { editorApi, editorIds } from "@/services/editorApiService";
import { StickerService, type StickerCategory, type StickerItem } from "@/services/stickerService";

const COMMENTS = "#comments";
const TOOLBAR = `${COMMENTS} [role="toolbar"][aria-orientation="horizontal"]`;
const TOKEN = /:emote\[([a-z0-9-]+)\]:|:gif\[test\]:/gi;
const IMAGE = "[data-hikka-forge-sticker]";
const stickerItems = new Map<string, StickerItem>();

function contentEditorId(): string | null {
	const [type, ...rest] = window.location.pathname.split("/").filter(Boolean);
	const slug = rest[0];
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
	const reference = toolbar.closest("[data-reference], [data-comment-reference]")?.getAttribute("data-reference") ??
		toolbar.closest("[data-comment-reference]")?.getAttribute("data-comment-reference");
	const result = reference ? [editorIds.reply(reference), editorIds.edit(reference)] : [];
	const root = contentEditorId();
	if (root) result.push(root);
	return [...new Set(result)];
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
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;
		void Promise.all([StickerService.listCategories(), StickerService.listAllPacks()]
			.then(async ([nextCategories, packs]) => [nextCategories, await StickerService.listAllItems(packs)] as const))
			.then(([nextCategories, nextItems]) => { if (active) { setCategories(nextCategories); setItems(nextItems); nextItems.forEach((item) => stickerItems.set(item.slug, item)); } })
			.catch((value) => active && setError(value instanceof Error ? value.message : String(value)))
			.finally(() => active && setLoading(false));
		void findEditor(anchor.closest(TOOLBAR) as HTMLElement).then(setEditorId);
		return () => { active = false; };
	}, [anchor]);

	useEffect(() => {
		const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node) && event.target !== anchor) onClose(); };
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [anchor, onClose]);

	const visible = useMemo(() => items.filter((item) =>
		(!category || item.categories.some((value) => value.slug === category)) &&
		(!query || `${item.title} ${item.slug}`.toLowerCase().includes(query.toLowerCase()))), [items, category, query]);
	const rect = anchor.getBoundingClientRect();
	return <div ref={ref} className="fixed z-[2147483647] w-80 rounded-lg border bg-background p-2 shadow-xl" style={{ left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)), top: Math.max(8, rect.top - 360) }}>
		<div className="mb-2 flex items-center gap-2"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук стікерів" className="h-8 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-sm outline-none" /><button type="button" onClick={onClose} className="text-muted-foreground">×</button></div>
		<div className="mb-2 flex gap-1 overflow-x-auto"><button type="button" onClick={() => setCategory(null)} className={`rounded px-2 py-1 text-xs ${!category ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Усі</button>{categories.map((value) => <button type="button" key={value.slug} onClick={() => setCategory(value.slug)} className={`rounded px-2 py-1 text-xs whitespace-nowrap ${category === value.slug ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{value.title}</button>)}</div>
		{loading && <p className="p-4 text-center text-sm text-muted-foreground">Завантаження…</p>}
		{error && <p className="p-4 text-sm text-destructive">{error}</p>}
		{!loading && !error && <div className="grid max-h-64 grid-cols-5 gap-1 overflow-y-auto">{visible.map((item) => <button type="button" key={item.slug} title={item.title} disabled={!editorId} onClick={() => { if (!editorId) return; void editorApi(editorId).insertText(`:emote[${item.slug}]:`).then(() => StickerService.incrementUsage(item.slug)).catch(console.warn); onClose(); }} className="flex aspect-square items-center justify-center rounded-md p-1 hover:bg-muted disabled:opacity-50"><img src={item.url} alt={item.alt ?? item.title} className="max-h-full max-w-full object-contain" /></button>)}</div>}
		{!loading && !error && visible.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Нічого не знайдено</p>}
	</div>;
}

export default function CommentGifComponent() {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	stickerItems.set("test", { slug: "test", title: "Test", description: null, alt: "Test", type: "animated", contentType: "image/avif", format: "avif", width: 96, height: 96, size: 0, url: "https://cdn.7tv.app/emote/01H0Z79Q2G0007779TR98GKAZ3/4x.avif", packSlug: "legacy", categories: [], usageCount: 0 });
	useEffect(() => {
		const comments = document.querySelector<HTMLElement>(COMMENTS);
		if (!comments) return;
		const update = () => { comments.querySelectorAll<HTMLElement>(TOOLBAR).forEach((toolbar) => { if (toolbar.querySelector("[data-hikka-sticker-trigger]")) return; const group = toolbar.querySelector<HTMLElement>(":scope > div:first-child"); if (!group) return; const button = document.createElement("button"); button.type = "button"; button.dataset.hikkaStickerTrigger = "true"; button.className = "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md bg-transparent px-1.5 text-sm font-medium transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground"; button.title = "Відкрити стікери Hikka"; button.setAttribute("aria-label", "Відкрити стікери Hikka"); button.innerHTML = `<span aria-hidden="true">✦</span>`; button.addEventListener("mousedown", (event) => event.preventDefault()); button.addEventListener("click", () => setAnchor(button)); group.querySelector(".flex.items-center")?.append(button); }); };
		update(); const observer = new MutationObserver(update); observer.observe(comments, { childList: true, subtree: true }); return () => observer.disconnect();
	}, []);
	useEffect(() => { const comments = document.querySelector<HTMLElement>(COMMENTS); if (!comments) return; const scan = () => { renderTokens(comments, stickerItems); }; scan(); const observer = new MutationObserver(scan); observer.observe(comments, { childList: true, characterData: true, subtree: true }); return () => observer.disconnect(); }, []);
	return anchor ? <Picker anchor={anchor} onClose={() => setAnchor(null)} /> : null;
}
