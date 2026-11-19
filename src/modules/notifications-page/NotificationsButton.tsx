import { useEffect } from 'react';

type ButtonPair = { original: HTMLButtonElement; replacement: HTMLAnchorElement; display: string };

export default function NotificationsButton() {
    useEffect(() => {
        const pairs = new Map<'desktop' | 'mobile', ButtonPair>();
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
                if (current.replacement.innerHTML !== original.innerHTML) current.replacement.innerHTML = original.innerHTML;
                if (current.replacement.className !== original.className) current.replacement.className = original.className;
                return;
            }
            remove(key);
            if (!original) return;
            const replacement = document.createElement('a');
            replacement.className = original.className;
            replacement.innerHTML = original.innerHTML;
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
        update();
        const observer = new MutationObserver(update);
        observer.observe(document.body, { childList: true, characterData: true, subtree: true });
        return () => { observer.disconnect(); remove('desktop'); remove('mobile'); };
    }, []);
    return null;
}
