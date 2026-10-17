import React, { useEffect, useMemo, useState } from 'react';

import logo from '@/assets/logo.svg';
import NotFound from '@/components/ui/not-found';
import { useContentUI } from '@/contexts/ContentUIContext';
import { useContentRelations } from '@/hooks/useContentRelations';
import { RelationsGraph } from '@/modules/relations-page/RelationsGraph';
import type { FranchiseContentType, GraphNode } from '@/types';

const TABLIST_SELECTOR = 'div[role="tablist"]:has(> a[role="tab"][href*="/franchise"])';
const TAB_MARKER = 'data-hikka-forge-franchise-graph-tab';
const GRAPH_HASH = '#hikka-forge-franchise-graph';
const TAB_IDLE_CLASS =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring border border-transparent px-3.5 text-sm bg-secondary/40 text-muted-foreground hover:bg-accent';
const TAB_ACTIVE_CLASS =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring border px-3.5 text-sm border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground active';

interface NativeTabState {
    className: string;
    ariaSelected: string | null;
    tabIndex: string | null;
    ariaCurrent: string | null;
}

interface NativeContentState {
    display: string;
    hidden: boolean;
}

function parseFranchisePath(pathname: string): { contentType: FranchiseContentType; slug: string } | null {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 3) return null;

    const [contentType, ...rest] = segments;
    if ((contentType !== 'anime' && contentType !== 'manga') || rest.at(-1) !== 'franchise') {
        return null;
    }

    const slug = rest.slice(0, -1).join('/');
    return slug ? { contentType, slug } : null;
}

function isGraphView(): boolean {
    return window.location.hash === GRAPH_HASH;
}

function getGraphHref(): string {
    const url = new URL(window.location.href);
    url.hash = GRAPH_HASH;
    return `${url.pathname}${url.search}${url.hash}`;
}

function clearGraphView(): void {
    const url = new URL(window.location.href);
    if (url.hash !== GRAPH_HASH) return;

    url.hash = '';
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
}

function setTabState(tab: HTMLElement, active: boolean): void {
    tab.className = active ? TAB_ACTIVE_CLASS : TAB_IDLE_CLASS;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
}

const ContentRelationsButton: React.FC = () => {
    const ui = useContentUI();
    const parsed = useMemo(() => parseFranchisePath(window.location.pathname), []);
    const [active, setActive] = useState(isGraphView);
    const { nodes, edges, loading, error } = useContentRelations({
        contentType: parsed?.contentType ?? 'anime',
        slug: parsed?.slug ?? '',
    });

    const currentNodeId = useMemo(() => {
        if (!parsed) return undefined;
        return nodes.find((node: GraphNode) => (
            node.type === parsed.contentType && node.slug === parsed.slug
        ))?.id;
    }, [nodes, parsed]);

    useEffect(() => {
        const host = ui?.host;
        if (!host || !parsed) return;

        let tabList: HTMLElement | null = null;
        let forgeTab: HTMLAnchorElement | null = null;
        let nativeContent: HTMLElement | null = null;
        let syncFrame: number | null = null;
        const savedTabs = new Map<HTMLElement, NativeTabState>();
        let savedContent: NativeContentState | null = null;

        const nativeTabs = (): HTMLElement[] => tabList
            ? Array.from(tabList.querySelectorAll<HTMLElement>(
                `:scope > [role="tab"]:not([${TAB_MARKER}])`,
            ))
            : [];

        const saveNativeTabs = () => {
            for (const tab of nativeTabs()) {
                if (savedTabs.has(tab)) continue;
                savedTabs.set(tab, {
                    className: tab.className,
                    ariaSelected: tab.getAttribute('aria-selected'),
                    tabIndex: tab.getAttribute('tabindex'),
                    ariaCurrent: tab.getAttribute('aria-current'),
                });
            }
        };

        const restoreNativeTabs = () => {
            for (const [tab, state] of savedTabs) {
                if (!tab.isConnected) continue;
                tab.className = state.className;
                for (const [attribute, value] of Object.entries({
                    'aria-selected': state.ariaSelected,
                    tabindex: state.tabIndex,
                    'aria-current': state.ariaCurrent,
                })) {
                    if (value === null) tab.removeAttribute(attribute);
                    else tab.setAttribute(attribute, value);
                }
            }
            savedTabs.clear();
        };

        const findNativeContent = (toolbar: HTMLElement): HTMLElement | null => {
            let sibling = toolbar.nextElementSibling;
            while (sibling === host) sibling = sibling.nextElementSibling;
            return sibling instanceof HTMLElement ? sibling : null;
        };

        const restoreNativeContent = () => {
            if (nativeContent?.isConnected && savedContent) {
                nativeContent.hidden = savedContent.hidden;
                nativeContent.style.display = savedContent.display;
            }
            savedContent = null;
        };

        const syncNativeContent = (toolbar: HTMLElement) => {
            if (host.previousElementSibling !== toolbar) toolbar.after(host);
            const nextNativeContent = findNativeContent(toolbar);
            if (nextNativeContent === nativeContent) return;

            // Hikka replaces only the view panel when switching tabs. Restore
            // the old panel if it survived, then track the newly rendered one.
            restoreNativeContent();
            nativeContent = nextNativeContent;
        };

        const setActiveView = (nextActive: boolean) => {
            setActive(nextActive);
            host.hidden = !nextActive;
            host.style.display = nextActive ? 'block' : 'none';

            if (nextActive) {
                saveNativeTabs();
                for (const tab of nativeTabs()) setTabState(tab, false);
                if (nativeContent && !savedContent) {
                    savedContent = {
                        display: nativeContent.style.display,
                        hidden: nativeContent.hidden,
                    };
                }
                if (nativeContent) {
                    nativeContent.hidden = true;
                    nativeContent.style.display = 'none';
                }
            } else {
                restoreNativeTabs();
                restoreNativeContent();
            }

            if (forgeTab) setTabState(forgeTab, nextActive);
        };

        const createTab = (): HTMLAnchorElement => {
            const tab = document.createElement('a');
            tab.href = getGraphHref();
            tab.id = 'hikka-forge-franchise-graph-tab';
            tab.setAttribute('role', 'tab');
            tab.setAttribute(TAB_MARKER, 'true');
            tab.setAttribute('aria-label', 'Граф Hikka Forge');

            const image = document.createElement('img');
            image.src = logo;
            image.alt = '';
            image.className = 'size-4 shrink-0';
            tab.append(document.createTextNode('Граф'), image);
            return tab;
        };

        const sync = () => {
            const nextTabList = document.querySelector<HTMLElement>(TABLIST_SELECTOR);
            if (!nextTabList) {
                setActiveView(false);
                return;
            }

            if (tabList !== nextTabList) {
                restoreNativeTabs();
                restoreNativeContent();
                forgeTab?.remove();
                tabList = nextTabList;
                forgeTab = tabList.querySelector<HTMLAnchorElement>(`[${TAB_MARKER}]`) ?? createTab();
                tabList.append(forgeTab);
                const toolbar = tabList.parentElement;
                if (toolbar instanceof HTMLElement) {
                    syncNativeContent(toolbar);
                }
            }

            const toolbar = tabList.parentElement;
            if (toolbar instanceof HTMLElement) syncNativeContent(toolbar);
            if (forgeTab) forgeTab.href = getGraphHref();
            setActiveView(isGraphView());
        };

        const scheduleSync = () => {
            if (syncFrame !== null) return;
            syncFrame = requestAnimationFrame(() => {
                syncFrame = null;
                sync();
            });
        };

        const handleTabClick = (event: Event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const tab = target.closest<HTMLElement>('[role="tab"]');
            if (!tab) return;

            if (tab.hasAttribute(TAB_MARKER)) {
                event.preventDefault();
                event.stopPropagation();
                window.history.pushState(null, '', getGraphHref());
                setActiveView(true);
                return;
            }

            // Hikka can switch its view without changing the URL. Do not leave
            // our hash marker behind: a later reconciliation (for example after
            // returning to the tab) would otherwise treat it as a request to
            // show the Forge graph again. Query parameters belong to Hikka and
            // are deliberately left untouched.
            clearGraphView();
            setActiveView(false);
        };

        const handlePopState = () => sync();
        const observer = new MutationObserver(scheduleSync);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        document.addEventListener('click', handleTabClick, true);
        window.addEventListener('popstate', handlePopState);
        sync();

        return () => {
            observer.disconnect();
            if (syncFrame !== null) cancelAnimationFrame(syncFrame);
            document.removeEventListener('click', handleTabClick, true);
            window.removeEventListener('popstate', handlePopState);
            restoreNativeTabs();
            restoreNativeContent();
            forgeTab?.remove();
            host.hidden = false;
            host.style.display = 'block';
        };
    }, [parsed, ui]);

    if (!active || !parsed) return null;

    if (loading) {
        return <div className="mt-4 h-[min(78svh,900px)] min-h-[420px] animate-pulse rounded-lg bg-secondary/20" />;
    }

    if (error) {
        return <NotFound title="Помилка завантаження" description={error} />;
    }

    return (
        <RelationsGraph
            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
            nodes={nodes}
            edges={edges}
            currentNodeId={currentNodeId}
        />
    );
};

export default ContentRelationsButton;
