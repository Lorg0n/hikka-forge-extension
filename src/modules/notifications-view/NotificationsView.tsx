import { useCallback, useEffect, useState } from 'react';
import { ModulePage } from '@/components/ui/module-page';
import { Button } from '@/components/ui/button';

type Notification = { reference: string; notification_type: string; created: number; seen: boolean; initiator_user?: { username?: string; avatar?: string } | null; data: Record<string, unknown> };
type Result = { pagination: { page: number; pages: number; total: number }; list: Notification[] };
const labels: Record<string, string> = {
    comment_reply: 'Відповіді на коментар', comment_vote: 'Оцінки коментаря', comment_tag: 'Згадки',
    collection_comment: 'Коментарі до колекції', article_comment: 'Коментарі до статті',
    collection_vote: 'Оцінки колекції', article_vote: 'Оцінки статті', edit_comment: 'Коментарі до правок',
    edit_accepted: 'Прийняті правки', edit_denied: 'Відхилені правки', edit_updated: 'Оновлення правок',
    hikka_update: 'Оновлення Hikka', schedule_anime: 'Нові епізоди', follow: 'Нові підписники', thirdparty_login: 'Вхід у застосунок',
};
function itemHref(item: Notification): string {
    const d = item.data;
    if (typeof d.link === 'string' && (d.link.startsWith('/') || d.link.startsWith('https://hikka.io/'))) return d.link;
    if (item.notification_type === 'follow' && typeof d.username === 'string') return `/u/${encodeURIComponent(d.username)}`;
    if (typeof d.slug === 'string') {
        const type = typeof d.content_type === 'string' ? d.content_type : item.notification_type.startsWith('article') ? 'article' : 'collection';
        const path = ({ article: 'articles', collection: 'collections' } as Record<string, string>)[type] || type;
        return `/${path}/${encodeURIComponent(d.slug)}`;
    }
    return '#';
}
export default function NotificationsView() {
    const [items, setItems] = useState<Notification[]>([]);
    const [page, setPage] = useState(0);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const load = useCallback(async (next: number) => {
        setLoading(true); setError('');
        try {
            const response = await fetch(`https://api.hikka.io/notifications?page=${next}&size=25`, { credentials: 'include' });
            if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Увійдіть до Hikka, щоб переглянути сповіщення.' : 'Не вдалося завантажити сповіщення.');
            const data: Result = await response.json();
            setItems(previous => next === 1 ? data.list : [...previous, ...data.list.filter(item => !previous.some(old => old.reference === item.reference))]);
            setPage(data.pagination.page); setPages(data.pagination.pages);
        } catch (e) { setError(e instanceof Error ? e.message : 'Не вдалося завантажити сповіщення.'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { void load(1); }, [load]);
    const groups = new Map<string, Notification[]>();
    for (const item of items) groups.set(item.notification_type, [...(groups.get(item.notification_type) || []), item]);
    const renderItem = (item: Notification) => <a key={item.reference} href={itemHref(item)} className={`flex gap-3 border-t border-border p-4 hover:bg-muted/60 ${!item.seen ? 'bg-primary/10' : ''}`}>
        {item.initiator_user?.avatar && <img src={item.initiator_user.avatar} alt="" className="size-10 rounded-md object-cover" />}
        <span className="min-w-0 flex-1"><span className="block font-medium">{item.initiator_user?.username || (typeof item.data.username === 'string' ? item.data.username : labels[item.notification_type] || 'Сповіщення')}</span>
        <span className="block text-sm text-muted-foreground">{typeof item.data.description === 'string' ? item.data.description : typeof item.data.comment_text === 'string' ? item.data.comment_text : labels[item.notification_type] || 'Сповіщення'}</span>
        <time className="text-xs text-muted-foreground">{new Date(item.created * 1000).toLocaleString('uk-UA')}</time></span>
    </a>;
    return <ModulePage stateKey="notifications"><div className="flex flex-col gap-6"><div><h1 className="text-3xl font-bold">Сповіщення</h1><p className="mt-2 text-muted-foreground">Усі ваші сповіщення в одному місці</p></div>
        {Array.from(groups, ([type, group]) => group.length === 1 ? <div key={type} className="overflow-hidden rounded-lg border border-border">{renderItem(group[0])}</div> : <details key={type} className="overflow-hidden rounded-lg border border-border"><summary className="cursor-pointer p-4 font-medium hover:bg-muted/60">{labels[type] || type} <span className="text-muted-foreground">· {group.length}</span></summary>{group.map(renderItem)}</details>)}
        {loading && <p className="text-muted-foreground">Завантаження…</p>}{error && <div><p className="text-destructive">{error}</p><Button variant="outline" onClick={() => void load(page ? page + 1 : 1)}>Спробувати ще</Button></div>}
        {!loading && !error && !items.length && <p className="text-muted-foreground">У вас поки немає сповіщень</p>}
        {!loading && !error && page < pages && <Button variant="outline" onClick={() => void load(page + 1)}>Завантажити ще</Button>}
    </div></ModulePage>;
}
