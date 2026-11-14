import type { SimilarContentType } from '@/types';

export const FAN_HASH = '#fan';

export interface MediaPlusRoute {
    contentType: SimilarContentType;
    slug: string;
    key: string;
}

export function parseMediaPlusRoute(): MediaPlusRoute | null {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const contentType = segments[0];
    if ((contentType !== 'anime' && contentType !== 'manga') || segments.length < 2) return null;

    const slugParts = segments.slice(1);
    if (slugParts.at(-1) === 'media') slugParts.pop();
    const slug = slugParts.join('/');
    return slug ? { contentType, slug, key: `${contentType}:${slug}` } : null;
}

export function isFanMediaLocation(): boolean {
    return window.location.hash === FAN_HASH;
}

export function fanMediaHref(): string {
    const url = new URL(window.location.href);
    url.hash = FAN_HASH;
    return `${url.pathname}${url.search}${url.hash}`;
}

export function clearFanMediaHash(): void {
    if (!isFanMediaLocation()) return;
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
}
