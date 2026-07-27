import { logger } from "@/utils/logger";
import browser from "@/utils/browser";
import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createRoot, Root } from "react-dom/client";
import type {
	ForgeModuleDef,
	ModuleComponentProps,
	ModuleInfo,
	ContentMessage,
	InsertPosition,
	ModuleSettings,
} from "@/types/module";
import { ModuleAuthProvider } from "@/contexts/ModuleAuthContext";
import {
	ContentUIProvider,
	type ContentUIContextValue,
} from "@/contexts/ContentUIContext";
// @ts-ignore - Vite transforms ?inline imports into the compiled stylesheet string.
import extensionStyles from "@/index.css?inline";

const moduleImports = import.meta.glob<{ default: ForgeModuleDef }>(
	"/src/modules/*/module.ts",
	{ eager: true }
);

const ANIMATION_DURATION_MS = 280;
const DEBUG_PREFIX = "[Hikka Forge][debug]";
const INITIAL_HYDRATION_MIN_DELAY_MS = 750;
const INITIAL_HYDRATION_QUIET_MS = 400;
const INITIAL_HYDRATION_MAX_DELAY_MS = 3000;
const SEMANTIC_THEME_VARS = [
	"--radius",
	"--background",
	"--foreground",
	"--card",
	"--card-foreground",
	"--popover",
	"--popover-foreground",
	"--primary",
	"--primary-foreground",
	"--primary-border",
	"--secondary",
	"--secondary-foreground",
	"--muted",
	"--muted-foreground",
	"--accent",
	"--accent-foreground",
	"--destructive",
	"--border",
	"--input",
	"--ring",
	"--shadow-card",
	"--surface",
	"--surface-inset",
	"--surface-inset-border",
	"--surface-glass",
	"--surface-glass-border",
	"--tooltip",
	"--tooltip-foreground",
	"--success",
	"--success-foreground",
	"--success-border",
	"--warning",
	"--warning-foreground",
	"--warning-border",
	"--info",
	"--info-foreground",
	"--info-border",
	"--destructive-border",
];

function describeNode(node: Node): string {
	if (node instanceof Element) {
		const id = node.id ? `#${node.id}` : "";
		const className =
			typeof node.className === "string" && node.className
				? `.${node.className.trim().split(/\s+/).slice(0, 2).join(".")}`
				: "";
		return `${node.tagName.toLowerCase()}${id}${className}`;
	}
	return node.nodeName;
}

interface ModuleRuntimeProps {
	component: React.FC<ModuleComponentProps>;
	settings: ModuleSettings;
	ui: ContentUIContextValue;
	exiting: boolean;
}

export function ModuleRuntime({
	component: Component,
	settings,
	ui,
	exiting,
}: ModuleRuntimeProps) {
	const reducedMotion = useReducedMotion();
	const transition = reducedMotion
		? { duration: 0 }
		: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

	return (
		<ContentUIProvider value={ui}>
			<ModuleAuthProvider>
				<AnimatePresence initial={false} mode="wait">
					{!exiting && (
						<motion.div
							key="module"
							initial={false}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
							transition={transition}
							className="hikka-forge-module-wrapper"
						>
							<Component settings={settings} />
						</motion.div>
					)}
				</AnimatePresence>
			</ModuleAuthProvider>
		</ContentUIProvider>
	);
}

interface ModuleInstance {
	id: string;
	host: HTMLElement;
	shadowRoot: ShadowRoot;
	appRoot: HTMLElement;
	root: Root;
	ui: ContentUIContextValue;
	stopThemeSync: () => void;
	token: number;
	exiting: boolean;
}

interface PendingUnmount {
	instance: ModuleInstance;
	timeout: ReturnType<typeof setTimeout>;
	reload: boolean;
}

function cssVariableNamesFromUserStyles(): Set<string> {
	const names = new Set(SEMANTIC_THEME_VARS);
	const userStyles = document.getElementById("user-styles");
	const source = userStyles?.textContent ?? "";
	for (const match of source.matchAll(/--[a-zA-Z0-9_-]+/g)) {
		names.add(match[0]);
	}
	return names;
}

function isHikkaDarkMode(): boolean {
	const root = document.documentElement;
	const body = document.body;
	const theme = (root.dataset.theme ?? root.getAttribute("data-color-mode") ?? "")
		.toLowerCase();
	if (theme.includes("light")) return false;
	if (theme.includes("dark")) return true;
	if (root.classList.contains("light") || root.classList.contains("light-mode")) {
		return false;
	}
	if (
		root.classList.contains("dark") ||
		root.classList.contains("dark-mode") ||
		body?.classList.contains("dark") ||
		body?.classList.contains("dark-mode")
	) {
		return true;
	}
	const colorScheme = getComputedStyle(root).colorScheme.toLowerCase();
	return colorScheme.includes("dark");
}

function synchronizeTheme(
	host: HTMLElement,
	appRoot: HTMLElement,
	portalContainer: HTMLElement
): () => void {
	let copiedVariables = new Set<string>();
	const themeTargets = [host, appRoot, portalContainer];

	const applyTheme = () => {
		const root = document.documentElement;
		const computed = getComputedStyle(root);
		const bodyComputed = document.body ? getComputedStyle(document.body) : null;
		const nextVariables = cssVariableNamesFromUserStyles();

		for (const name of copiedVariables) {
			if (!nextVariables.has(name)) {
				for (const target of themeTargets) target.style.removeProperty(name);
			}
		}
		for (const name of nextVariables) {
			const value =
				computed.getPropertyValue(name).trim() ||
				bodyComputed?.getPropertyValue(name).trim() ||
				"";
			if (value) {
				// Shadow DOM prevents Hikka's custom properties from being selected
				// directly. Apply its computed tokens to the render roots as inline
				// values so the extension's fallback `.dark` theme cannot override
				// the active site palette.
				for (const target of themeTargets) target.style.setProperty(name, value);
			}
		}
		copiedVariables = nextVariables;

		const dark = isHikkaDarkMode();
		host.classList.toggle("dark", dark);
		appRoot.classList.toggle("dark", dark);
		portalContainer.classList.toggle("dark", dark);
		appRoot.setAttribute("data-theme", dark ? "dark" : "light");
	};

	applyTheme();
	const themeObserver = new MutationObserver(applyTheme);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class", "style", "data-theme", "data-color-mode"],
	});

	const userStyles = document.getElementById("user-styles");
	if (userStyles) {
		themeObserver.observe(userStyles, {
			childList: true,
			characterData: true,
			attributes: true,
		});
	}
	let userStylesLocator: MutationObserver | undefined;
	if (!userStyles) {
		userStylesLocator = new MutationObserver(() => {
			const newlyAddedUserStyles = document.getElementById("user-styles");
			if (!newlyAddedUserStyles) return;
			themeObserver.observe(newlyAddedUserStyles, {
				childList: true,
				characterData: true,
				attributes: true,
			});
			userStylesLocator?.disconnect();
			applyTheme();
		});
		userStylesLocator.observe(document.documentElement, {
			childList: true,
			subtree: true,
		});
	}

	return () => {
		themeObserver.disconnect();
		userStylesLocator?.disconnect();
		for (const name of copiedVariables) {
			for (const target of themeTargets) target.style.removeProperty(name);
		}
		host.classList.remove("dark");
	};
}

class ModuleManager {
	private moduleDefinitions = new Map<string, ForgeModuleDef>();
	private moduleEnabledStates = new Map<string, boolean>();
	private moduleSettings: Record<string, ModuleSettings> = {};
	private activeModuleRoots = new Map<string, ModuleInstance>();
	private pendingUnmounts = new Map<string, PendingUnmount>();
	private moduleTokens = new Map<string, number>();
	private currentUrl = window.location.href;
	private reconciliationObserver: MutationObserver | null = null;
	private reconciliationFrame: number | null = null;
	private pendingReloadIds = new Set<string>();
	private activeStyleTags = new Map<string, HTMLStyleElement>();
	private mutationBatch = 0;
	private initialReconciliationReady = false;
	private initialReconciliationTimer: ReturnType<typeof setTimeout> | null = null;
	private initialRenderStartedAt = 0;
	private lastInitialMutationAt = 0;

	constructor() {
		this.loadModuleDefinitions();
		this.initUrlChangeListener();
		this.initMutationReconciliation();
		this.initMessageListener();
		this.registerWithBackground();
		this.waitForInitialPageRender();
		logger.log("[Hikka Forge] Module Manager initialized");
	}

	private waitForInitialPageRender(): void {
		logger.log(`${DEBUG_PREFIX} waiting for Hikka hydration before mounting modules`);

		const beginSettling = () => {
			if (this.initialReconciliationReady || this.initialReconciliationTimer) return;

			this.initialRenderStartedAt = performance.now();
			this.lastInitialMutationAt = this.initialRenderStartedAt;

			const finishWhenStable = () => {
				const now = performance.now();
				const elapsed = now - this.initialRenderStartedAt;
				const quietFor = now - this.lastInitialMutationAt;
				const isQuiet = quietFor >= INITIAL_HYDRATION_QUIET_MS;
				const reachedMaximumDelay = elapsed >= INITIAL_HYDRATION_MAX_DELAY_MS;

				if (elapsed < INITIAL_HYDRATION_MIN_DELAY_MS || (!isQuiet && !reachedMaximumDelay)) {
					const untilMinimumDelay = Math.max(0, INITIAL_HYDRATION_MIN_DELAY_MS - elapsed);
					const untilQuiet = Math.max(0, INITIAL_HYDRATION_QUIET_MS - quietFor);
					this.initialReconciliationTimer = setTimeout(
						finishWhenStable,
						Math.max(16, untilMinimumDelay, untilQuiet),
					);
					return;
				}

				this.initialReconciliationTimer = null;
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						this.initialReconciliationReady = true;
						logger.log(`${DEBUG_PREFIX} initial hydration wait complete`);
						this.scheduleReconciliation();
					});
				});
			};

			this.initialReconciliationTimer = setTimeout(
				finishWhenStable,
				INITIAL_HYDRATION_MIN_DELAY_MS,
			);
		};

		if (document.readyState === "complete") {
			beginSettling();
		} else {
			window.addEventListener("load", beginSettling, { once: true });
		}
	}

	private loadModuleDefinitions(): void {
		for (const path in moduleImports) {
			const moduleDef = moduleImports[path].default;
			if (!moduleDef?.id) {
				// Deprecated module files are intentionally comment-only.
				continue;
			}
			this.moduleDefinitions.set(moduleDef.id, moduleDef);
			this.moduleEnabledStates.set(moduleDef.id, false);
			this.moduleSettings[moduleDef.id] = {};
			for (const setting of moduleDef.settings ?? []) {
				this.moduleSettings[moduleDef.id][setting.id] = setting.defaultValue;
			}
		}
	}

	private registerWithBackground(): void {
		browser.runtime
			.sendMessage({
				type: "REGISTER_CONTENT_SCRIPT",
				modules: this.getModulesInfo(),
			})
			.catch((error) =>
				logger.error("[Hikka Forge] Failed to register with background script:", error)
			);
	}

	private syncModuleStates(
		enabledStates: Record<string, boolean>,
		moduleSettings: Record<string, ModuleSettings>
	): void {
		const reloadIds = new Set<string>();
		for (const moduleDef of this.moduleDefinitions.values()) {
			const nextState = enabledStates[moduleDef.id];
			if (
				nextState !== undefined &&
				this.moduleEnabledStates.get(moduleDef.id) !== nextState
			) {
				this.moduleEnabledStates.set(moduleDef.id, nextState);
			}

			const incomingSettings = moduleSettings[moduleDef.id];
			if (!incomingSettings) continue;
			const currentSettings = this.moduleSettings[moduleDef.id] ?? {};
			let changed = false;
			for (const settingId in incomingSettings) {
				if (currentSettings[settingId] !== incomingSettings[settingId]) {
					currentSettings[settingId] = incomingSettings[settingId];
					changed = true;
				}
			}
			if (changed) {
				this.moduleSettings[moduleDef.id] = currentSettings;
				if (moduleDef.component || moduleDef.styles) reloadIds.add(moduleDef.id);
			}
		}

		logger.log(`${DEBUG_PREFIX} module states synchronized`, enabledStates);
		this.scheduleReconciliation(reloadIds);
	}

	private evaluateModulesForCurrentUrl(reloadIds = new Set<string>()): void {
		this.manageModuleStyles(reloadIds);
		for (const moduleDef of this.moduleDefinitions.values()) {
			if (!moduleDef.component || !moduleDef.elementSelector) continue;

			const shouldBeMounted =
				this.isModuleEnabled(moduleDef) &&
				this.matchesUrlPatterns(this.currentUrl, moduleDef.urlPatterns);
			let active = this.activeModuleRoots.get(moduleDef.id);
			let pending = this.pendingUnmounts.get(moduleDef.id);
			if (active && !active.host.isConnected) {
				const disconnectedTarget = shouldBeMounted ? this.findTarget(moduleDef) : undefined;
				logger.log(`${DEBUG_PREFIX} active module host disconnected`, {
					moduleId: moduleDef.id,
					shouldBeMounted,
					hostId: active.host.id,
					target: disconnectedTarget ? describeNode(disconnectedTarget) : null,
				});

				if (shouldBeMounted && !pending && disconnectedTarget) {
					this.insertElement(
						active.host,
						disconnectedTarget,
						moduleDef.elementSelector!.position
					);
					logger.log(`${DEBUG_PREFIX} module host reattached`, {
						moduleId: moduleDef.id,
						hostId: active.host.id,
						hostConnected: active.host.isConnected,
						target: describeNode(disconnectedTarget),
					});
				} else {
					this.cleanupInstance(active, moduleDef, true);
					active = undefined;
					pending = this.pendingUnmounts.get(moduleDef.id);
				}
			}

			if (!shouldBeMounted) {
				if (active && !pending) this.beginUnmount(moduleDef.id, false);
				continue;
			}

			if (pending) {
				if (!pending.reload) this.cancelUnmount(moduleDef.id);
				continue;
			}
			if (active) {
				if (reloadIds.has(moduleDef.id)) this.beginUnmount(moduleDef.id, true);
				continue;
			}
			this.mountModule(moduleDef);
		}
	}

	private isModuleEnabled(moduleDef: ForgeModuleDef): boolean {
		// Dependent modules are implementation details of their parent. Their
		// hidden storage state must not prevent them from following the parent.
		if (moduleDef.dependsOn) return this.areModuleDependenciesEnabled(moduleDef);
		return (
			this.moduleEnabledStates.get(moduleDef.id) ??
			(moduleDef.enabledByDefault ?? false)
		);
	}

	private areModuleDependenciesEnabled(moduleDef: ForgeModuleDef): boolean {
		const dependency = moduleDef.dependsOn;
		if (!dependency) return true;
		if (dependency === moduleDef.id) {
			logger.error(`${DEBUG_PREFIX} module cannot depend on itself`, {
				moduleId: moduleDef.id,
			});
			return false;
		}

		const dependencyDefinition = this.moduleDefinitions.get(dependency);
		if (!dependencyDefinition) {
			logger.error(`${DEBUG_PREFIX} module dependency is missing`, {
				moduleId: moduleDef.id,
				dependsOn: dependency,
			});
			return false;
		}

		return (
			this.moduleEnabledStates.get(dependency) ??
			(dependencyDefinition.enabledByDefault ?? false)
		);
	}

	private matchesUrlPatterns(url: string, patterns: string[]): boolean {
		return patterns.some((pattern) => {
			const regexPattern = pattern
				.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
				.replace(/\*/g, ".*");
			try {
				return new RegExp(`^${regexPattern}$`).test(url);
			} catch (error) {
				logger.error(`[Hikka Forge] Invalid URL pattern: ${pattern}`, error);
				return false;
			}
		});
	}

	private findTarget(moduleDef: ForgeModuleDef): Element | undefined {
		const config = moduleDef.elementSelector;
		if (!config) return undefined;
		let elements = Array.from(document.querySelectorAll(config.selector));
		if (config.visibleOnly !== false) elements = this.filterVisibleElements(elements);
		return elements[config.index ?? 0] ?? elements[elements.length - 1];
	}

	private mountModule(moduleDef: ForgeModuleDef): void {
		const targetElement = this.findTarget(moduleDef);
		if (!targetElement || !moduleDef.component || !moduleDef.elementSelector) {
			logger.log(`${DEBUG_PREFIX} mount skipped`, {
				moduleId: moduleDef.id,
				hasTarget: Boolean(targetElement),
				hasComponent: Boolean(moduleDef.component),
			});
			return;
		}

		logger.log(`${DEBUG_PREFIX} module mount start`, {
			moduleId: moduleDef.id,
			target: describeNode(targetElement),
			position: moduleDef.elementSelector.position,
		});

		const existingHost = document.getElementById(`hikka-forge-module-${moduleDef.id}`);
		if (existingHost && !this.activeModuleRoots.has(moduleDef.id)) existingHost.remove();

		const token = (this.moduleTokens.get(moduleDef.id) ?? 0) + 1;
		this.moduleTokens.set(moduleDef.id, token);
		const host = document.createElement("div");
		host.id = `hikka-forge-module-${moduleDef.id}`;
		host.dataset.moduleId = moduleDef.id;
		host.dataset.hikkaForge = "content-module";
		host.style.display = "block";
		host.style.width = moduleDef.elementSelector.hostWidth ?? "100%";

		const shadowRoot = host.attachShadow({ mode: "open" });
		const styleElement = document.createElement("style");
		styleElement.textContent = extensionStyles;
		shadowRoot.appendChild(styleElement);

		const appRoot = document.createElement("div");
		appRoot.className = "hikka-forge-shadow-root";
		const portalContainer = document.createElement("div");
		portalContainer.className = "hikka-forge-portal-root";
		shadowRoot.append(appRoot, portalContainer);

		const ui: ContentUIContextValue = { host, shadowRoot, portalContainer };
		const root = createRoot(appRoot);
		const instance: ModuleInstance = {
			id: moduleDef.id,
			host,
			shadowRoot,
			appRoot,
			root,
			ui,
			stopThemeSync: () => undefined,
			token,
			exiting: false,
		};
		instance.stopThemeSync = synchronizeTheme(host, appRoot, portalContainer);
		this.activeModuleRoots.set(moduleDef.id, instance);

		try {
			root.render(
				<ModuleRuntime
					component={moduleDef.component}
					settings={this.moduleSettings[moduleDef.id] ?? {}}
					ui={ui}
					exiting={false}
				/>
			);
			this.insertElement(host, targetElement, moduleDef.elementSelector.position);
			logger.log(`${DEBUG_PREFIX} module mounted`, {
				moduleId: moduleDef.id,
				hostId: host.id,
				hostConnected: host.isConnected,
			});
		} catch (error) {
			logger.error(`[Hikka Forge] Error injecting ${moduleDef.name}:`, error);
			this.cleanupInstance(instance, moduleDef, false);
		}
	}

	private insertElement(
		elementToInsert: HTMLElement,
		targetElement: Element,
		position: InsertPosition
	): void {
		switch (position) {
			case "before":
				targetElement.parentNode?.insertBefore(elementToInsert, targetElement);
				break;
			case "after":
				targetElement.parentNode?.insertBefore(elementToInsert, targetElement.nextSibling);
				break;
			case "prepend":
				targetElement.insertBefore(elementToInsert, targetElement.firstChild);
				break;
			case "append":
				targetElement.appendChild(elementToInsert);
				break;
			case "replace":
				targetElement.parentNode?.insertBefore(elementToInsert, targetElement);
				(targetElement as HTMLElement).style.display = "none";
				targetElement.setAttribute("data-hikka-forge-replaced", "true");
				targetElement.setAttribute(
					"data-hikka-forge-module-id",
					elementToInsert.dataset.moduleId ?? ""
				);
				break;
		}
	}

	private restoreReplacedElement(moduleId: string): void {
		document
			.querySelectorAll(
				`[data-hikka-forge-replaced="true"][data-hikka-forge-module-id="${moduleId}"]`
			)
			.forEach((element) => {
				(element as HTMLElement).style.display = "";
				element.removeAttribute("data-hikka-forge-replaced");
				element.removeAttribute("data-hikka-forge-module-id");
			});
	}

	private beginUnmount(moduleId: string, reload: boolean): void {
		const instance = this.activeModuleRoots.get(moduleId);
		const moduleDef = this.moduleDefinitions.get(moduleId);
		if (!instance || !moduleDef) return;

		logger.log(`${DEBUG_PREFIX} module unmount start`, {
			moduleId,
			reload,
			hostConnected: instance.host.isConnected,
			pending: this.pendingUnmounts.has(moduleId),
		});
		const existingPending = this.pendingUnmounts.get(moduleId);
		if (existingPending) {
			existingPending.reload ||= reload;
			return;
		}

		if (!instance.host.isConnected) {
			this.cleanupInstance(instance, moduleDef, true);
			return;
		}

		instance.exiting = true;
		instance.root.render(
			<ModuleRuntime
				component={moduleDef.component!}
				settings={this.moduleSettings[moduleId] ?? {}}
				ui={instance.ui}
				exiting
			/>
		);
		const timeout = setTimeout(() => {
			const pending = this.pendingUnmounts.get(moduleId);
			if (!pending || pending.instance !== instance) return;
			this.pendingUnmounts.delete(moduleId);
			this.cleanupInstance(instance, moduleDef, true);
			this.scheduleReconciliation();
		}, ANIMATION_DURATION_MS);
		this.pendingUnmounts.set(moduleId, { instance, timeout, reload });
	}

	private cancelUnmount(moduleId: string): void {
		const pending = this.pendingUnmounts.get(moduleId);
		if (!pending) return;
		clearTimeout(pending.timeout);
		this.pendingUnmounts.delete(moduleId);
		pending.instance.exiting = false;
		const moduleDef = this.moduleDefinitions.get(moduleId);
		if (moduleDef?.component) {
			pending.instance.root.render(
				<ModuleRuntime
					component={moduleDef.component}
					settings={this.moduleSettings[moduleId] ?? {}}
					ui={pending.instance.ui}
					exiting={false}
				/>
			);
		}
	}

	private cleanupInstance(
		instance: ModuleInstance,
		moduleDef: ForgeModuleDef,
		restoreOriginal: boolean
	): void {
		logger.log(`${DEBUG_PREFIX} module cleanup`, {
			moduleId: instance.id,
			restoreOriginal,
			hostConnected: instance.host.isConnected,
		});
		if (this.activeModuleRoots.get(instance.id) === instance) {
			this.activeModuleRoots.delete(instance.id);
		}
		if (this.pendingUnmounts.get(instance.id)?.instance === instance) {
			const pending = this.pendingUnmounts.get(instance.id);
			if (pending) clearTimeout(pending.timeout);
			this.pendingUnmounts.delete(instance.id);
		}
		try {
			instance.root.unmount();
		} catch (error) {
			logger.error(`[Hikka Forge] Error unmounting ${moduleDef.name}:`, error);
		}
		instance.stopThemeSync();
		instance.host.remove();
		if (restoreOriginal && moduleDef.elementSelector?.position === "replace") {
			this.restoreReplacedElement(moduleDef.id);
		}
	}

	private initMutationReconciliation(): void {
		this.reconciliationObserver = new MutationObserver((records) => {
			if (!this.initialReconciliationReady) {
				this.lastInitialMutationAt = performance.now();
			}
			const batch = ++this.mutationBatch;
			logger.log(`${DEBUG_PREFIX} page mutation batch`, {
				batch,
				recordCount: records.length,
				records: records.slice(0, 8).map((record) => ({
					type: record.type,
					target: describeNode(record.target),
					attributeName: record.attributeName,
					added: record.addedNodes.length,
					removed: record.removedNodes.length,
				})),
			});
			this.scheduleReconciliation();
		});
		this.reconciliationObserver.observe(document.documentElement, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["class", "style", "hidden", "data-theme", "data-color-mode"],
		});
	}

	private scheduleReconciliation(reloadIds = new Set<string>()): void {
		logger.log(`${DEBUG_PREFIX} reconciliation scheduled`, {
			reloadIds: Array.from(reloadIds),
			frameAlreadyPending: this.reconciliationFrame !== null,
			initialReconciliationReady: this.initialReconciliationReady,
			activeModules: Array.from(this.activeModuleRoots.keys()),
		});
		for (const moduleId of reloadIds) {
			this.pendingReloadIds.add(moduleId);
		}
		if (!this.initialReconciliationReady) return;
		if (this.reconciliationFrame !== null) return;
		this.reconciliationFrame = requestAnimationFrame(() => {
			this.reconciliationFrame = null;
			const reloadIds = new Set(this.pendingReloadIds);
			this.pendingReloadIds.clear();
			this.evaluateModulesForCurrentUrl(reloadIds);
		});
	}

	private initUrlChangeListener(): void {
		let lastObservedUrl = window.location.href;
		const handleLocationChange = () => {
			const nextUrl = window.location.href;
			lastObservedUrl = nextUrl;
			if (nextUrl === this.currentUrl) return;
			this.currentUrl = nextUrl;
			const reloadIds = new Set<string>();
			for (const [id, instance] of this.activeModuleRoots) {
				if (!instance.exiting) reloadIds.add(id);
			}
			for (const moduleDef of this.moduleDefinitions.values()) {
				if (typeof moduleDef.styles === "function") reloadIds.add(moduleDef.id);
			}
			this.scheduleReconciliation(reloadIds);
		};

		window.addEventListener("popstate", handleLocationChange);
		window.addEventListener("hashchange", handleLocationChange);
		for (const method of ["pushState", "replaceState"] as const) {
			const original = history[method];
			history[method] = function (...args) {
				const result = original.apply(this, args);
				window.dispatchEvent(new Event("historystatechanged"));
				return result;
			};
		}
		window.addEventListener("historystatechanged", handleLocationChange);

		// Page scripts run in a separate world in Firefox, so patching history
		// above cannot observe every SPA navigation. This only checks the URL;
		// mounting remains entirely mutation-driven and has no activation delay.
		setInterval(() => {
			if (document.hidden) return;
			const nextUrl = window.location.href;
			if (nextUrl !== lastObservedUrl) handleLocationChange();
		}, 250);
	}

	private initMessageListener(): void {
		browser.runtime.onMessage.addListener(
			(message, _sender, sendResponse) => {
				const contentMessage = message as ContentMessage;
				try {
					switch (contentMessage.type) {
						case "SYNC_MODULES":
							this.syncModuleStates(contentMessage.enabledStates, contentMessage.moduleSettings);
							sendResponse({ success: true });
							break;
						case "GET_CONTENT_MODULES_INFO":
							sendResponse({ success: true, modules: this.getModulesInfo() });
							break;
						case "MODULE_ACTION":
							if (contentMessage.action === "REFRESH") {
								this.refreshAllActiveModules();
								sendResponse({ success: true });
							} else {
								sendResponse({ success: false, error: "Unknown content action" });
							}
							break;
						default:
							return true;
					}
				} catch (error) {
					logger.error("[Hikka Forge] Error processing content message:", error);
					sendResponse({ success: false, error: String(error) });
				}
				return true;
			}
		);
	}

	getModulesInfo(): ModuleInfo[] {
		return Array.from(this.moduleDefinitions.values()).map((moduleDef) => ({
			id: moduleDef.id,
			name: moduleDef.name,
			description: moduleDef.description,
			enabled: this.moduleEnabledStates.get(moduleDef.id) ?? false,
			urlPatterns: moduleDef.urlPatterns,
			enabledByDefault: moduleDef.enabledByDefault,
			settings: moduleDef.settings,
			hidden: moduleDef.hidden ?? false,
			authRequired: moduleDef.authRequired ?? false,
			category: moduleDef.category,
			icon: moduleDef.icon,
		}));
	}

	refreshAllActiveModules(): void {
		logger.log(`${DEBUG_PREFIX} refresh all active modules`, {
			moduleIds: Array.from(this.activeModuleRoots.keys()),
		});
		for (const id of this.activeModuleRoots.keys()) this.beginUnmount(id, true);
	}

	private filterVisibleElements(elements: Element[]): Element[] {
		return elements.filter((element) => {
			if (!(element instanceof HTMLElement)) return false;
			if (element.hidden || element.style.display === "none") return false;
			const style = getComputedStyle(element);
			return style.display !== "none" && style.visibility !== "hidden" && element.offsetParent !== null;
		});
	}

	private injectStyles(moduleDef: ForgeModuleDef): void {
		if (!moduleDef.styles) return;
		this.removeStyles(moduleDef.id);
		const styleElement = document.createElement("style");
		styleElement.id = `hikka-forge-style-${moduleDef.id}`;
		styleElement.textContent =
			typeof moduleDef.styles === "function"
				? moduleDef.styles(this.moduleSettings[moduleDef.id] ?? {})
				: moduleDef.styles;
		document.head.appendChild(styleElement);
		this.activeStyleTags.set(moduleDef.id, styleElement);
	}

	private removeStyles(moduleId: string): void {
		this.activeStyleTags.get(moduleId)?.remove();
		this.activeStyleTags.delete(moduleId);
	}

	private manageModuleStyles(refreshIds = new Set<string>()): void {
		for (const moduleDef of this.moduleDefinitions.values()) {
			if (!moduleDef.styles) continue;
			const enabled = this.moduleEnabledStates.get(moduleDef.id) ?? false;
			const matches = this.matchesUrlPatterns(this.currentUrl, moduleDef.urlPatterns);
			if (enabled && matches) {
				if (
					!this.activeStyleTags.has(moduleDef.id) ||
					(typeof moduleDef.styles === "function" && refreshIds.has(moduleDef.id))
				) {
					this.injectStyles(moduleDef);
				}
			} else if (this.activeStyleTags.has(moduleDef.id)) {
				this.removeStyles(moduleDef.id);
			}
		}
	}
}

const moduleManager = new ModuleManager();
declare global {
	interface Window {
		HikkaForge?: { moduleManager: ModuleManager };
	}
}
window.HikkaForge = { moduleManager };
logger.log("[Hikka Forge] Content script loaded and HikkaForge exposed.");
