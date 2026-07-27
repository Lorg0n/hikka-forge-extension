import React, { useEffect, useRef } from 'react';

import { useContentUI } from '@/contexts/ContentUIContext';

import { UserRecommendationsView } from './UserRecommendationsComponent';

const TABLIST_SELECTOR = 'div[role="tablist"][aria-label="Віджети"]';
const RECOMMENDATIONS_TAB_ID = 'widget-tab-recommendations';
const RECOMMENDATIONS_PANEL_ID = 'widget-panel-recommendations';
const TAB_MARKER = 'data-hikka-forge-recommendations-tab';
const PANEL_MARKER = 'data-hikka-forge-recommendations-panel';

const TAB_IDLE_CLASS =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring border border-transparent px-3.5 text-sm bg-secondary/40 text-muted-foreground hover:bg-accent backdrop-blur';
const TAB_ACTIVE_CLASS =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring border px-3.5 text-sm backdrop-blur border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground';

interface NativeTabState {
    className: string;
    ariaSelected: string | null;
    tabIndex: string | null;
}

interface NativePanelState {
    display: string;
    hidden: boolean;
}

function createSparklesIcon(): SVGSVGElement {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    icon.setAttribute('width', '24');
    icon.setAttribute('height', '24');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('class', 'size-4 shrink-0');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML =
        '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path>';
    return icon;
}

function setTabState(button: HTMLButtonElement, active: boolean): void {
    const className = active ? TAB_ACTIVE_CLASS : TAB_IDLE_CLASS;
    const ariaSelected = String(active);
    const tabIndex = active ? 0 : -1;
    if (button.className !== className) button.className = className;
    if (button.getAttribute('aria-selected') !== ariaSelected) {
        button.setAttribute('aria-selected', ariaSelected);
    }
    if (button.tabIndex !== tabIndex) button.tabIndex = tabIndex;
}

const MobileUserRecommendationsComponent: React.FC = () => {
    const ui = useContentUI();
    const activeRef = useRef(false);

    useEffect(() => {
        const host = ui?.host;
        if (!host) return;

        host.id = RECOMMENDATIONS_PANEL_ID;
        host.setAttribute('role', 'tabpanel');
        host.setAttribute('aria-labelledby', RECOMMENDATIONS_TAB_ID);
        host.setAttribute(PANEL_MARKER, 'true');
        host.hidden = true;
        host.style.display = 'none';

        let currentTabList: HTMLElement | null = null;
        let recommendationTab: HTMLButtonElement | null = null;
        let syncFrame: number | null = null;
        const savedNativeTabs = new Map<HTMLButtonElement, NativeTabState>();
        const savedNativePanels = new Map<HTMLElement, NativePanelState>();

        const nativeTabs = (tabList: HTMLElement): HTMLButtonElement[] =>
            Array.from(
                tabList.querySelectorAll<HTMLButtonElement>(
                    ':scope > button[role="tab"]:not([data-hikka-forge-recommendations-tab])',
                ),
            );

        const nativePanels = (tabList: HTMLElement): HTMLElement[] => {
            let container = tabList.parentElement;
            while (container && container !== document.body) {
                const panels = Array.from(
                    container.querySelectorAll<HTMLElement>(
                    `:scope > [role="tabpanel"]:not([${PANEL_MARKER}])`,
                    ),
                );
                if (panels.length > 0) return panels;
                container = container.parentElement;
            }
            return [];
        };

        const saveTabState = (button: HTMLButtonElement): void => {
            if (savedNativeTabs.has(button)) return;
            savedNativeTabs.set(button, {
                className: button.className,
                ariaSelected: button.getAttribute('aria-selected'),
                tabIndex: button.getAttribute('tabindex'),
            });
        };

        const hideNativeContent = (tabList: HTMLElement): void => {
            for (const button of nativeTabs(tabList)) {
                saveTabState(button);
                setTabState(button, false);
            }

            for (const panel of nativePanels(tabList)) {
                if (!savedNativePanels.has(panel)) {
                    savedNativePanels.set(panel, {
                        display: panel.style.display,
                        hidden: panel.hidden,
                    });
                }
                panel.hidden = true;
                panel.style.display = 'none';
            }
        };

        const restoreNativeContent = (): void => {
            for (const [button, state] of savedNativeTabs) {
                if (!button.isConnected) continue;
                button.className = state.className;
                if (state.ariaSelected === null) {
                    button.removeAttribute('aria-selected');
                } else {
                    button.setAttribute('aria-selected', state.ariaSelected);
                }
                if (state.tabIndex === null) {
                    button.removeAttribute('tabindex');
                } else {
                    button.setAttribute('tabindex', state.tabIndex);
                }
            }
            savedNativeTabs.clear();

            for (const [panel, state] of savedNativePanels) {
                if (!panel.isConnected) continue;
                panel.hidden = state.hidden;
                panel.style.display = state.display;
            }
            savedNativePanels.clear();
        };

        const setActive = (active: boolean, tabList: HTMLElement | null): void => {
            const becameActive = active && !activeRef.current;
            activeRef.current = active;
            host.hidden = !active;
            host.style.display = active ? 'block' : 'none';
            if (!tabList) return;

            if (active) {
                hideNativeContent(tabList);
            } else {
                restoreNativeContent();
            }
            if (recommendationTab) setTabState(recommendationTab, active);
            if (becameActive) {
                requestAnimationFrame(() => {
                    if (activeRef.current && host.isConnected) {
                        host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            }
        };

        const ensureRecommendationTab = (tabList: HTMLElement): HTMLButtonElement => {
            let button = tabList.querySelector<HTMLButtonElement>(
                `[${TAB_MARKER}]`,
            );
            if (!button) {
                button = document.createElement('button');
                button.type = 'button';
                button.id = RECOMMENDATIONS_TAB_ID;
                button.setAttribute('role', 'tab');
                button.setAttribute('aria-controls', RECOMMENDATIONS_PANEL_ID);
                button.setAttribute(TAB_MARKER, 'true');
                button.append(createSparklesIcon(), document.createTextNode('Рекомендації'));
            }

            const profileTab = Array.from(
                tabList.querySelectorAll<HTMLButtonElement>(':scope > button[role="tab"]'),
            ).find((tab) => tab.id === 'widget-tab-profile');
            if (profileTab) {
                if (button.previousElementSibling !== profileTab) {
                    profileTab.after(button);
                }
            } else if (button.parentElement !== tabList || tabList.firstElementChild !== button) {
                tabList.prepend(button);
            }

            setTabState(button, activeRef.current);
            return button;
        };

        const sync = (): void => {
            const tabList = Array.from(document.querySelectorAll<HTMLElement>(TABLIST_SELECTOR)).find(
                (element) => {
                    const style = getComputedStyle(element);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                },
            ) ?? null;

            if (!tabList) {
                host.hidden = true;
                host.style.display = 'none';
                recommendationTab = null;
                return;
            }

            if (currentTabList !== tabList) {
                currentTabList?.removeEventListener('click', handleTabListClick, true);
                currentTabList = tabList;
                currentTabList.addEventListener('click', handleTabListClick, true);
            }

            recommendationTab = ensureRecommendationTab(tabList);

            if (activeRef.current) {
                setActive(true, tabList);
            } else {
                setActive(false, tabList);
            }
        };

        const scheduleSync = (): void => {
            if (syncFrame !== null) return;
            syncFrame = requestAnimationFrame(() => {
                syncFrame = null;
                sync();
            });
        };

        function handleTabListClick(event: Event): void {
            const target = event.target;
            if (!(target instanceof Element)) return;
            const button = target.closest<HTMLButtonElement>('button[role="tab"]');
            if (!button) return;

            if (button.hasAttribute(TAB_MARKER)) {
                event.preventDefault();
                event.stopPropagation();
                setActive(true, currentTabList);
                return;
            }

            setActive(false, currentTabList);
            scheduleSync();
        }

        const observer = new MutationObserver(scheduleSync);
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-selected', 'class', 'hidden', 'style'],
        });

        sync();

        return () => {
            observer.disconnect();
            if (syncFrame !== null) cancelAnimationFrame(syncFrame);
            currentTabList?.removeEventListener('click', handleTabListClick, true);
            recommendationTab?.remove();
            restoreNativeContent();
            host.hidden = false;
            host.style.display = 'block';
        };
    }, [ui]);

    return <UserRecommendationsView />;
};

export default MobileUserRecommendationsComponent;
