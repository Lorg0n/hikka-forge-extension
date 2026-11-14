export interface NativeTabState {
    className: string;
    ariaSelected: string | null;
    tabIndex: string | null;
    dataActive: string | null;
}

/** Applies the attributes used by Hikka's native tab styling. */
export function setNativeTabActive(tab: HTMLElement, active: boolean): void {
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active) tab.setAttribute('data-active', '');
    else tab.removeAttribute('data-active');
}

export function captureNativeTabState(tab: HTMLElement): NativeTabState {
    return {
        className: tab.className,
        ariaSelected: tab.getAttribute('aria-selected'),
        tabIndex: tab.getAttribute('tabindex'),
        dataActive: tab.getAttribute('data-active'),
    };
}

export function restoreNativeTabState(tab: HTMLElement, state: NativeTabState): void {
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

/** Keeps surrounding page content from jumping while a native panel is replaced. */
export function lockElementHeight(element: HTMLElement, duration = 300): () => void {
    const originalMinHeight = element.style.minHeight;
    const height = Math.ceil(element.getBoundingClientRect().height);
    if (height > 0) element.style.minHeight = `${height}px`;

    const timer = setTimeout(() => {
        element.style.minHeight = originalMinHeight;
    }, duration);
    return () => {
        clearTimeout(timer);
        element.style.minHeight = originalMinHeight;
    };
}
