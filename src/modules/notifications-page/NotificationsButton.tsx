import { useEffect } from 'react';

type ButtonPair = { original: HTMLButtonElement; replacement: HTMLAnchorElement; display: string };

export default function NotificationsButton() {
    useEffect(() => {
        const pairs = new Map<'desktop' | 'mobile', ButtonPair>();
        let unreadCount: number | null = null;
        const renderContent = (original: HTMLButtonElement, key: 'desktop' | 'mobile') => {
            const copy = original.cloneNode(true) as HTMLButtonElement;
            if (unreadCount !== null) {
                copy.querySelectorAll('span.bg-warning').forEach(badge => badge.remove());
                if (unreadCount > 0) {
                    const badge = document.createElement('span');
                    badge.className = `flex h-4 min-w-4 items-center justify-center rounded-full border border-warning-border bg-warning px-1 font-bold text-[0.625rem] text-warning-foreground leading-none tabular-nums absolute ${key === 'mobile' ? '-top-1 -right-2' : '-right-1 -bottom-1'}`;
                    badge.textContent = unreadCount < 100 ? String(unreadCount) : '99+';
                    const parent = key === 'mobile' ? copy.querySelector('svg')?.parentElement : copy;
                    parent?.appendChild(badge);
                }
            }
            return copy.innerHTML;
        };
        const remove = (key: 'desktop' | 'mobile') => {
            const pair = pairs.get(key);
            if (!pair) return;
            pair.replacement.remove();
            pair.original.style.display = pair.display;
            pairs.delete(key);
        };
        const sync = (key: 'desktop' | 'mobile', selector: string) => {
            const original = Array.from(document.querySelectorAll<HTMLButtonElement>(selector)).find(button =>
                !!button.querySelector('svg path[d^="M5 19q"]'));
            const current = pairs.get(key);
            if (current && current.original === original && current.replacement.isConnected) {
                const content = renderContent(original, key);
                if (current.replacement.innerHTML !== content) current.replacement.innerHTML = content;
                if (current.replacement.className !== original.className) current.replacement.className = original.className;
                return;
            }
            remove(key);
            if (!original) return;
            const replacement = document.createElement('a');
            replacement.className = original.className;
            replacement.innerHTML = renderContent(original, key);
            replacement.setAttribute('href', '#notifications');
            replacement.setAttribute('aria-label', 'Сповіщення');
            const display = original.style.display;
            original.style.display = 'none';
            original.after(replacement);
            pairs.set(key, { original, replacement, display });
        };
        const update = () => {
            sync('desktop', 'header button[data-slot="dropdown-menu-trigger"]');
            sync('mobile', 'nav.md\\:hidden button[data-slot="drawer-trigger"]');
        };
        const onCount = (event: Event) => {
            const count = (event as CustomEvent<number>).detail;
            if (Number.isFinite(count) && count >= 0) { unreadCount = count; update(); }
        };
        window.addEventListener('hikka-forge-notifications-count', onCount);
        const refresh = async () => {
            if (document.hidden) return;
            try {
                const response = await fetch('https://api.hikka.io/notifications/count', { credentials: 'include' });
                if (response.ok) onCount(new CustomEvent('count', { detail: (await response.json()).unseen }));
            } catch { /* Keep the last known count. */ }
        };
        const timer = window.setInterval(() => void refresh(), 60_000);
        document.addEventListener('visibilitychange', refresh);
        update();
        const observer = new MutationObserver(update);
        observer.observe(document.body, { childList: true, characterData: true, subtree: true });
        return () => { observer.disconnect(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('hikka-forge-notifications-count', onCount); remove('desktop'); remove('mobile'); };
    }, []);
    return null;
}
