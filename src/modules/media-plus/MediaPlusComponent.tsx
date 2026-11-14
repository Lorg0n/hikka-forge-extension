import React, { useEffect, useRef, useState } from 'react';

import logo from '@/assets/logo.svg';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ResponsiveContentRail } from '@/components/ui/responsive-content-rail';
import { useContentUI } from '@/contexts/ContentUIContext';
import { fetchAnimeCommunityMedia } from '@/services/animeService';
import { fetchMangaCommunityMedia } from '@/services/mangaService';
import type { CommunityMediaItem, SimilarContentType } from '@/types';

const FAN_HASH = '#fan';
const TAB_MARKER = 'data-hikka-forge-media-plus-tab';
const MAX_MEDIA_ITEMS = 3;
const cardGridClassName = 'no-scrollbar grid w-full min-w-0 grid-flow-col auto-cols-[minmax(11rem,calc((100%_-_1rem)/2))] gap-4 overflow-x-auto overscroll-x-contain pb-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-3 md:overflow-visible md:pb-0';

interface ContentRoute {
    contentType: SimilarContentType;
    slug: string;
    key: string;
}

interface ElementState {
    className: string;
    ariaSelected: string | null;
    tabIndex: string | null;
    dataActive: string | null;
}

interface ContentState {
    display: string;
    hidden: boolean;
}

function parseRoute(): ContentRoute | null {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const contentType = segments[0];
    if ((contentType !== 'anime' && contentType !== 'manga') || segments.length < 2) return null;

    const slugParts = segments.slice(1);
    if (slugParts.at(-1) === 'media') slugParts.pop();
    const slug = slugParts.join('/');
    return slug ? { contentType, slug, key: `${contentType}:${slug}` } : null;
}

function isFanHash(): boolean {
    return window.location.hash === FAN_HASH;
}

function fanHref(): string {
    const url = new URL(window.location.href);
    url.hash = FAN_HASH;
    return `${url.pathname}${url.search}${url.hash}`;
}

function clearFanHash(): void {
    if (!isFanHash()) return;
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
}

function setTabState(tab: HTMLElement, active: boolean): void {
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active) tab.setAttribute('data-active', '');
    else tab.removeAttribute('data-active');
}

const MediaPlusComponent: React.FC = () => {
    const ui = useContentUI();
    const [route, setRoute] = useState<ContentRoute | null>(() => parseRoute());
    const [items, setItems] = useState<CommunityMediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fanActive, setFanActive] = useState(true);
    const routeKeyRef = useRef(route?.key);
    const fanActiveRef = useRef(true);

    useEffect(() => {
        fanActiveRef.current = fanActive;
    }, [fanActive]);

    useEffect(() => {
        if (!route) {
            setItems([]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        const request = route.contentType === 'anime'
            ? fetchAnimeCommunityMedia({ slug: route.slug, page: 0, size: MAX_MEDIA_ITEMS })
            : fetchMangaCommunityMedia({ slug: route.slug, page: 0, size: MAX_MEDIA_ITEMS });

        void request
            .then((response) => {
                if (!cancelled) setItems(response.content.slice(0, MAX_MEDIA_ITEMS));
            })
            .catch((requestError: unknown) => {
                if (!cancelled) {
                    setItems([]);
                    setError(requestError instanceof Error ? requestError.message : 'Не вдалося завантажити медіа.');
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [route]);

    useEffect(() => {
        const host = ui?.host;
        if (!host) return;

        let section: HTMLElement | null = null;
        let tabList: HTMLElement | null = null;
        let fanTab: HTMLButtonElement | null = null;
        let nativeContent: HTMLElement | null = null;
        let headerLink: HTMLAnchorElement | null = null;
        let originalHeaderHref: string | null = null;
        let contentState: ContentState | null = null;
        let syncFrame: number | null = null;
        const nativeTabStates = new Map<HTMLElement, ElementState>();

        const nativeTabs = (): HTMLElement[] => tabList
            ? Array.from(tabList.querySelectorAll<HTMLElement>(`:scope > button:not([${TAB_MARKER}])`))
            : [];

        const saveNativeTabs = () => {
            for (const tab of nativeTabs()) {
                if (nativeTabStates.has(tab)) continue;
                nativeTabStates.set(tab, {
                    className: tab.className,
                    ariaSelected: tab.getAttribute('aria-selected'),
                    tabIndex: tab.getAttribute('tabindex'),
                    dataActive: tab.getAttribute('data-active'),
                });
            }
        };

        const restoreNativeTabs = () => {
            for (const [tab, state] of nativeTabStates) {
                if (!tab.isConnected) continue;
                tab.className = state.className;
                for (const [attribute, value] of Object.entries({
                    'aria-selected': state.ariaSelected,
                    tabindex: state.tabIndex,
                    'data-active': state.dataActive,
                })) {
                    if (value === null) tab.removeAttribute(attribute);
                    else tab.setAttribute(attribute, value);
                }
            }
            nativeTabStates.clear();
        };

        const restoreNativeContent = () => {
            if (nativeContent?.isConnected && contentState) {
                nativeContent.hidden = contentState.hidden;
                nativeContent.style.display = contentState.display;
            }
            contentState = null;
        };

        const findHeader = (nextSection: HTMLElement, nextTabList: HTMLElement): HTMLElement | null => (
            Array.from(nextSection.children).find((child) => child.contains(nextTabList)) as HTMLElement | undefined
        ) ?? null;

        const setFanView = (active: boolean) => {
            fanActiveRef.current = active;
            setFanActive(active);
            host.hidden = !active;
            host.style.display = active ? 'block' : 'none';

            if (active) {
                saveNativeTabs();
                for (const tab of nativeTabs()) setTabState(tab, false);
                if (nativeContent && !contentState) {
                    contentState = { display: nativeContent.style.display, hidden: nativeContent.hidden };
                }
                if (nativeContent) {
                    nativeContent.hidden = true;
                    nativeContent.style.display = 'none';
                }
            } else {
                restoreNativeTabs();
                restoreNativeContent();
            }

            if (fanTab) setTabState(fanTab, active);
        };

        const createFanTab = (): HTMLButtonElement => {
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.setAttribute('role', 'tab');
            tab.setAttribute(TAB_MARKER, 'true');
            tab.setAttribute('aria-label', 'Фанатське медіа Hikka Forge');
            tab.append(document.createTextNode('Фанатське'));

            const image = document.createElement('img');
            image.src = logo;
            image.alt = '';
            image.className = 'size-3.5 shrink-0';
            tab.append(image);
            return tab;
        };

        const sync = () => {
            const nextRoute = parseRoute();
            if (nextRoute?.key !== routeKeyRef.current) {
                routeKeyRef.current = nextRoute?.key;
                setRoute(nextRoute);
                setFanView(true);
            }
            if (isFanHash() && !fanActiveRef.current) setFanView(true);

            const nextSection = host.parentElement;
            if (!(nextSection instanceof HTMLElement) || nextSection.id !== 'content-media') return;
            const nextTabList = nextSection.querySelector<HTMLElement>('[role="tablist"]');
            if (!nextTabList) return;
            const header = findHeader(nextSection, nextTabList);
            if (!header) return;

            if (section !== nextSection || tabList !== nextTabList) {
                restoreNativeTabs();
                restoreNativeContent();
                fanTab?.remove();
                section = nextSection;
                tabList = nextTabList;
                fanTab = tabList.querySelector<HTMLButtonElement>(`[${TAB_MARKER}]`) ?? createFanTab();

                const firstNativeTab = nativeTabs()[0];
                if (firstNativeTab) fanTab.className = firstNativeTab.className;
                tabList.prepend(fanTab);
            }

            const nextNativeContent = header.nextElementSibling === host
                ? host.nextElementSibling
                : header.nextElementSibling;
            if (nextNativeContent instanceof HTMLElement && nextNativeContent !== nativeContent) {
                restoreNativeContent();
                nativeContent = nextNativeContent;
            }
            if (host.previousElementSibling !== header) header.after(host);

            const nextHeaderLink = header.querySelector<HTMLAnchorElement>('h2 a[href*="/media"]');
            if (nextHeaderLink !== headerLink) {
                if (headerLink && originalHeaderHref !== null) headerLink.href = originalHeaderHref;
                headerLink = nextHeaderLink;
                originalHeaderHref = headerLink?.getAttribute('href') ?? null;
            }
            if (headerLink && originalHeaderHref) headerLink.href = `${originalHeaderHref.split('#')[0]}${FAN_HASH}`;

            if (fanTab && fanTab.parentElement !== tabList) tabList.prepend(fanTab);
            setFanView(fanActiveRef.current || isFanHash());
        };

        const scheduleSync = () => {
            if (syncFrame !== null) return;
            syncFrame = requestAnimationFrame(() => {
                syncFrame = null;
                sync();
            });
        };

        const handleClick = (event: Event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const tab = target.closest<HTMLElement>(`button[role="tab"], [${TAB_MARKER}]`);
            if (!tab || !tabList?.contains(tab)) return;

            if (tab.hasAttribute(TAB_MARKER)) {
                event.preventDefault();
                event.stopPropagation();
                window.history.pushState(null, '', fanHref());
                setFanView(true);
                return;
            }

            clearFanHash();
            setFanView(false);
        };

        const observer = new MutationObserver(scheduleSync);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        document.addEventListener('click', handleClick, true);
        window.addEventListener('popstate', scheduleSync);
        window.addEventListener('hashchange', scheduleSync);
        sync();

        return () => {
            observer.disconnect();
            if (syncFrame !== null) cancelAnimationFrame(syncFrame);
            document.removeEventListener('click', handleClick, true);
            window.removeEventListener('popstate', scheduleSync);
            window.removeEventListener('hashchange', scheduleSync);
            restoreNativeTabs();
            restoreNativeContent();
            if (headerLink && originalHeaderHref !== null) headerLink.href = originalHeaderHref;
            fanTab?.remove();
            host.hidden = false;
            host.style.display = 'block';
        };
    }, [ui]);

    if (!fanActive || !route) return null;

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array.from({ length: MAX_MEDIA_ITEMS }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-2">
                        <AspectRatio ratio={1.7} className="animate-pulse rounded-md bg-secondary/20" />
                        <div className="h-4 w-4/5 animate-pulse rounded bg-secondary/20" />
                    </div>
                ))}
            </div>
        );
    }

    if (error || items.length === 0) {
        return (
            <p className="py-4 text-sm text-muted-foreground">
                {error ? 'Не вдалося завантажити фанатські медіа.' : 'Фанатських медіа для цього тайтлу поки немає.'}
            </p>
        );
    }

    return (
        <ResponsiveContentRail>
            {({ scrollRef }) => (
                <div ref={scrollRef} className={`${cardGridClassName} px-4 md:px-0`}>
                    {items.map((item) => (
                        <article key={item.id} className="group flex min-w-0 flex-col gap-2">
                            <AspectRatio ratio={1.7} className="overflow-hidden rounded-md bg-muted ring-1 ring-border">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-secondary/20"
                                >
                                    {item.thumbnailUrl ? (
                                        <img
                                            src={item.thumbnailUrl}
                                            alt={item.title}
                                            loading="lazy"
                                            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                        />
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Відео</span>
                                    )}
                                </a>
                            </AspectRatio>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0">
                                <p className="mb-1 truncate text-xs text-muted-foreground">{item.provider}</p>
                                <span className="line-clamp-2 text-sm leading-5 font-medium">{item.title}</span>
                            </a>
                        </article>
                    ))}
                </div>
            )}
        </ResponsiveContentRail>
    );
};

export default MediaPlusComponent;
