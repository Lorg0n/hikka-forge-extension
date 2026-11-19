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
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ModulePage } from '@/components/ui/module-page';
import { PageHeader } from '@/components/ui/page-header';
import logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { convertNotification, type NotificationItem, type NotificationResponse } from './notifications';

type Result = { pagination: { page: number; pages: number }; list: NotificationResponse[] };
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
export default function NotificationsView() {
    const [items, setItems] = useState<NotificationResponse[]>([]); const [page, setPage] = useState(0); const [pages, setPages] = useState(1);
    const [count, setCount] = useState(0); const [loading, setLoading] = useState(false); const [marking, setMarking] = useState(false); const [error, setError] = useState('');
    const loadCount = useCallback(async () => { try { const r = await fetch(`${api}/notifications/count`, { credentials: 'include' }); if (r.ok) setCount((await r.json()).unseen); } catch { /* list remains usable */ } }, []);
    const load = useCallback(async (next: number) => {
        setLoading(true); setError('');
        try {
            const r = await fetch(`${api}/notifications?page=${next}&size=25`, { credentials: 'include' });
            if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Увійдіть до Hikka, щоб переглянути сповіщення.' : 'Не вдалося завантажити сповіщення.');
            const data: Result = await r.json();
            setItems(previous => next === 1 ? data.list : [...previous, ...data.list.filter(item => !previous.some(old => old.reference === item.reference))]);
            setPage(data.pagination.page); setPages(data.pagination.pages);
        } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося завантажити сповіщення.'); } finally { setLoading(false); }
    }, []);
    useEffect(() => { void load(1); void loadCount(); }, [load, loadCount]);
    const markSeen = useCallback(async (id: string) => {
        const r = await fetch(`${api}/notifications/${encodeURIComponent(id)}/seen`, { method: 'POST', credentials: 'include', keepalive: true });
        if (!r.ok) throw new Error('Не вдалося позначити сповіщення прочитаним');
        setItems(previous => previous.map(item => item.reference === id ? { ...item, seen: true } : item));
    }, []);
    const markAll = async () => { setMarking(true); const results = await Promise.allSettled(items.filter(item => !item.seen).map(item => markSeen(item.reference))); await loadCount(); if (results.some(r => r.status === 'rejected')) setError('Не вдалося позначити всі сповіщення прочитаними.'); setMarking(false); };
    const normalized = useMemo(() => items.map(item => convertNotification(item)).filter((item): item is NotificationItem => item !== null), [items]);
    return <ModulePage stateKey="notifications"><div className="flex flex-col gap-8 md:gap-12">
        <PageHeader
            title="Сповіщення"
            description="Ваші оновлення та активність спільноти"
            media={<div className="flex aspect-square w-full items-center justify-center rounded-(--base-radius) bg-primary/10"><MaterialSymbolsNotificationsRounded className="size-7 text-primary-foreground" /></div>}
            titleSuffix={count > 0 ? <Badge variant="warning">{count}</Badge> : undefined}
            action={<img src={logo} alt="Hikka Forge" className="size-5 shrink-0 opacity-60" />}
        />
        <div className="overflow-hidden rounded-md border border-border">
        {count > 0 && <div className="flex justify-end bg-muted/40 px-3 py-3"><Button size="sm" variant="outline" disabled={marking || loading} onClick={() => void markAll()}>Прочитати всі</Button></div>}
        {(['today', 'yesterday', 'earlier'] as const).map(day => {
            const list = normalized.filter(item => dayKey(item.created) === day); if (!list.length) return null;
            return <section key={day}><div className="border-y border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">{day === 'today' ? 'Сьогодні' : day === 'yesterday' ? 'Вчора' : 'Раніше'}</div>{list.map(item => <NotificationRow key={item.reference} item={item} markSeen={id => { void markSeen(id).then(loadCount).catch(() => setError('Не вдалося позначити сповіщення прочитаним.')); }} />)}</section>;
        })}
        {loading && <p className="p-4 text-sm text-muted-foreground">Завантаження…</p>}
        {error && <div className="p-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => void load(page ? page + 1 : 1)}>Спробувати ще</Button></div>}
        {!loading && !error && !normalized.length && <div className="p-8 text-center"><MaterialSymbolsNotificationsRounded className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">Сповіщень не знайдено</p><p className="text-sm text-muted-foreground">Тут будуть відображатись майбутні сповіщення</p></div>}
        {!loading && !error && page < pages && <div className="p-3"><Button className="w-full" variant="outline" onClick={() => void load(page + 1)}>Завантажити ще</Button></div>}
    </div></div></ModulePage>;
}
