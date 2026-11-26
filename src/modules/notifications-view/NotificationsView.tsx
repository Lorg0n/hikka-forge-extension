import browser from '@/utils/browser';
import MaterialSymbolsKeyboardArrowDownRounded from './icons/MaterialSymbolsKeyboardArrowDownRounded';
import { groupSimilarNotifications, getNotificationGroupActors, getNotificationGroupDescription } from './notification-groups';
import { getDeclensionWord } from './declension';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import MaterialSymbolsAddCommentRounded from './icons/MaterialSymbolsAddCommentRounded';
import MaterialSymbolsChangeCircleRounded from './icons/MaterialSymbolsChangeCircleRounded';
import MaterialSymbolsCheckCircleRounded from './icons/MaterialSymbolsCheckCircleRounded';
import MaterialSymbolsFavoriteRounded from './icons/MaterialSymbolsFavoriteRounded';
import MaterialSymbolsFlagCircleRounded from './icons/MaterialSymbolsFlagCircleRounded';
import MaterialSymbolsHeartMinusRounded from './icons/MaterialSymbolsHeartMinusRounded';
import MaterialSymbolsHeartPlusRounded from './icons/MaterialSymbolsHeartPlusRounded';
import MaterialSymbolsInfoRounded from './icons/MaterialSymbolsInfoRounded';
import MaterialSymbolsLiveTvRounded from './icons/MaterialSymbolsLiveTvRounded';
import MaterialSymbolsLockOpenRightOutlineRounded from './icons/MaterialSymbolsLockOpenRightOutlineRounded';
import MaterialSymbolsPersonAddRounded from './icons/MaterialSymbolsPersonAddRounded';
import MaterialSymbolsNotificationsRounded from './icons/MaterialSymbolsNotificationsRounded';
import FeMention from './icons/FeMention';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ModulePage } from '@/components/ui/module-page';
import { PageHeader } from '@/components/ui/page-header';
import logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, CheckCheck, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Skeleton } from '@/components/ui/skeleton';
import { convertNotification, type NotificationItem, type NotificationResponse } from './notifications';

type Result = { pagination: { page: number; pages: number }; list: NotificationResponse[] };
type CachedPage = { data: Result; savedAt: number };
type NotificationsCache = { head: string; pages: Record<string, CachedPage> };
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'notifications_cache_v1_';
function NotificationsSkeleton() {
    return <div role="status" aria-label="Завантаження сповіщень">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex gap-3 border-t border-border px-3 py-3"><Skeleton className="size-10 shrink-0" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-2 w-16" /></div></div>)}</div>;
}
const icons = {
    edit_accepted: MaterialSymbolsCheckCircleRounded, edit_denied: MaterialSymbolsFlagCircleRounded, edit_updated: MaterialSymbolsChangeCircleRounded,
    comment_reply: MaterialSymbolsAddCommentRounded, comment_vote: MaterialSymbolsFavoriteRounded, comment_tag: FeMention,
    edit_comment: MaterialSymbolsAddCommentRounded, collection_comment: MaterialSymbolsAddCommentRounded, article_comment: MaterialSymbolsAddCommentRounded,
    hikka_update: MaterialSymbolsInfoRounded, schedule_anime: MaterialSymbolsLiveTvRounded, follow: MaterialSymbolsPersonAddRounded,
    collection_vote: MaterialSymbolsFavoriteRounded, article_vote: MaterialSymbolsFavoriteRounded, thirdparty_login: MaterialSymbolsLockOpenRightOutlineRounded,
} as const;
const accents: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground border-primary-border', success: 'bg-success text-success-foreground border-success-border',
    warning: 'bg-warning text-warning-foreground border-warning-border', destructive: 'bg-destructive text-destructive-foreground border-destructive-border',
    info: 'bg-info text-info-foreground border-info-border', neutral: 'bg-muted text-muted-foreground border-border',
};
const api = 'https://api.hikka.io';
const categories = [
    { id: 'comments', label: 'Коментарі', types: ['comment_reply', 'comment_tag', 'edit_comment', 'collection_comment', 'article_comment'] },
    { id: 'votes', label: 'Оцінки', types: ['comment_vote', 'collection_vote', 'article_vote'] },
    { id: 'edits', label: 'Правки', types: ['edit_accepted', 'edit_denied', 'edit_updated'] },
    { id: 'follows', label: 'Підписки', types: ['follow'] },
    { id: 'anime', label: 'Аніме', types: ['schedule_anime'] },
    { id: 'hikka', label: 'Hikka', types: ['hikka_update', 'thirdparty_login'] },
] as const;
function dayKey(timestamp: number): 'today' | 'yesterday' | 'earlier' {
    const date = new Date(timestamp * 1000); const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return date >= today ? 'today' : date >= yesterday ? 'yesterday' : 'earlier';
}
function useLongPress(action: () => void, disabled: boolean) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const origin = useRef({ x: 0, y: 0 });
    const triggered = useRef(false);
    const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
    useEffect(() => cancel, []);
    return {
        onPointerDown: (event: React.PointerEvent) => {
            if (event.pointerType !== 'touch' || disabled) return;
            triggered.current = false; origin.current = { x: event.clientX, y: event.clientY };
            cancel(); timer.current = setTimeout(() => { triggered.current = true; action(); }, 550);
        },
        onPointerMove: (event: React.PointerEvent) => { if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 10) cancel(); },
        onPointerUp: cancel,
        onPointerCancel: cancel,
        onContextMenu: (event: React.MouseEvent) => { if (triggered.current) event.preventDefault(); },
        onClickCapture: (event: React.MouseEvent) => { if (triggered.current) { event.preventDefault(); event.stopPropagation(); triggered.current = false; } },
    };
}
function NotificationRow({ item, markSeen, selecting, selected, toggle }: { item: NotificationItem; markSeen: (id: string) => void; selecting: boolean; selected: boolean; toggle: (id: string) => void }) {
    const longPress = useLongPress(() => toggle(item.reference), selecting);
    const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (clickTimer.current) clearTimeout(clickTimer.current); }, []);
    const NotificationIcon = item.scoreSign ? (item.scoreSign > 0 ? MaterialSymbolsHeartPlusRounded : MaterialSymbolsHeartMinusRounded) : icons[item.type] || MaterialSymbolsNotificationsRounded;
    const image = item.actor?.avatar || item.contentImage;
    return <div {...longPress} onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); if (clickTimer.current) clearTimeout(clickTimer.current); if (!selecting) toggle(item.reference); }} onClick={event => { if (selecting || event.ctrlKey || event.metaKey) { event.preventDefault(); if (event.detail < 2) toggle(item.reference); } }} className={`group/item flex gap-3 border-t border-l-4 border-border px-3 py-2.5 transition-colors hover:bg-muted ${item.seen ? 'border-l-transparent' : 'border-l-primary-foreground/60 bg-primary-foreground/10'}`}>
        <span aria-hidden={!selecting} className={`my-auto flex shrink-0 items-center justify-center overflow-hidden transition-[width,margin,opacity] duration-300 ease-out motion-reduce:transition-none ${selecting ? 'w-9 opacity-100 md:w-8' : '-mr-3 w-0 opacity-0'}`}><input type="checkbox" aria-label="Вибрати сповіщення" tabIndex={selecting ? 0 : -1} disabled={!selecting} checked={selected} onChange={() => toggle(item.reference)} onClick={event => event.stopPropagation()} className="size-5 shrink-0 accent-primary md:size-4" /></span>
        <div className="relative size-10 shrink-0">
            {image ? <img src={image} alt={item.actor?.username || ''} className="size-10 rounded-md object-cover" /> : <div className="flex size-10 items-center justify-center rounded-md border border-border bg-secondary/40"><NotificationIcon className="size-5" /></div>}
            {image && <span className={`absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-sm border ${accents[item.accent]}`}><NotificationIcon className="size-2.5" /></span>}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col gap-1">
            {item.href !== '#' && <a href={item.href} className="absolute inset-0 z-10" aria-label={item.title} onClick={event => { if (selecting || event.ctrlKey || event.metaKey) return; event.preventDefault(); if (clickTimer.current) clearTimeout(clickTimer.current); if (event.detail > 1) return; clickTimer.current = setTimeout(() => { if (!item.seen) markSeen(item.reference); window.location.assign(item.href); }, event.detail === 0 ? 0 : 300); }} />}
            <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-baseline gap-1.5"><span className="min-w-0 truncate text-sm font-medium leading-tight">{item.title}</span></div>{item.scoreSign && <span className={`shrink-0 rounded-sm border px-1 text-xs font-bold ${accents[item.accent]}`}>{item.scoreSign > 0 ? '+1' : '-1'}</span>}</div>
            <div className="line-clamp-2 text-xs text-muted-foreground"><ReactMarkdown allowedElements={['p', 'strong', 'em', 'del', 'code']} unwrapDisallowed>{item.description || ''}</ReactMarkdown></div>
            {item.preview && <blockquote className={`mt-0.5 border-l-2 border-muted-foreground/20 pl-2 text-xs text-muted-foreground ${item.type === 'comment_vote' ? 'whitespace-pre-wrap break-words' : 'line-clamp-1'}`}><ReactMarkdown allowedElements={['p', 'strong', 'em', 'del', 'code']} unwrapDisallowed>{item.preview}</ReactMarkdown></blockquote>}
        </div>
    </div>;
}
function NotificationGroup({ items, markSeen, selecting, selectedIds, toggle, toggleGroup }: { items: NotificationItem[]; markSeen: (id: string) => void; selecting: boolean; selectedIds: Set<string>; toggle: (id: string) => void; toggleGroup: (ids: string[]) => void }) {
    const longPress = useLongPress(() => { toggle(items[0].reference); toggleGroup(items.slice(1).map(item => item.reference)); }, selecting);
    const [latest] = items;
    const actors = getNotificationGroupActors(items);
    const unseen = items.filter(item => !item.seen);
    const score = latest.scoreSign ? latest.scoreSign * items.length : 0;
    const GroupIcon = latest.scoreSign ? (latest.scoreSign > 0 ? MaterialSymbolsHeartPlusRounded : MaterialSymbolsHeartMinusRounded) : icons[latest.type] || MaterialSymbolsNotificationsRounded;
    const image = latest.actor?.avatar || latest.contentImage;
    const avatar = (actor: typeof actors[number], className: string) => <div className={`absolute flex size-7 items-center justify-center overflow-hidden rounded-md bg-secondary text-xs font-medium uppercase ${className}`}>{actor.avatar ? <img src={actor.avatar} alt={actor.username || ''} className="size-full object-cover" /> : actor.username?.[0]}</div>;
    return <Collapsible {...longPress} className="border-t border-border first:border-t-0" onOpenChange={open => { if (open && !selecting) unseen.forEach(item => markSeen(item.reference)); }}>
        <CollapsibleTrigger onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); if (!selecting) { toggle(items[0].reference); toggleGroup(items.slice(1).map(item => item.reference)); } }} className={`group/item flex w-full cursor-pointer gap-3 border-l-4 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted ${unseen.length ? 'border-l-primary-foreground/60 bg-primary-foreground/10' : 'border-l-transparent'}`}>
            <span aria-hidden={!selecting} className={`my-auto flex shrink-0 items-center justify-center overflow-hidden transition-[width,margin,opacity] duration-300 ease-out motion-reduce:transition-none ${selecting ? 'w-9 opacity-100 md:w-8' : '-mr-3 w-0 opacity-0'}`}><input type="checkbox" aria-label="Вибрати групу" tabIndex={selecting ? 0 : -1} disabled={!selecting} checked={items.every(item => selectedIds.has(item.reference))} ref={node => { if (node) node.indeterminate = items.some(item => selectedIds.has(item.reference)) && !items.every(item => selectedIds.has(item.reference)); }} onClick={event => event.stopPropagation()} onChange={() => toggleGroup(items.map(item => item.reference))} className="size-5 shrink-0 accent-primary md:size-4" /></span>
            <div className="relative size-10 shrink-0">
                {actors[1] ? <>{avatar(actors[1], 'top-0 left-0')}{avatar(actors[0], 'right-0 bottom-0 ring-2 ring-popover')}</> : image ? <img src={image} alt={latest.actor?.username || ''} className="size-10 rounded-md object-cover" /> : <div className="flex size-10 items-center justify-center rounded-md border border-border bg-secondary/40"><GroupIcon className="size-5" /></div>}
                {(actors[1] || image) && <div className={`absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-sm border ${accents[latest.accent]}`}><GroupIcon className="size-2.5" /></div>}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium leading-tight">{latest.title}</span><div className="flex shrink-0 items-center gap-1"><span className={`rounded-sm border px-1 text-xs font-bold tabular-nums ${accents[score > 0 ? 'success' : score < 0 ? 'destructive' : 'neutral']}`}>{score > 0 ? `+${score}` : score < 0 ? score : items.length}</span><MaterialSymbolsKeyboardArrowDownRounded className="size-5 text-muted-foreground transition-transform group-data-[state=open]/item:rotate-180" /></div></div>
                <div className="line-clamp-2 text-xs text-muted-foreground"><ReactMarkdown allowedElements={['p', 'strong', 'em', 'del', 'code']} unwrapDisallowed>{getNotificationGroupDescription(items)}</ReactMarkdown></div>
                <div className="flex items-center gap-1.5 text-xs">{unseen.length > 0 && unseen.length < items.length && <span className="font-medium text-primary-foreground">· {unseen.length} {getDeclensionWord(unseen.length, ['нове', 'нові', 'нових'])}</span>}</div>
            </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden border-t border-border">{items.map(item => <div key={item.reference} className="pl-5"><NotificationRow item={item} markSeen={markSeen} selecting={selecting} selected={selectedIds.has(item.reference)} toggle={toggle} /></div>)}</CollapsibleContent>
    </Collapsible>;
}
export default function NotificationsView() {
    const [selecting, setSelecting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [bulkSuccess, setBulkSuccess] = useState(false);
    useEffect(() => {
        if (!bulkSuccess) return;
        const timer = window.setTimeout(() => setBulkSuccess(false), 1200);
        return () => window.clearTimeout(timer);
    }, [bulkSuccess]);
    const toggle = (id: string) => { setSelecting(true); setSelectedIds(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
    const toggleGroup = (ids: string[]) => setSelectedIds(previous => { const next = new Set(previous); const remove = ids.every(id => next.has(id)); ids.forEach(id => remove ? next.delete(id) : next.add(id)); return next; });
    const cancelSelection = () => { if (!bulkBusy) { setSelecting(false); setSelectedIds(new Set()); } };
    useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'Escape' && !bulkBusy) { setSelecting(false); setSelectedIds(new Set()); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [bulkBusy]);
    const [items, setItems] = useState<NotificationResponse[]>([]); const [page, setPage] = useState(0); const [pages, setPages] = useState(1);
    const [groupNotifications, setGroupNotifications] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => window.clearTimeout(timer);
    }, [query]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [category, setCategory] = useState('all');
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [visibleEntries, setVisibleEntries] = useState(50);
    const resultsEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { setVisibleEntries(50); }, [debouncedQuery, statusFilter, category, groupNotifications]);
    const [searchItems, setSearchItems] = useState<NotificationResponse[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchProgress, setSearchProgress] = useState(0);
    const [searchError, setSearchError] = useState('');
    useEffect(() => {
        const key = 'module_setting_notifications-page_groupNotifications';
        let active = true;
        const changed = new Set<string>();
        const onChange = (changes: Record<string, { newValue?: unknown }>, area: string) => {
            if (area === 'sync' && key in changes) {
                changed.add(key);
                setGroupNotifications(changes[key].newValue === true);
            }
        };
        browser.storage.onChanged.addListener(onChange);
        void browser.storage.sync.get(key).then(values => {
            if (active && !changed.has(key)) setGroupNotifications(values[key] === true);
        }).catch(() => {});
        return () => { active = false; browser.storage.onChanged.removeListener(onChange); };
    }, []);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);
    const cacheRef = useRef<NotificationsCache>({ head: '', pages: {} });
    const cacheKeyRef = useRef<string | null>(null);
    const cacheReadyRef = useRef<Promise<void> | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveCache = useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveTimerRef.current = null;
            if (cacheKeyRef.current) void browser.storage.local.set({ [cacheKeyRef.current]: cacheRef.current }).catch(() => {});
        }, 1000);
    }, []);
    useEffect(() => () => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            if (cacheKeyRef.current) void browser.storage.local.set({ [cacheKeyRef.current]: cacheRef.current }).catch(() => {});
        }
    }, []);
    const prepareCache = useCallback(() => {
        if (!cacheReadyRef.current) cacheReadyRef.current = (async () => {
            try {
                const response = await fetch(`${api}/user/me`, { credentials: 'include' });
                if (!response.ok) return;
                const user = await response.json();
                if (typeof user.username !== 'string' || !user.username) return;
                const key = CACHE_PREFIX + user.username;
                const stored = await browser.storage.local.get(key);
                cacheKeyRef.current = key;
                const cached = stored[key] as NotificationsCache | undefined;
                if (cached && typeof cached.head === 'string' && cached.pages && typeof cached.pages === 'object') cacheRef.current = cached;
            } catch { /* Continue without persistent cache. */ }
        })();
        return cacheReadyRef.current;
    }, []);
    const fetchPage = useCallback(async (next: number, signal?: AbortSignal): Promise<Result> => {
        await prepareCache();
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const cached = cacheRef.current.pages[String(next)];
        if (next > 1 && cached && Date.now() - cached.savedAt < CACHE_TTL) return cached.data;
        const response = await fetch(`${api}/notifications?page=${next}&size=100`, { credentials: 'include', signal });
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Увійдіть до Hikka, щоб переглянути сповіщення.' : 'Не вдалося завантажити сповіщення.');
        const data: Result = await response.json();
        if (next === 1) {
            const head = data.list.map(item => item.reference).join(',');
            if (cacheRef.current.head !== head) cacheRef.current = { head, pages: {} };
        }
        cacheRef.current.pages[String(next)] = { data, savedAt: Date.now() };
        saveCache();
        return data;
    }, [prepareCache, saveCache]);
    const [count, setCount] = useState(0); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
    const loadCount = useCallback(async () => { try { const r = await fetch(`${api}/notifications/count`, { credentials: 'include' }); if (r.ok) { const unseen = (await r.json()).unseen; setCount(unseen); window.dispatchEvent(new CustomEvent('hikka-forge-notifications-count', { detail: unseen })); } } catch { /* list remains usable */ } }, []);
    const load = useCallback(async (next: number) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true); setError('');
        try {
            const data = await fetchPage(next);
            setItems(previous => { if (next === 1) return data.list; const known = new Set(previous.map(item => item.reference)); return [...previous, ...data.list.filter(item => !known.has(item.reference))]; });
            setPage(data.pagination.page); setPages(data.pagination.pages);
        } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося завантажити сповіщення.'); } finally { loadingRef.current = false; setLoading(false); }
    }, [fetchPage]);
    useEffect(() => { void load(1); void loadCount(); }, [load, loadCount]);
    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || loading || error || query.trim() || statusFilter !== 'all' || category !== 'all' || page === 0 || page >= pages) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) void load(page + 1);
        }, { rootMargin: '300px' });
        observer.observe(target);
        return () => observer.disconnect();
    }, [page, pages, loading, error, load, query, statusFilter, category, selecting]);
    const searchActive = debouncedQuery.length > 0;
    useEffect(() => {
        if (page === 0) return;
        const controller = new AbortController();
        setSearchItems([]); setSearchProgress(0); setSearching(true); setSearchError('');
        const run = async () => {
            try {
                const known = new Set<string>();
                for (let start = 1; start <= pages; start += 4) {
                    const batch = Array.from({ length: Math.min(4, pages - start + 1) }, (_, index) => start + index);
                    const results = await Promise.all(batch.map(current => current === 1 && cacheRef.current.pages['1']?.data ? Promise.resolve(cacheRef.current.pages['1'].data) : fetchPage(current, controller.signal)));
                    if (controller.signal.aborted) return;
                    const fresh = results.flatMap(data => data.list.filter(item => { if (known.has(item.reference)) return false; known.add(item.reference); return true; }));
                    setSearchItems(previous => [...previous, ...fresh]);
                    setSearchProgress(batch[batch.length - 1]);
                    if (results.some(data => data.list.length === 0)) break;
                }
            } catch (e) { if (!controller.signal.aborted) setSearchError(e instanceof Error ? e.message : 'Не вдалося завантажити всі сповіщення.'); }
            finally { if (!controller.signal.aborted) setSearching(false); }
        };
        void run();
        return () => controller.abort();
    }, [page > 0, pages, fetchPage]);
    const markSeen = useCallback(async (id: string) => {
        const r = await fetch(`${api}/notifications/${encodeURIComponent(id)}/seen`, { method: 'POST', credentials: 'include', keepalive: true });
        if (!r.ok) throw new Error('Не вдалося позначити сповіщення прочитаним');
        setItems(previous => previous.map(item => item.reference === id ? { ...item, seen: true } : item));
        setSearchItems(previous => previous.map(item => item.reference === id ? { ...item, seen: true } : item));
        for (const entry of Object.values(cacheRef.current.pages)) entry.data.list = entry.data.list.map(item => item.reference === id ? { ...item, seen: true } : item);
        saveCache();
    }, [saveCache]);
    const markSelected = async () => {
        const pending = searchItems.filter(item => selectedIds.has(item.reference) && !item.seen);
        setBulkSuccess(false); setBulkBusy(true); setBulkProgress(0);
        const failed = new Set<string>();
        for (let i = 0; i < pending.length; i += 4) {
            const batch = pending.slice(i, i + 4);
            const results = await Promise.allSettled(batch.map(item => markSeen(item.reference)));
            results.forEach((result, index) => { if (result.status === 'rejected') failed.add(batch[index].reference); });
            setBulkProgress(Math.min(i + 4, pending.length));
        }
        await loadCount(); setBulkBusy(false); setSelectedIds(failed);
        if (failed.size) setError('Не вдалося позначити деякі сповіщення. Спробуйте ще раз.');
        else setBulkSuccess(true);
    };
    const normalized = useMemo(() => items.map(item => convertNotification(item)).filter((item): item is NotificationItem => item !== null), [items]);
    const normalizedSearch = useMemo(() => searchItems.map(item => convertNotification(item)).filter((item): item is NotificationItem => item !== null), [searchItems]);
    const displayed = useMemo(() => {
        const source = searchActive || statusFilter !== 'all' || category !== 'all' ? normalizedSearch : normalized;
        const needle = debouncedQuery.toLocaleLowerCase('uk');
        return source.filter(item => {
            const matchesQuery = !needle || [item.title, item.description, item.preview, item.actor?.username].some(value => value?.toLocaleLowerCase('uk').includes(needle));
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'unread' ? !item.seen : item.seen);
            const selectedCategory = categories.find(option => option.id === category);
            const matchesCategory = !selectedCategory || (selectedCategory.types as readonly string[]).includes(item.type);
            return matchesQuery && matchesStatus && matchesCategory;
        });
    }, [normalized, normalizedSearch, searchActive, debouncedQuery, statusFilter, category]);
    const sections = useMemo(() => (['today', 'yesterday', 'earlier'] as const).map(day => {
        const list = displayed.filter(item => dayKey(item.created) === day);
        return { day, entries: groupNotifications ? groupSimilarNotifications(list) : list.map(item => ({ kind: 'single' as const, item })) };
    }), [displayed, groupNotifications]);
    const totalEntries = sections.reduce((total, section) => total + section.entries.length, 0);
    useEffect(() => {
        const target = resultsEndRef.current;
        if (!target || visibleEntries >= totalEntries) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) setVisibleEntries(current => Math.min(current + 50, totalEntries));
        }, { rootMargin: '400px' });
        observer.observe(target);
        return () => observer.disconnect();
    }, [visibleEntries, totalEntries, selecting]);
    let remainingEntries = visibleEntries;
    return <ModulePage stateKey="notifications" className="pb-[calc(var(--tab-bar-height,68px)+var(--safe-area-bottom,0px))] md:pb-0"><div className="flex min-h-[70vh] flex-col gap-8 md:gap-12" onDoubleClick={event => { if (event.target === event.currentTarget) cancelSelection(); }}>
        <PageHeader
            title="Сповіщення"
            description="Ваші оновлення та активність спільноти"
            media={<div className="flex aspect-square w-full items-center justify-center rounded-(--base-radius) bg-primary/10"><MaterialSymbolsNotificationsRounded className="size-7 text-primary-foreground" /></div>}
            titleSuffix={count > 0 ? <Badge variant="warning">{count}</Badge> : undefined}
            action={<img src={logo} alt="Hikka Forge" className="size-5 shrink-0 opacity-60" />}
        />
        <div className="flex min-w-0 flex-col gap-4" onDoubleClick={event => { if (event.target === event.currentTarget) cancelSelection(); }}>
            <div className="relative w-full">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Пошук сповіщень..." aria-label="Пошук сповіщень" className="h-11 w-full pl-10 pr-20" />
                {(searchActive || statusFilter !== 'all' || category !== 'all') && searching && <LoaderCircle className="absolute right-10 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Пошук" />}
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Очистити пошук" disabled={!query} onClick={() => setQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground disabled:invisible"><X className="size-4" /></Button>
            </div>
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    <Button type="button" size="badge" variant={statusFilter === 'all' && category === 'all' ? 'default' : 'outline'} aria-pressed={statusFilter === 'all' && category === 'all'} onClick={() => { setStatusFilter('all'); setCategory('all'); }}>Усі</Button>
                    <span aria-hidden="true" className="my-1 w-px self-stretch bg-border" />
                    {[{ id: 'unread', label: 'Непрочитані' }, { id: 'read', label: 'Прочитані' }].map(option => <Button key={option.id} type="button" size="badge" variant={statusFilter === option.id ? 'default' : 'outline'} aria-pressed={statusFilter === option.id} onClick={() => setStatusFilter(statusFilter === option.id ? 'all' : option.id)}>{option.label}</Button>)}
                    <span aria-hidden="true" className="my-1 w-px self-stretch bg-border" />
                    {categories.filter((option, index) => index < 4 || showAllCategories || category === option.id).map(option => <Button key={option.id} type="button" size="badge" variant={category === option.id ? 'default' : 'outline'} aria-pressed={category === option.id} onClick={() => setCategory(category === option.id ? 'all' : option.id)}>{option.label}</Button>)}
                    <Button type="button" size="badge" variant="outline" aria-label={showAllCategories ? 'Приховати категорії' : 'Показати більше категорій'} aria-expanded={showAllCategories} onClick={() => setShowAllCategories(value => !value)}><ChevronDown className={`transition-transform ${showAllCategories ? 'rotate-180' : ''}`} /></Button>
                </div>
            </div>
        </div>
        {selecting && <div className="sticky top-0 z-20 mt-3 flex items-center justify-between gap-2 rounded-md border border-border bg-card/80 px-4 py-2 shadow-sm backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 md:top-16">{ <><span className="text-sm text-muted-foreground">Вибрано: {selectedIds.size}{bulkBusy && ` · ${bulkProgress}`}</span><div className="flex gap-1"><Button size="icon-md" variant="ghost" aria-label="Вибрати всі" title="Вибрати всі" disabled={searching || !!searchError || bulkBusy} onClick={() => { const needle = debouncedQuery.toLocaleLowerCase('uk'); const selectedCategory = categories.find(option => option.id === category); setSelectedIds(new Set(normalizedSearch.filter(item => (!needle || [item.title, item.description, item.preview, item.actor?.username].some(value => value?.toLocaleLowerCase('uk').includes(needle))) && (statusFilter === 'all' || (statusFilter === 'unread' ? !item.seen : item.seen)) && (!selectedCategory || (selectedCategory.types as readonly string[]).includes(item.type))).map(item => item.reference))); }}><Icon icon="boxicons:select-all" /></Button><Button size="icon-md" variant="ghost" aria-label="Прочитати вибрані" title="Прочитати вибрані" disabled={!selectedIds.size || bulkBusy} onClick={() => void markSelected()}>{bulkBusy ? <LoaderCircle className="motion-safe:animate-spin" /> : bulkSuccess ? <Check className="text-success-foreground motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in motion-safe:duration-200" /> : <CheckCheck className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" />}</Button><span aria-hidden="true" className="my-2 mx-1 w-px self-stretch bg-border" /><Button size="icon-md" variant="ghost" aria-label="Скасувати" title="Скасувати" disabled={bulkBusy} onClick={cancelSelection}><X /></Button></div></>}</div>}
        <div className="mt-3 overflow-hidden rounded-md border border-border">
        {sections.map(({ day, entries }) => {
            const visible = entries.slice(0, remainingEntries);
            remainingEntries = Math.max(0, remainingEntries - visible.length);
            if (!visible.length) return null;
            return <section key={day}><div className="border-y border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">{day === 'today' ? 'Сьогодні' : day === 'yesterday' ? 'Вчора' : 'Раніше'}</div>{visible.map(entry => { const mark = (id: string) => { void markSeen(id).then(loadCount).catch(() => setError('Не вдалося позначити сповіщення прочитаним.')); }; return entry.kind === 'group' ? <NotificationGroup key={entry.key} items={entry.items} markSeen={mark} selecting={selecting} selectedIds={selectedIds} toggle={toggle} toggleGroup={toggleGroup} /> : <NotificationRow key={entry.item.reference} item={entry.item} markSeen={mark} selecting={selecting} selected={selectedIds.has(entry.item.reference)} toggle={toggle} />; })}</section>;
        })}
        {visibleEntries < totalEntries && <div ref={resultsEndRef} aria-hidden="true" className="h-px" />}
        {searching && <span className="sr-only" role="status">Завантажено {searchProgress} із {pages} сторінок</span>}
        {(searchActive || statusFilter !== 'all' || category !== 'all') && searchError && <p className="p-4 text-sm text-destructive" role="alert">{searchError}</p>}
        {!searchActive && loading && (page === 0 ? <NotificationsSkeleton /> : <div className="flex justify-center p-4" role="status" aria-label="Завантаження"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>)}
        {(searchActive || statusFilter !== 'all' || category !== 'all') && searching && !displayed.length && <NotificationsSkeleton />}
        {!searchActive && error && <div className="p-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => void load(page ? page + 1 : 1)}>Спробувати ще</Button></div>}
        {!loading && !searching && !searchError && !error && !displayed.length && <div className="p-8 text-center"><MaterialSymbolsNotificationsRounded className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">Сповіщень не знайдено</p><p className="text-sm text-muted-foreground">{searchActive || statusFilter !== 'all' || category !== 'all' ? 'Спробуйте змінити пошуковий запит або фільтр' : 'Тут будуть відображатись майбутні сповіщення'}</p></div>}
        {!searchActive && statusFilter === 'all' && category === 'all' && visibleEntries >= totalEntries && page > 0 && page < pages && <div ref={loadMoreRef} aria-hidden="true" className="h-px" />}
    </div></div>
    </div></ModulePage>;
}
