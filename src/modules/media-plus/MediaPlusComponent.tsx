import React, { useEffect, useRef, useState } from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import NotFound from '@/components/ui/not-found';
import { ResponsiveContentRail } from '@/components/ui/responsive-content-rail';
import { useContentUI } from '@/contexts/ContentUIContext';
import { captureNativeTabState, lockElementHeight, restoreNativeTabState, setNativeTabActive, type NativeTabState } from '@/lib/native-tabs';
import { FAN_HASH, clearFanMediaHash, fanMediaHref, isFanMediaLocation, parseMediaPlusRoute, type MediaPlusRoute } from './mediaPlusRoute';
import { useCommunityMedia } from './useCommunityMedia';

const TAB_MARKER = 'data-hikka-forge-media-plus-tab';
const MAX_MEDIA_ITEMS = 3;
const cardGridClassName = 'no-scrollbar grid w-full min-w-0 grid-flow-col auto-cols-[minmax(11rem,calc((100%_-_1rem)/2))] gap-4 overflow-x-auto overscroll-x-contain pb-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-3 md:overflow-visible md:pb-0';

interface ContentState {
    display: string;
    hidden: boolean;
}

const MediaPlusComponent: React.FC = () => {
    const ui = useContentUI();
    const [route, setRoute] = useState<MediaPlusRoute | null>(() => parseMediaPlusRoute());
    const { items, loading, error } = useCommunityMedia(route);
    const fanTabEnabled = loading || error !== null || items.length > 0;
    const [fanActive, setFanActive] = useState(true);
    const routeKeyRef = useRef(route?.key);
    const fanActiveRef = useRef(true);

    useEffect(() => {
        fanActiveRef.current = fanActive;
    }, [fanActive]);

    useEffect(() => {
        const host = ui?.host;
        if (!host) return;

        if (!fanTabEnabled) {
            host.hidden = true;
            host.style.display = 'none';
            return () => {
                host.hidden = false;
                host.style.display = 'block';
            };
        }

        let section: HTMLElement | null = null;
        let tabList: HTMLElement | null = null;
        let fanTab: HTMLButtonElement | null = null;
        let nativeContent: HTMLElement | null = null;
        let headerLink: HTMLAnchorElement | null = null;
        let originalHeaderHref: string | null = null;
        let contentState: ContentState | null = null;
        let syncFrame: number | null = null;
        let releaseHeightLock: (() => void) | null = null;
        const nativeTabStates = new Map<HTMLElement, NativeTabState>();

        const holdSectionHeight = () => {
            if (!section) return;

            releaseHeightLock?.();
            releaseHeightLock = lockElementHeight(section);
        };

        const nativeTabs = (): HTMLElement[] => tabList
            ? Array.from(tabList.querySelectorAll<HTMLElement>(`:scope > button:not([${TAB_MARKER}])`))
            : [];

        const saveNativeTabs = () => {
            for (const tab of nativeTabs()) {
                if (nativeTabStates.has(tab)) continue;
                nativeTabStates.set(tab, captureNativeTabState(tab));
            }
        };

        const restoreNativeTabs = () => {
            for (const [tab, state] of nativeTabStates) {
                if (!tab.isConnected) continue;
                restoreNativeTabState(tab, state);
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
                for (const tab of nativeTabs()) setNativeTabActive(tab, false);
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

            if (fanTab) setNativeTabActive(fanTab, active);
        };

        const createFanTab = (): HTMLButtonElement => {
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.setAttribute('role', 'tab');
            tab.setAttribute(TAB_MARKER, 'true');
            tab.setAttribute('aria-label', 'Фанатське медіа Hikka Forge');
            tab.append(document.createTextNode('Фанатське'));
            return tab;
        };

        const sync = () => {
            const nextRoute = parseMediaPlusRoute();
            if (nextRoute?.key !== routeKeyRef.current) {
                routeKeyRef.current = nextRoute?.key;
                setRoute(nextRoute);
                setFanView(true);
            }
            if (isFanMediaLocation() && !fanActiveRef.current) setFanView(true);

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
            setFanView(fanActiveRef.current || isFanMediaLocation());
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
                holdSectionHeight();
                window.history.pushState(null, '', fanMediaHref());
                setFanView(true);
                return;
            }

            holdSectionHeight();
            clearFanMediaHash();
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
            releaseHeightLock?.();
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
    }, [fanTabEnabled, ui]);

    if (!fanActive || !route) return null;

    if (loading) {
        return (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 grid grid-cols-2 gap-4 duration-200 motion-reduce:animate-none md:grid-cols-3">
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
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
                <NotFound
                    title={error ? 'Не вдалося завантажити фанатські медіа' : 'Фанатські медіа не знайдено'}
                    description={error
                        ? 'Спробуйте оновити сторінку трохи пізніше.'
                        : 'Для цього тайтлу спільнота ще не додала відео чи інші матеріали.'}
                />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
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
                                                className="size-full object-cover"
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
        </div>
    );
};

export default MediaPlusComponent;
