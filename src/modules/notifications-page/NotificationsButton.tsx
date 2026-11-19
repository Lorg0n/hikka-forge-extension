import { useEffect } from 'react';

export default function NotificationsButton() {
    useEffect(() => {
        let original: HTMLButtonElement | null = null;
        let replacement: HTMLAnchorElement | null = null;
        const update = () => {
            if (original?.isConnected && replacement?.isConnected) {
                // Hikka updates the original button's unread badge in place.
                if (replacement.innerHTML !== original.innerHTML) replacement.innerHTML = original.innerHTML;
                return;
            }
            replacement?.remove();
            if (original) original.style.display = '';
            original = Array.from(document.querySelectorAll<HTMLButtonElement>('header button[data-slot="dropdown-menu-trigger"]')).find(button =>
                !!button.querySelector('svg path[d^="M5 19q"]')) ?? null;
            if (!original) return;
            replacement = document.createElement('a');
            replacement.className = original.className;
            replacement.innerHTML = original.innerHTML;
            replacement.setAttribute('href', '#notifications');
            replacement.setAttribute('aria-label', 'Сповіщення');
            original.style.display = 'none';
            original.after(replacement);
        };
        update();
        const observer = new MutationObserver(update);
        observer.observe(document.body, { childList: true, characterData: true, subtree: true });
        return () => { observer.disconnect(); replacement?.remove(); if (original) original.style.display = ''; };
    }, []);
    return null;
}
