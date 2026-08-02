import { createContext, useContext } from "react";

export interface ContentUIContextValue {
	/** The module host in the page DOM. */
	host: HTMLElement;
	/** The page element the module host was mounted relative to. */
	targetElement: Element;
	/** The shadow root that contains the module UI. */
	shadowRoot: ShadowRoot;
	/** A node inside the shadow root that Radix portals can safely render into. */
	portalContainer: HTMLElement;
}

const ContentUIContext = createContext<ContentUIContextValue | null>(null);

export const ContentUIProvider = ContentUIContext.Provider;

export function useContentUI(): ContentUIContextValue | null {
	return useContext(ContentUIContext);
}

export function useContentUIContainer(): HTMLElement | undefined {
	return useContentUI()?.portalContainer;
}
