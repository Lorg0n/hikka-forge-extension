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
import { ChevronDown, LoaderCircle, X } from 'lucide-react';
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
function NotificationRow({ item, markSeen }: { item: NotificationItem; markSeen: (id: string) => void }) {
    const NotificationIcon = item.scoreSign ? (item.scoreSign > 0 ? MaterialSymbolsHeartPlusRounded : MaterialSymbolsHeartMinusRounded) : icons[item.type] || MaterialSymbolsNotificationsRounded;
    const image = item.actor?.avatar || item.contentImage;
    return <div className={`group/item flex gap-3 border-t border-l-4 border-border px-3 py-2.5 transition-colors hover:bg-muted ${item.seen ? 'border-l-transparent' : 'border-l-primary-foreground/60 bg-primary-foreground/10'}`}>
        <div className="relative size-10 shrink-0">
            {image ? <img src={image} alt={item.actor?.username || ''} className="size-10 rounded-md object-cover" /> : <div className="flex size-10 items-center justify-center rounded-md border border-border bg-secondary/40"><NotificationIcon className="size-5" /></div>}
            {image && <span className={`absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-sm border ${accents[item.accent]}`}><NotificationIcon className="size-2.5" /></span>}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col gap-1">
            {item.href !== '#' && <a href={item.href} className="absolute inset-0 z-10" aria-label={item.title} onClick={() => { if (!item.seen) markSeen(item.reference); }} />}
            <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium leading-tight">{item.title}</span>{item.scoreSign && <span className={`rounded-sm border px-1 text-xs font-bold ${accents[item.accent]}`}>{item.scoreSign > 0 ? '+1' : '-1'}</span>}</div>
            <div className="line-clamp-2 text-xs text-muted-foreground"><ReactMarkdown allowedElements={['p', 'strong', 'em', 'del', 'code']} unwrapDisallowed>{item.description || ''}</ReactMarkdown></div>
            {item.preview && <blockquote className="mt-0.5 line-clamp-1 border-l-2 border-muted-foreground/20 pl-2 text-xs text-muted-foreground"><ReactMarkdown allowedElements={['p', 'strong', 'em', 'del', 'code']} unwrapDisallowed>{item.preview}</ReactMarkdown></blockquote>}
            <time className="text-xs opacity-60" dateTime={new Date(item.created * 1000).toISOString()}>{new Date(item.created * 1000).toLocaleString('uk-UA')}</time>
        </div>
    </div>;
}
function NotificationGroup({ items, markSeen }: { items: NotificationItem[]; markSeen: (id: string) => void }) {
    const [latest] = items;
    const actors = getNotificationGroupActors(items);
    const unseen = items.filter(item => !item.seen);
    const score = latest.scoreSign ? latest.scoreSign * items.length : 0;
    const GroupIcon = latest.scoreSign ? (latest.scoreSign > 0 ? MaterialSymbolsHeartPlusRounded : MaterialSymbolsHeartMinusRounded) : icons[latest.type] || MaterialSymbolsNotificationsRounded;
    const image = latest.actor?.avatar || latest.contentImage;
    const avatar = (actor: typeof actors[number], className: string) => <div className={`absolute flex size-7 items-center justify-center overflow-hidden rounded-md bg-secondary text-xs font-medium uppercase ${className}`}>{actor.avatar ? <img src={actor.avatar} alt={actor.username || ''} className="size-full object-cover" /> : actor.username?.[0]}</div>;
    return <Collapsible className="border-t border-border first:border-t-0" onOpenChange={open => { if (open) unseen.forEach(item => markSeen(item.reference)); }}>
        <CollapsibleTrigger className={`group/item flex w-full cursor-pointer gap-3 border-l-4 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted ${unseen.length ? 'border-l-primary-foreground/60 bg-primary-foreground/10' : 'border-l-transparent'}`}>
            <div className="relative size-10 shrink-0">
                {actors[1] ? <>{avatar(actors[1], 'top-0 left-0')}{avatar(actors[0], 'right-0 bottom-0 ring-2 ring-popover')}</> : image ? <img src={image} alt={latest.actor?.username || ''} className="size-10 rounded-md object-cover" /> : <div className="flex size-10 items-center justify-center rounded-md border border-border bg-secondary/40"><GroupIcon className="size-5" /></div>}
                {(actors[1] || image) && <div className={`absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-sm border ${accents[latest.accent]}`}><GroupIcon className="size-2.5" /></div>}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium leading-tight">{latest.title}</span><div className="flex shrink-0 items-center gap-1"><span className={`rounded-sm border px-1 text-xs font-bold tabular-nums ${accents[score > 0 ? 'success' : score < 0 ? 'destructive' : 'neutral']}`}>{score > 0 ? `+${score}` : score < 0 ? score : items.length}</span><MaterialSymbolsKeyboardArrowDownRounded className="size-5 text-muted-foreground transition-transform group-data-[state=open]/item:rotate-180" /></div></div>
                <div className="line-clamp-2 text-xs text-muted-foreground"><ReactMarkdown allowedElements={['p', 'strong', 'em', 'del', 'code']} unwrapDisallowed>{getNotificationGroupDescription(items)}</ReactMarkdown></div>
                <div className="flex items-center gap-1.5 text-xs"><time className="opacity-60" dateTime={new Date(latest.created * 1000).toISOString()}>{new Date(latest.created * 1000).toLocaleString('uk-UA')}</time>{unseen.length > 0 && unseen.length < items.length && <span className="font-medium text-primary-foreground">· {unseen.length} {getDeclensionWord(unseen.length, ['нове', 'нові', 'нових'])}</span>}</div>
            </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden border-t border-border">{items.map(item => <div key={item.reference} className="pl-5"><NotificationRow item={item} markSeen={markSeen} /></div>)}</CollapsibleContent>
    </Collapsible>;
}
export default function NotificationsView() {
    const [items, setItems] = useState<NotificationResponse[]>([]); const [page, setPage] = useState(0); const [pages, setPages] = useState(1);
    const [groupNotifications, setGroupNotifications] = useState(false);
    const [searchPages, setSearchPages] = useState(10);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => window.clearTimeout(timer);
    }, [query]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [category, setCategory] = useState('all');
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [searchItems, setSearchItems] = useState<NotificationResponse[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchProgress, setSearchProgress] = useState(0);
    const [searchError, setSearchError] = useState('');
    useEffect(() => {
        const key = 'module_setting_notifications-page_groupNotifications';
        const limitKey = 'module_setting_notifications-page_searchPages';
        const normalizeLimit = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.min(50, Math.round(value))) : 10;
        let active = true;
        const changed = new Set<string>();
        const onChange = (changes: Record<string, { newValue?: unknown }>, area: string) => {
            if (area === 'sync' && key in changes) {
                changed.add(key);
                setGroupNotifications(changes[key].newValue === true);
            }
            if (area === 'sync' && limitKey in changes) { changed.add(limitKey); setSearchPages(normalizeLimit(changes[limitKey].newValue)); }
        };
        browser.storage.onChanged.addListener(onChange);
        void browser.storage.sync.get([key, limitKey]).then(values => {
            if (active && !changed.has(key)) setGroupNotifications(values[key] === true);
            if (active && !changed.has(limitKey)) setSearchPages(normalizeLimit(values[limitKey]));
        }).catch(() => {});
        return () => { active = false; browser.storage.onChanged.removeListener(onChange); };
    }, []);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);
    const cacheRef = useRef<NotificationsCache>({ head: '', pages: {} });
    const cacheKeyRef = useRef<string | null>(null);
    const cacheReadyRef = useRef<Promise<void> | null>(null);
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
        if (cacheKeyRef.current) void browser.storage.local.set({ [cacheKeyRef.current]: cacheRef.current }).catch(() => {});
        return data;
    }, [prepareCache]);
    const [count, setCount] = useState(0); const [loading, setLoading] = useState(false); const [marking, setMarking] = useState(false); const [error, setError] = useState('');
    const loadCount = useCallback(async () => { try { const r = await fetch(`${api}/notifications/count`, { credentials: 'include' }); if (r.ok) setCount((await r.json()).unseen); } catch { /* list remains usable */ } }, []);
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
        if (!target || loading || error || query.trim() || page === 0 || page >= pages) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) void load(page + 1);
        }, { rootMargin: '300px' });
        observer.observe(target);
        return () => observer.disconnect();
    }, [page, pages, loading, error, load, query]);
    const searchActive = debouncedQuery.length > 0;
    useEffect(() => {
        if (!searchActive) { setSearchItems([]); setSearching(false); setSearchError(''); setSearchProgress(0); return; }
        const controller = new AbortController();
        setSearchItems([]); setSearchProgress(0); setSearching(true); setSearchError('');
        const timer = window.setTimeout(async () => {
            try {
                for (let current = 1; current <= searchPages; current++) {
                    const data = await fetchPage(current, controller.signal);
                    if (controller.signal.aborted) return;
                    setSearchItems(previous => { const known = new Set(previous.map(item => item.reference)); return [...previous, ...data.list.filter(item => !known.has(item.reference))]; });
                    setSearchProgress(current);
                    if (current >= data.pagination.pages || !data.list.length) break;
                }
            } catch (e) { if (!controller.signal.aborted) setSearchError(e instanceof Error ? e.message : 'Не вдалося виконати пошук.'); }
            finally { if (!controller.signal.aborted) setSearching(false); }
        }, 350);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [searchActive, searchPages, fetchPage]);
    const markSeen = useCallback(async (id: string) => {
        const r = await fetch(`${api}/notifications/${encodeURIComponent(id)}/seen`, { method: 'POST', credentials: 'include', keepalive: true });
        if (!r.ok) throw new Error('Не вдалося позначити сповіщення прочитаним');
        setItems(previous => previous.map(item => item.reference === id ? { ...item, seen: true } : item));
        setSearchItems(previous => previous.map(item => item.reference === id ? { ...item, seen: true } : item));
        for (const entry of Object.values(cacheRef.current.pages)) entry.data.list = entry.data.list.map(item => item.reference === id ? { ...item, seen: true } : item);
        if (cacheKeyRef.current) void browser.storage.local.set({ [cacheKeyRef.current]: cacheRef.current }).catch(() => {});
    }, []);
    const markAll = async () => { setMarking(true); const results = await Promise.allSettled(items.filter(item => !item.seen).map(item => markSeen(item.reference))); await loadCount(); if (results.some(r => r.status === 'rejected')) setError('Не вдалося позначити всі сповіщення прочитаними.'); setMarking(false); };
    const normalized = useMemo(() => items.map(item => convertNotification(item)).filter((item): item is NotificationItem => item !== null), [items]);
    const normalizedSearch = useMemo(() => searchItems.map(item => convertNotification(item)).filter((item): item is NotificationItem => item !== null), [searchItems]);
    const displayed = useMemo(() => {
        const source = searchActive ? normalizedSearch : normalized;
        const needle = debouncedQuery.toLocaleLowerCase('uk');
        return source.filter(item => {
            const matchesQuery = !needle || [item.title, item.description, item.preview, item.actor?.username].some(value => value?.toLocaleLowerCase('uk').includes(needle));
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'unread' ? !item.seen : item.seen);
            const selectedCategory = categories.find(option => option.id === category);
            const matchesCategory = !selectedCategory || (selectedCategory.types as readonly string[]).includes(item.type);
            return matchesQuery && matchesStatus && matchesCategory;
        });
    }, [normalized, normalizedSearch, searchActive, debouncedQuery, statusFilter, category]);
    return <ModulePage stateKey="notifications"><div className="flex flex-col gap-8 md:gap-12">
        <PageHeader
            title="Сповіщення"
            description="Ваші оновлення та активність спільноти"
            media={<div className="flex aspect-square w-full items-center justify-center rounded-(--base-radius) bg-primary/10"><MaterialSymbolsNotificationsRounded className="size-7 text-primary-foreground" /></div>}
            titleSuffix={count > 0 ? <Badge variant="warning">{count}</Badge> : undefined}
            action={<img src={logo} alt="Hikka Forge" className="size-5 shrink-0 opacity-60" />}
        />
        <div className="flex min-w-0 flex-col gap-4">
            <div className="relative w-full">
                <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Пошук сповіщень..." aria-label="Пошук сповіщень" className="w-full pr-20" />
                {searchActive && searching && <LoaderCircle className="absolute right-10 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Пошук" />}
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Очистити пошук" disabled={!query} onClick={() => setQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground disabled:invisible"><X className="size-4" /></Button>
            </div>
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    <Button type="button" size="badge" variant={statusFilter === 'all' && category === 'all' ? 'default' : 'outline'} aria-pressed={statusFilter === 'all' && category === 'all'} onClick={() => { setStatusFilter('all'); setCategory('all'); }}>Усі</Button>
                    {[{ id: 'unread', label: 'Непрочитані' }, { id: 'read', label: 'Прочитані' }].map(option => <Button key={option.id} type="button" size="badge" variant={statusFilter === option.id ? 'default' : 'outline'} aria-pressed={statusFilter === option.id} onClick={() => setStatusFilter(statusFilter === option.id ? 'all' : option.id)}>{option.label}</Button>)}
                    {categories.filter((option, index) => index < 4 || showAllCategories || category === option.id).map(option => <Button key={option.id} type="button" size="badge" variant={category === option.id ? 'default' : 'outline'} aria-pressed={category === option.id} onClick={() => setCategory(category === option.id ? 'all' : option.id)}>{option.label}</Button>)}
                    <Button type="button" size="badge" variant="outline" aria-label={showAllCategories ? 'Приховати категорії' : 'Показати більше категорій'} aria-expanded={showAllCategories} onClick={() => setShowAllCategories(value => !value)}><ChevronDown className={`transition-transform ${showAllCategories ? 'rotate-180' : ''}`} /></Button>
                </div>
            </div>
        </div>
        <div className="overflow-hidden rounded-md border border-border">
        {count > 0 && <div className="flex justify-end bg-muted/40 px-3 py-3"><Button size="sm" variant="outline" disabled={marking || loading} onClick={() => void markAll()}>Прочитати всі</Button></div>}
        {(['today', 'yesterday', 'earlier'] as const).map(day => {
            const list = displayed.filter(item => dayKey(item.created) === day); if (!list.length) return null;
            return <section key={day}><div className="border-y border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">{day === 'today' ? 'Сьогодні' : day === 'yesterday' ? 'Вчора' : 'Раніше'}</div>{(groupNotifications ? groupSimilarNotifications(list) : list.map(item => ({ kind: 'single' as const, item }))).map(entry => { const mark = (id: string) => { void markSeen(id).then(loadCount).catch(() => setError('Не вдалося позначити сповіщення прочитаним.')); }; return entry.kind === 'group' ? <NotificationGroup key={entry.key} items={entry.items} markSeen={mark} /> : <NotificationRow key={entry.item.reference} item={entry.item} markSeen={mark} />; })}</section>;
        })}
        {searchActive && searching && <span className="sr-only" role="status">Пошук: перевірено {searchProgress} із {searchPages} сторінок</span>}
        {searchActive && searchError && <p className="p-4 text-sm text-destructive" role="alert">{searchError}</p>}
        {!searchActive && loading && (page === 0 ? <NotificationsSkeleton /> : <div className="flex justify-center p-4" role="status" aria-label="Завантаження"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>)}
        {searchActive && searching && !displayed.length && <NotificationsSkeleton />}
        {!searchActive && error && <div className="p-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => void load(page ? page + 1 : 1)}>Спробувати ще</Button></div>}
        {!loading && !searching && !searchError && !error && !displayed.length && <div className="p-8 text-center"><MaterialSymbolsNotificationsRounded className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">Сповіщень не знайдено</p><p className="text-sm text-muted-foreground">{searchActive || statusFilter !== 'all' || category !== 'all' ? 'Спробуйте змінити пошуковий запит або фільтр' : 'Тут будуть відображатись майбутні сповіщення'}</p></div>}
        {!searchActive && page > 0 && page < pages && <div ref={loadMoreRef} aria-hidden="true" className="h-px" />}
    </div></div>
    </div></ModulePage>;
}
