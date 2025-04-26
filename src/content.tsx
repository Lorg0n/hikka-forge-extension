type InsertPosition = 'before' | 'after' | 'prepend' | 'append' | 'replace';

interface ModuleSelector {
    selector: string;
    position: InsertPosition;
    index?: number;
}

interface Module {
    id: string;
    name: string;
    description: string;
    urlPatterns: string[];
    enabled: boolean;
    selector: ModuleSelector;
    content: string | (() => string) | (() => HTMLElement);
    styles?: string;
    onLoad?: () => void;
    onUnload?: () => void;
}

class ModuleManager {
    private modules: Map<string, Module> = new Map();
    private activeModules: Set<string> = new Set();
    private currentUrl: string = window.location.href;
    private observers: Map<string, MutationObserver> = new Map();
    private styleElements: Map<string, HTMLStyleElement> = new Map();
    private contentElements: Map<string, HTMLElement> = new Map();

    constructor() {
        this.initUrlChangeListener();
        this.startUrlPolling();
        console.log('[Hikka Forge] Module system initialized');
    }

    private startUrlPolling(): void {
        let lastCheckedUrl = window.location.href;
        let pollInterval: number | null = null;

        const handleVisibilityChange = () => {
            if (document.hidden && pollInterval !== null) {
                clearInterval(pollInterval);
                pollInterval = null;
            } else if (!document.hidden && pollInterval === null) {
                lastCheckedUrl = window.location.href;
                pollInterval = setInterval(checkUrl, 1500) as unknown as number;
            }
        };

        const checkUrl = () => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastCheckedUrl) {
                console.log(`[Hikka Forge] URL change detected (polling): ${lastCheckedUrl} -> ${currentUrl}`);
                this.handleUrlChange(currentUrl);
                lastCheckedUrl = currentUrl;
            }
        };

        pollInterval = setInterval(checkUrl, 1500) as unknown as number;
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    registerModule(module: Module): void {
        this.modules.set(module.id, module);
        console.log(`[Hikka Forge] Module ${module.name} registered`);
        if (module.enabled && this.matchesUrlPatterns(this.currentUrl, module.urlPatterns)) {
            setTimeout(() => this.loadModule(module), 500);
        }
    }

    unregisterModule(moduleId: string): void {
        const module = this.modules.get(moduleId);
        if (module) {
            this.unloadModule(module);
            this.modules.delete(moduleId);
            console.log(`[Hikka Forge] Module ${module.name} unregistered`);
        }
    }

    private matchesUrlPatterns(url: string, patterns: string[]): boolean {
        return patterns.some(pattern => {
            const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(url);
        });
    }

    private loadModule(module: Module): void {
        if (this.activeModules.has(module.id)) {
            console.log(`[Hikka Forge] Module ${module.name} is already active. Skipping load.`);
            return;
        }
        this.activeModules.add(module.id);
        console.log(`[Hikka Forge] Loading module ${module.name}...`);

        if (module.styles) {
            this.injectStyles(module);
        }

        const elements = document.querySelectorAll(module.selector.selector);
        if (elements.length === 0) {
            console.log(`[Hikka Forge] Selector "${module.selector.selector}" not found for module ${module.name}, waiting...`);
            this.activeModules.delete(module.id);
            this.waitForSelector(module);
            return;
        }

        this.injectContent(module, elements);

        if (module.onLoad) {
            try {
                module.onLoad();
            } catch (error) {
                console.error(`[Hikka Forge] Error in onLoad of module ${module.name}:`, error);
            }
        }
        console.log(`[Hikka Forge] Module ${module.name} loaded successfully.`);
    }

    private injectStyles(module: Module): void {
        this.styleElements.get(module.id)?.remove();
        const styleElement = document.createElement('style');
        styleElement.id = `hikka-forge-style-${module.id}`;
        styleElement.textContent = module.styles || '';
        document.head.appendChild(styleElement);
        this.styleElements.set(module.id, styleElement);
    }

    private injectContent(module: Module, elements: NodeListOf<Element>): void {
        try {
            const index = module.selector.index ?? 0;
            let targetElement = elements[index] ?? elements[elements.length - 1];

            if (!targetElement) {
                console.error(`[Hikka Forge] No target element found for selector "${module.selector.selector}" (index: ${index}) for module ${module.name}.`);
                this.retryInjection(module);
                return;
            }

            const container = document.createElement('div');
            container.id = `hikka-forge-content-${module.id}`;
            container.className = 'hikka-forge-module';
            container.dataset.moduleId = module.id;

            let contentToAdd: Node | string;
            if (typeof module.content === 'function') {
                contentToAdd = module.content();
            } else {
                contentToAdd = module.content;
            }

            if (contentToAdd instanceof HTMLElement) {
                container.appendChild(contentToAdd);
            } else {
                container.innerHTML = contentToAdd && "";
            }

            this.contentElements.set(module.id, container);

            switch (module.selector.position) {
                case 'before':
                    targetElement.parentNode?.insertBefore(container, targetElement);
                    break;
                case 'after':
                    targetElement.parentNode?.insertBefore(container, targetElement.nextSibling);
                    break;
                case 'prepend':
                    targetElement.insertBefore(container, targetElement.firstChild);
                    break;
                case 'append':
                    targetElement.appendChild(container);
                    break;
                case 'replace':
                    const originalClone = targetElement.cloneNode(true) as HTMLElement;
                    this.contentElements.set(`${module.id}-original`, originalClone);
                    targetElement.parentNode?.replaceChild(container, targetElement);
                    break;
                default:
                    console.error(`[Hikka Forge] Invalid insert position "${module.selector.position}" for module ${module.name}`);
            }
        } catch (error) {
            console.error(`[Hikka Forge] Error injecting content for module ${module.name}:`, error);
            this.contentElements.delete(module.id);
            this.retryInjection(module);
        }
    }

    private retryInjection(module: Module, attempt: number = 1): void {
        if (attempt > 3) {
            console.warn(`[Hikka Forge] Failed to inject module ${module.name} after 3 attempts.`);
            this.activeModules.delete(module.id);
            return;
        }

        console.log(`[Hikka Forge] Retrying injection for ${module.name} (attempt ${attempt})...`);
        setTimeout(() => {
            const elements = document.querySelectorAll(module.selector.selector);
            if (elements.length > 0) {
                this.injectContent(module, elements);
            } else {
                this.retryInjection(module, attempt + 1);
            }
        }, 500 * attempt);
    }

    private unloadModule(module: Module): void {
        if (!this.activeModules.has(module.id)) return;

        console.log(`[Hikka Forge] Unloading module ${module.name}...`);

        this.observers.get(module.id)?.disconnect();
        this.observers.delete(module.id);

        this.styleElements.get(module.id)?.remove();
        this.styleElements.delete(module.id);

        const contentElement = this.contentElements.get(module.id);
        if (contentElement) {
            if (module.selector.position === 'replace') {
                const originalElement = this.contentElements.get(`${module.id}-original`);
                if (originalElement && contentElement.parentNode) {
                    try {
                       contentElement.parentNode.replaceChild(originalElement, contentElement);
                    } catch(e) {
                       console.warn(`[Hikka Forge] Failed to restore original element for ${module.name}, removing instead.`, e);
                       contentElement.remove();
                    }
                } else {
                   contentElement.remove();
                }
                this.contentElements.delete(`${module.id}-original`);
            } else {
                contentElement.remove();
            }
            this.contentElements.delete(module.id);
        }

        if (module.onUnload) {
            try {
                module.onUnload();
            } catch (error) {
                console.error(`[Hikka Forge] Error in onUnload of module ${module.name}:`, error);
            }
        }

        this.activeModules.delete(module.id);
        console.log(`[Hikka Forge] Module ${module.name} unloaded`);
    }

    private waitForSelector(module: Module): void {
        if (this.observers.has(module.id)) {
            this.observers.get(module.id)?.disconnect();
        }

        const maxAttempts = 15;
        let attempts = 0;
        let intervalId: number | null = null;
        let observer: MutationObserver | null = null;

        const tryLoad = (): boolean => {
            attempts++;
            const elements = document.querySelectorAll(module.selector.selector);

            if (elements.length > 0) {
                console.log(`[Hikka Forge] Selector "${module.selector.selector}" found for ${module.name} after ${attempts} checks.`);
                if (this.activeModules.has(module.id)) {
                     console.warn(`[Hikka Forge] Module ${module.name} became active before waitForSelector completed.`);
                     cleanup();
                     return true;
                }

                this.activeModules.add(module.id);
                if (module.styles && !this.styleElements.has(module.id)) {
                     this.injectStyles(module);
                }
                this.injectContent(module, elements);

                if (module.onLoad) {
                    try {
                        module.onLoad();
                    } catch (error) {
                        console.error(`[Hikka Forge] Error in onLoad of module ${module.name} (loaded via wait):`, error);
                    }
                }
                console.log(`[Hikka Forge] Module ${module.name} loaded via waitForSelector.`);
                cleanup();
                return true;
            }

            if (attempts >= maxAttempts) {
                console.warn(`[Hikka Forge] Selector "${module.selector.selector}" not found for ${module.name} after ${maxAttempts} checks. Giving up.`);
                cleanup();
                return true;
            }

            return false;
        };

        const cleanup = () => {
            if (intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
            observer?.disconnect();
            this.observers.delete(module.id);
            console.log(`[Hikka Forge] Cleaned up observer/interval for ${module.name}`);
        };

        if (tryLoad()) return;

        observer = new MutationObserver(() => {
            requestAnimationFrame(() => {
               if(document.querySelector(module.selector.selector)) {
                   tryLoad();
               }
            });
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
        intervalId = setInterval(tryLoad, 750) as unknown as number;

        this.observers.set(module.id, observer);
        console.log(`[Hikka Forge] Observer and interval set up for ${module.name}`);
    }

    private initUrlChangeListener(): void {
        const handleLocationChange = () => {
            const newUrl = window.location.href;
            if (newUrl !== this.currentUrl) {
                requestAnimationFrame(() => {
                    if (window.location.href === newUrl) {
                         this.handleUrlChange(newUrl);
                    }
                });
            }
        };

        const pushStateOriginal = history.pushState;
        history.pushState = function (...args) {
            const result = pushStateOriginal.apply(this, args);
            window.dispatchEvent(new Event('locationchange'));
            return result;
        };

        const replaceStateOriginal = history.replaceState;
        history.replaceState = function (...args) {
            const result = replaceStateOriginal.apply(this, args);
            window.dispatchEvent(new Event('locationchange'));
            return result;
        };

        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('locationchange', handleLocationChange);
    }

    private handleUrlChange(newUrl: string): void {
        if (newUrl === this.currentUrl) return;

        console.log(`[Hikka Forge] URL changed: ${this.currentUrl} -> ${newUrl}`);
        const previousUrl = this.currentUrl;
        this.currentUrl = newUrl;

        const modulesToUnloadIds = new Set(this.activeModules);
        console.log(`[Hikka Forge] Unloading modules active on previous URL (${previousUrl}):`, Array.from(modulesToUnloadIds));
        modulesToUnloadIds.forEach(moduleId => {
            const module = this.modules.get(moduleId);
            if (module) {
                this.unloadModule(module);
            } else {
                this.activeModules.delete(moduleId);
            }
        });

        this.activeModules.clear();
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        console.log(`[Hikka Forge] Cleared active modules and observers for new URL.`);

        const modulesToLoad: Module[] = [];
        this.modules.forEach(module => {
            if (module.enabled && this.matchesUrlPatterns(newUrl, module.urlPatterns)) {
                modulesToLoad.push(module);
            }
        });

        const delay = 500;
        if (modulesToLoad.length > 0) {
             console.log(`[Hikka Forge] Scheduling load for ${modulesToLoad.length} modules on ${newUrl} after ${delay}ms`);
             setTimeout(() => {
                console.log(`[Hikka Forge] Attempting to load modules for ${newUrl}:`, modulesToLoad.map(m => m.name));
                modulesToLoad.forEach(module => {
                    if (this.currentUrl === newUrl && !this.activeModules.has(module.id)) {
                         this.loadModule(module);
                    } else if(this.activeModules.has(module.id)) {
                        console.warn(`[Hikka Forge] Module ${module.name} was already active before scheduled load? Skipping.`);
                    } else {
                        console.log(`[Hikka Forge] URL changed again before module ${module.name} could load for ${newUrl}. Skipping.`);
                    }
                });
            }, delay);
        } else {
             console.log(`[Hikka Forge] No modules match the new URL: ${newUrl}`);
        }
    }

    toggleModule(moduleId: string, enabled: boolean): void {
        const module = this.modules.get(moduleId);
        if (!module) {
            console.warn(`[Hikka Forge] Attempted to toggle non-existent module: ${moduleId}`);
            return;
        }

        if (module.enabled === enabled) return;

        module.enabled = enabled;
        this.saveModuleState(moduleId, enabled);
        console.log(`[Hikka Forge] Module ${module.name} toggled ${enabled ? 'ON' : 'OFF'}`);

        if (enabled && this.matchesUrlPatterns(this.currentUrl, module.urlPatterns)) {
            this.loadModule(module);
        } else if (!enabled && this.activeModules.has(module.id)) {
            this.unloadModule(module);
        }
    }

    private saveModuleState(moduleId: string, enabled: boolean): void {
        chrome.storage.sync.set({ [`module_${moduleId}`]: enabled })
            .catch(error => console.error(`[Hikka Forge] Error saving state for module ${moduleId}:`, error));
    }

    async loadModuleStates(): Promise<void> {
        console.log('[Hikka Forge] Loading module states from storage...');
        try {
            const moduleIds = Array.from(this.modules.keys());
            if (moduleIds.length === 0) {
                console.log('[Hikka Forge] No modules registered, skipping state load.');
                return;
            }

            const keys = moduleIds.map(id => `module_${id}`);
            const result = await chrome.storage.sync.get(keys);

            let changed = false;
            moduleIds.forEach(id => {
                const stateKey = `module_${id}`;
                const module = this.modules.get(id);
                const storedState = result[stateKey];

                if (module && storedState !== undefined) {
                    if(module.enabled !== storedState) {
                        console.log(`[Hikka Forge] Applying stored state for ${module.name}: ${storedState}`);
                        module.enabled = storedState;
                        changed = true;
                    }
                } else if (module && storedState === undefined) {
                    this.saveModuleState(id, module.enabled);
                }
            });

             if (changed) {
                 this.handleUrlChange(this.currentUrl);
             } else {
                 console.log('[Hikka Forge] Module states match storage, no changes applied.');
                 this.modules.forEach(module => {
                     if (module.enabled &&
                         this.matchesUrlPatterns(this.currentUrl, module.urlPatterns) &&
                         !this.activeModules.has(module.id)) {
                         this.loadModule(module);
                     }
                 });
             }

        } catch (error) {
            console.error('[Hikka Forge] Error loading module states:', error);
        }
    }

    getModulesInfo(): Array<{ id: string, name: string, description: string, enabled: boolean, urlPatterns: string[] }> {
        return Array.from(this.modules.values()).map(module => ({
            id: module.id,
            name: module.name,
            description: module.description,
            enabled: module.enabled,
            urlPatterns: module.urlPatterns
        }));
    }

    refreshAllModules(): void {
        console.log('[Hikka Forge] Refreshing all active modules...');
        const activeModuleIds = Array.from(this.activeModules);
        const currentUrl = this.currentUrl;

        activeModuleIds.forEach(id => {
            const module = this.modules.get(id);
            if (module) {
                this.unloadModule(module);
            }
        });

        setTimeout(() => {
            console.log('[Hikka Forge] Reloading previously active modules...');
            activeModuleIds.forEach(id => {
                const module = this.modules.get(id);
                if (module && module.enabled && this.currentUrl === currentUrl && this.matchesUrlPatterns(currentUrl, module.urlPatterns)) {
                    this.loadModule(module);
                } else if (module) {
                     console.log(`[Hikka Forge] Skipping reload for ${module.name} (disabled, URL changed, or pattern no longer matches)`);
                }
            });
        }, 300);
    }
}

const moduleManager = new ModuleManager();

function createSafeContentFunction(htmlContent: string): () => HTMLElement {
    return () => {
        const template = document.createElement('template');
        template.innerHTML = htmlContent.trim();
        if (template.content.childNodes.length === 1 && template.content.firstChild instanceof HTMLElement) {
            return template.content.firstChild as HTMLElement;
        } else {
            const container = document.createElement('div');
            container.append(...template.content.childNodes);
            return container;
        }
    };
}

const animeModule: Module = {
    id: 'anime-module',
    name: 'Anime Module',
    description: 'Adds information to anime pages',
    urlPatterns: ['https://hikka.io/anime/*'],
    enabled: true,
    selector: {
        selector: '.main-content',
        position: 'prepend'
    },
    content: createSafeContentFunction(`
    <div class="hikka-forge-anime-module" style="
      margin: 10px 0;
      padding: 8px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e9ecef;
      font-family: inherit;
    ">
      <p style="margin: 0; padding: 0; color: inherit;">Hikka Forge Module activated for anime page</p>
    </div>
  `),
    onLoad: () => console.log('[Hikka Forge] Anime module loaded'),
    onUnload: () => console.log('[Hikka Forge] Anime module unloaded')
};

const mangaModule: Module = {
    id: 'manga-module',
    name: 'Manga Module',
    description: 'Adds information to manga pages',
    urlPatterns: ['https://hikka.io/anime/*'],
    enabled: true,
    selector: {
        selector: 'div.flex.justify-between.gap-4',
        position: 'after',
        index: 2
    },
    content: createSafeContentFunction(`
    <div class="hikka-forge-manga-module" style="
      margin: 10px 0;
      padding: 8px;
      background-color: #e9f5ff;
      border-radius: 4px;
      border: 1px solid #c7e2ff;
      font-family: inherit;
    ">
      <p style="margin: 0; padding: 0; color: inherit;">Hikka Forge Module activated for manga/ranobe page</p>
    </div>
  `),
    onLoad: () => console.log('[Hikka Forge] Manga module loaded'),
    onUnload: () => console.log('[Hikka Forge] Manga module unloaded')
};

moduleManager.registerModule(animeModule);
moduleManager.registerModule(mangaModule);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Hikka Forge] Received message:', message);
    let isAsync = false;

    try {
        switch (message.type) {
            case 'MODULE_ACTION':
                if (message.moduleId && typeof message.action === 'string') {
                    if (message.action === 'TOGGLE' && typeof message.enabled === 'boolean') {
                        moduleManager.toggleModule(message.moduleId, message.enabled);
                        sendResponse({ success: true });
                    } else if (message.action === 'REFRESH') {
                        moduleManager.refreshAllModules();
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: 'Unknown or invalid action parameters' });
                    }
                } else {
                     sendResponse({ success: false, error: 'Missing parameters for MODULE_ACTION' });
                }
                break;

            case 'GET_MODULE_INFO':
                const modulesInfo = moduleManager.getModulesInfo();
                sendResponse({ success: true, modules: modulesInfo });
                break;

            case 'SYNC_MODULES':
                isAsync = true;
                moduleManager.loadModuleStates().then(() => {
                     sendResponse({ success: true });
                 }).catch(error => {
                     console.error("[Hikka Forge] Error during SYNC_MODULES:", error);
                     sendResponse({ success: false, error: String(error) });
                 });
                break;


            default:
                console.warn(`[Hikka Forge] Unknown message type received: ${message.type}`);
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('[Hikka Forge] Error processing message:', error);
        if (!isAsync) {
            sendResponse({ success: false, error: String(error) });
        }
    }

    return isAsync;
});

function initializeForge() {
     setTimeout(() => {
         moduleManager.loadModuleStates();
     }, 1500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeForge);
} else {
    initializeForge();
}

declare global {
    interface Window {
        HikkaForge?: {
            moduleManager: ModuleManager;
            version: string;
        };
    }
}

window.HikkaForge = {
    moduleManager,
    version: '1.0.1'
};

console.log('[Hikka Forge] Content script loaded and HikkaForge exposed.');