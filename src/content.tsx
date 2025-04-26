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
        console.log(`[Hikka Forge] URL change detected: ${lastCheckedUrl} -> ${currentUrl}`);
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

    if (this.matchesUrlPatterns(this.currentUrl, module.urlPatterns)) {
      setTimeout(() => {
        if (module.enabled) {
          this.loadModule(module);
        }
      }, 500);
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
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(url);
    });
  }

  private loadModule(module: Module): void {
    if (this.activeModules.has(module.id)) return;

    if (module.styles) {
      this.injectStyles(module);
    }

    const elements = document.querySelectorAll(module.selector.selector);
    if (elements.length === 0) {
      console.log(`[Hikka Forge] Selector "${module.selector.selector}" not found for module ${module.name}, waiting for it to appear...`);
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

    this.activeModules.add(module.id);
    console.log(`[Hikka Forge] Module ${module.name} loaded`);
  }

  private injectStyles(module: Module): void {
    const existingStyle = this.styleElements.get(module.id);
    if (existingStyle) {
      existingStyle.remove();
    }

    const styleElement = document.createElement('style');
    styleElement.id = `hikka-forge-style-${module.id}`;
    styleElement.textContent = module.styles || '';
    document.head.appendChild(styleElement);

    this.styleElements.set(module.id, styleElement);
  }

  private injectContent(module: Module, elements: NodeListOf<Element>): void {
    let targetElement: Element;
    const index = module.selector.index ?? 0;

    if (index >= elements.length) {
      targetElement = elements[elements.length - 1];
    } else {
      targetElement = elements[index];
    }

    const container = document.createElement('div');
    container.id = `hikka-forge-content-${module.id}`;
    container.className = 'hikka-forge-module';
    container.dataset.moduleId = module.id;

    if (typeof module.content === 'string') {
      container.innerHTML = module.content;
    } else if (typeof module.content === 'function') {
      const content = module.content();
      if (content instanceof HTMLElement) {
        container.appendChild(content);
      } else {
        container.innerHTML = content;
      }
    }

    this.contentElements.set(module.id, container);

    try {
      switch (module.selector.position) {
        case 'before':
          targetElement.parentNode?.insertBefore(container, targetElement);
          break;
        case 'after':
          if (targetElement.nextSibling) {
            targetElement.parentNode?.insertBefore(container, targetElement.nextSibling);
          } else {
            targetElement.parentNode?.appendChild(container);
          }
          break;
        case 'prepend':
          if (targetElement.firstChild) {
            targetElement.insertBefore(container, targetElement.firstChild);
          } else {
            targetElement.appendChild(container);
          }
          break;
        case 'append':
          targetElement.appendChild(container);
          break;
        case 'replace':
          this.contentElements.set(`${module.id}-original`, targetElement.cloneNode(true) as HTMLElement);
          targetElement.parentNode?.replaceChild(container, targetElement);
          break;
      }
    } catch (error) {
      console.error(`[Hikka Forge] Error injecting module ${module.name}:`, error);
    }
  }

  private unloadModule(module: Module): void {
    if (!this.activeModules.has(module.id)) return;

    const observer = this.observers.get(module.id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(module.id);
    }

    const styleElement = this.styleElements.get(module.id);
    if (styleElement) {
      styleElement.remove();
      this.styleElements.delete(module.id);
    }

    const contentElement = this.contentElements.get(module.id);
    if (contentElement) {
      if (module.selector.position === 'replace') {
        const originalElement = this.contentElements.get(`${module.id}-original`);
        if (originalElement && contentElement.parentNode) {
          contentElement.parentNode.replaceChild(originalElement, contentElement);
          this.contentElements.delete(`${module.id}-original`);
        }
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

    const elements = document.querySelectorAll(module.selector.selector);
    if (elements.length > 0) {
        this.injectContent(module, elements);
        if (module.onLoad) {
        try {
            module.onLoad();
        } catch (error) {
            console.error(`[Hikka Forge] Error in onLoad of module ${module.name}:`, error);
        }
        }
        this.activeModules.add(module.id);
        console.log(`[Hikka Forge] Module ${module.name} loaded (selector already existed)`);
        return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const elements = document.querySelectorAll(module.selector.selector);
      if (elements.length > 0) {
        obs.disconnect();
        this.observers.delete(module.id);

        this.injectContent(module, elements);

        if (module.onLoad) {
          try {
            module.onLoad();
          } catch (error) {
            console.error(`[Hikka Forge] Error in onLoad of module ${module.name}:`, error);
          }
        }

        this.activeModules.add(module.id);
        console.log(`[Hikka Forge] Module ${module.name} loaded (after waiting for selector)`);
      }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

    this.observers.set(module.id, observer);
  }

  private cleanupUnusedObservers(): void {
    this.observers.forEach((observer, moduleId) => {
      const module = this.modules.get(moduleId);
      if (module && !this.matchesUrlPatterns(this.currentUrl, module.urlPatterns)) {
        observer.disconnect();
        this.observers.delete(moduleId);
        console.log(`[Hikka Forge] Disconnected observer for module ${moduleId}`);
      }
    });
  }

  private initUrlChangeListener(): void {
    const pushStateOriginal = history.pushState;
    const replaceStateOriginal = history.replaceState;

    history.pushState = function(...args) {
      const result = pushStateOriginal.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };

    history.replaceState = function(...args) {
      const result = replaceStateOriginal.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };

    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'));
    });

    window.addEventListener('locationchange', () => {
      const newUrl = window.location.href;
      if (newUrl !== this.currentUrl) {
        this.handleUrlChange(newUrl);
      }
    });
  }

  private handleUrlChange(newUrl: string): void {
    console.log(`[Hikka Forge] URL changed: ${this.currentUrl} -> ${newUrl}`);
    this.currentUrl = newUrl;

    this.cleanupUnusedObservers();

    const modulesToUnload: Module[] = [];
    const modulesToLoad: Module[] = [];

    this.modules.forEach(module => {
      const shouldBeActive = module.enabled && this.matchesUrlPatterns(newUrl, module.urlPatterns);
      const isActive = this.activeModules.has(module.id);

      if (isActive && !shouldBeActive) {
        modulesToUnload.push(module);
      } else if (!isActive && shouldBeActive) {
        modulesToLoad.push(module);
      }
    });

    modulesToUnload.forEach(module => {
      this.unloadModule(module);
    });

    if (modulesToLoad.length > 0) {
        setTimeout(() => {
          modulesToLoad.forEach(module => {
            this.loadModule(module);
          });
        }, 800);
      }
  }

  toggleModule(moduleId: string, enabled: boolean): void {
    const module = this.modules.get(moduleId);
    if (!module) return;

    module.enabled = enabled;

    this.saveModuleState(moduleId, enabled);

    if (enabled && this.matchesUrlPatterns(this.currentUrl, module.urlPatterns)) {
      this.loadModule(module);
    } else if (!enabled) {
      this.unloadModule(module);
    }
  }

  private saveModuleState(moduleId: string, enabled: boolean): void {
    chrome.storage.sync.set({
      [`module_${moduleId}`]: enabled
    }).catch(error => {
      console.error(`[Hikka Forge] Error saving state for module ${moduleId}:`, error);
    });
  }

  async loadModuleStates(): Promise<void> {
    try {
      const moduleIds = Array.from(this.modules.keys());
      const keys = moduleIds.map(id => `module_${id}`);

      const result = await chrome.storage.sync.get(keys);

      moduleIds.forEach(id => {
        const stateKey = `module_${id}`;
        const module = this.modules.get(id);

        if (module && result[stateKey] !== undefined) {
          module.enabled = result[stateKey];

          if (module.enabled && this.matchesUrlPatterns(this.currentUrl, module.urlPatterns)) {
            setTimeout(() => this.loadModule(module), 500);
          }
        }
      });
    } catch (error) {
      console.error('[Hikka Forge] Error loading module states:', error);
    }
  }

  getModulesInfo(): Array<{id: string, name: string, description: string, enabled: boolean, urlPatterns: string[]}> {
    return Array.from(this.modules.values()).map(module => ({
      id: module.id,
      name: module.name,
      description: module.description,
      enabled: module.enabled,
      urlPatterns: module.urlPatterns
    }));
  }

  refreshAllModules(): void {
    const activeModuleIds = Array.from(this.activeModules);

    activeModuleIds.forEach(id => {
      const module = this.modules.get(id);
      if (module) {
        this.unloadModule(module);
      }
    });

    setTimeout(() => {
      activeModuleIds.forEach(id => {
        const module = this.modules.get(id);
        if (module && module.enabled) {
          this.loadModule(module);
        }
      });
    }, 300);
  }
}

const moduleManager = new ModuleManager();

function createSafeContentFunction(htmlContent: string): () => HTMLElement {
  return () => {
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    return container;
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
  onLoad: () => {
    console.log('[Hikka Forge] Anime module loaded');
  }
};

const mangaModule: Module = {
  id: 'manga-module',
  name: 'Manga Module',
  description: 'Adds information to manga pages',
  urlPatterns: ['https://hikka.io/anime/*'],
  enabled: true,
  selector: {
    selector: 'div.flex.justify-between.gap-4',
    position: 'prepend'
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
      <p style="margin: 0; padding: 0; color: inherit;">Hikka Forge Module activated for manga page</p>
    </div>
  `),
  onLoad: () => {
    console.log('[Hikka Forge] Manga module loaded');
  }
};

moduleManager.registerModule(animeModule);
moduleManager.registerModule(mangaModule);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Hikka Forge] Received message:', message);

  try {
    switch (message.type) {
      case 'MODULE_ACTION':
        if (message.action === 'TOGGLE') {
          moduleManager.toggleModule(message.moduleId, message.enabled);
          sendResponse({ success: true });
        } else if (message.action === 'REFRESH') {
          moduleManager.refreshAllModules();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Unknown action' });
        }
        break;

      case 'GET_MODULE_INFO':
        const modulesInfo = moduleManager.getModulesInfo();
        sendResponse({ success: true, modules: modulesInfo });
        break;

      case 'URL_CHANGED':
        sendResponse({ success: true });
        break;

      case 'SYNC_MODULES':
        moduleManager.loadModuleStates();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('[Hikka Forge] Error processing message:', error);
    sendResponse({ success: false, error: String(error) });
  }

  return true;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      moduleManager.loadModuleStates();
    }, 1000);
  });
} else {
  setTimeout(() => {
    moduleManager.loadModuleStates();
  }, 1000);
}

window.HikkaForge = {
  moduleManager,
  version: '1.0.0'
};

declare global {
  interface Window {
    HikkaForge: {
      moduleManager: ModuleManager;
      version: string;
    };
  }
}