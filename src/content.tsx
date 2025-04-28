
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { ForgeModuleDef, ModuleInfo, ContentMessage, InsertPosition } from '@/types/module';
import '@/index.css';

const moduleImports = import.meta.glob< { default: ForgeModuleDef }>('/src/modules/*/module.ts', { eager: true });

const ANIMATION_DURATION_MS = 300;

class ModuleManager {
    private moduleDefinitions: Map<string, ForgeModuleDef> = new Map();
    private moduleEnabledStates: Map<string, boolean> = new Map();
    private activeModuleRoots: Map<string, { container: HTMLElement, root: Root }> = new Map();
    private currentUrl: string = window.location.href;
    private observers: Map<string, MutationObserver> = new Map(); 
    private activeStyleTags: Map<string, HTMLStyleElement> = new Map();

    constructor() {
        this.loadModuleDefinitions();
        this.initUrlChangeListener(); 
        this.startUrlPolling(); 
        this.initMessageListener(); 
        console.log('[Hikka Forge] Module Manager initialized');
        
        setTimeout(() => this.requestInitialStates(), 500);
    }

    private loadModuleDefinitions(): void {
        console.log('[Hikka Forge] Loading module definitions...');
        for (const path in moduleImports) {
            const moduleDef = moduleImports[path].default;
            if (moduleDef && moduleDef.id) {
                this.moduleDefinitions.set(moduleDef.id, moduleDef);
                
                this.moduleEnabledStates.set(moduleDef.id, false);
                console.log(`[Hikka Forge] Registered module definition: ${moduleDef.name} (${moduleDef.id})`);
            } else {
                console.warn(`[Hikka Forge] Invalid module definition found at ${path}`);
            }
        }
    }

     private requestInitialStates(): void {
        console.log('[Hikka Forge] Requesting initial module states from background...');
        chrome.runtime.sendMessage({ type: 'GET_MODULE_DEFINITIONS' }) 
            .then(response => {
                if (response?.success && response.modules) {
                    console.log('[Hikka Forge] Received initial states:', response.modules);
                    const states: Record<string, boolean> = {};
                    response.modules.forEach((modInfo: ModuleInfo) => {
                         states[modInfo.id] = modInfo.enabled;
                    });
                    this.syncModuleStates(states);
                } else {
                     console.warn('[Hikka Forge] Failed to get initial module states from background.', response?.error);
                     
                     this.evaluateModulesForCurrentUrl();
                }
            })
            .catch(error => {
                 console.error('[Hikka Forge] Error requesting initial states:', error);
                 this.evaluateModulesForCurrentUrl();
            });
    }

    private syncModuleStates(enabledStates: Record<string, boolean>): void {
        console.log('[Hikka Forge] Syncing module states:', enabledStates);
        let changed = false;
        this.moduleDefinitions.forEach(moduleDef => {
            const newState = enabledStates[moduleDef.id];
            if (newState !== undefined && this.moduleEnabledStates.get(moduleDef.id) !== newState) {
                 this.moduleEnabledStates.set(moduleDef.id, newState);
                 console.log(`[Hikka Forge] State updated for ${moduleDef.name}: ${newState}`);
                 changed = true;
            } else if (newState === undefined && this.moduleEnabledStates.has(moduleDef.id)) {
                
                
                
                
                 console.log(`[Hikka Forge] State for ${moduleDef.name} not provided in sync, keeping current.`);
            }
        });

        if (changed) {
            console.log('[Hikka Forge] Module states changed, re-evaluating modules for current URL.');
            this.evaluateModulesForCurrentUrl();
        } else {
            console.log('[Hikka Forge] No module state changes detected during sync.');
            
            this.evaluateModulesForCurrentUrl(true); 
        }
    }

    private evaluateModulesForCurrentUrl(onlyLoadMissing: boolean = false): void {
        console.log(`[Hikka Forge] Evaluating modules for URL: ${this.currentUrl}`);
        const modulesToActivate: ForgeModuleDef[] = [];
        const modulesToDeactivate: string[] = []; 

        this.moduleDefinitions.forEach(moduleDef => {
            const isEnabled = this.moduleEnabledStates.get(moduleDef.id) ?? false;
            const matchesUrl = this.matchesUrlPatterns(this.currentUrl, moduleDef.urlPatterns);
            
            const isComponentActive = this.activeModuleRoots.has(moduleDef.id);
            const areStylesActive = this.activeStyleTags.has(moduleDef.id);
            const isActive = isComponentActive || areStylesActive;
            

            if (isEnabled && matchesUrl) {
                if (!isActive) {
                    modulesToActivate.push(moduleDef);
                }
            } else {
                if (isActive && !onlyLoadMissing) {
                    modulesToDeactivate.push(moduleDef.id);
                }
            }
        });

        if (!onlyLoadMissing) {
            console.log('[Hikka Forge] Modules to Deactivate:', modulesToDeactivate);
            modulesToDeactivate.forEach(id => this.unloadModule(id)); 
        }

        console.log('[Hikka Forge] Modules to Activate:', modulesToActivate.map(m => m.name));
        modulesToActivate.forEach(moduleDef => this.loadModule(moduleDef)); 
    }


    private matchesUrlPatterns(url: string, patterns: string[]): boolean {
        
        return patterns.some(pattern => {
            const regexPattern = pattern
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&') 
                .replace(/\*/g, '.*'); 
            try {
                const regex = new RegExp(`^${regexPattern}$`);
                return regex.test(url);
            } catch (e) {
                console.error(`[Hikka Forge] Invalid URL pattern: ${pattern}`, e);
                return false;
            }
        });
    }

    private loadModule(moduleDef: ForgeModuleDef): void {
        const isComponentActive = this.activeModuleRoots.has(moduleDef.id);
        const areStylesActive = this.activeStyleTags.has(moduleDef.id);

        if (moduleDef.styles && !areStylesActive) {
            console.log(`[Hikka Forge] Injecting styles for module: ${moduleDef.name}`);
            this.injectStyles(moduleDef);
        }

        
        if (moduleDef.component && moduleDef.elementSelector && !isComponentActive) {
            console.log(`[Hikka Forge] Attempting to load component for module: ${moduleDef.name}`);
            
            const elements = document.querySelectorAll(moduleDef.elementSelector.selector);
            if (elements.length === 0) {
                console.log(`[Hikka Forge] Selector "${moduleDef.elementSelector.selector}" not found for ${moduleDef.name}. Waiting...`);
                this.waitForSelector(moduleDef);
                return;
            }
            
            this.injectModuleComponent(moduleDef, elements);
        } else if (moduleDef.component && !moduleDef.elementSelector) {
             console.warn(`[Hikka Forge] Module ${moduleDef.name} has a component but no elementSelector. Cannot inject component.`);
        }
    }

    private injectStyles(moduleDef: ForgeModuleDef): void {
        if (!moduleDef.styles) return; 

        
        this.removeStyles(moduleDef.id);

        const styleElement = document.createElement('style');
        styleElement.id = `hikka-forge-style-${moduleDef.id}`;
        styleElement.textContent = moduleDef.styles;
        document.head.appendChild(styleElement);
        this.activeStyleTags.set(moduleDef.id, styleElement);
        console.log(`[Hikka Forge] Styles for ${moduleDef.name} injected.`);
    }

    private removeStyles(moduleId: string): void {
        const styleTag = this.activeStyleTags.get(moduleId);
        if (styleTag) {
            styleTag.remove();
            this.activeStyleTags.delete(moduleId);
            console.log(`[Hikka Forge] Styles for module ${moduleId} removed.`);
        }
    }

    private injectModuleComponent(moduleDef: ForgeModuleDef, elements: NodeListOf<Element>): void {
        
        if (!moduleDef.elementSelector) {
            console.error(`[Hikka Forge] injectModuleComponent called for ${moduleDef.name} without an elementSelector.`);
            return;
        }
        
        try {
           
           const index = moduleDef.elementSelector.index ?? 0;
           let targetElement = elements[index] ?? elements[elements.length - 1];

           if (!targetElement) {
               console.error(`[Hikka Forge] Target element not found for ${moduleDef.name} (selector: ${moduleDef.elementSelector.selector}, index: ${index}). Retrying...`);
               this.retryInjection(moduleDef);
               return;
           }

           const existingContainer = document.getElementById(`hikka-forge-module-${moduleDef.id}`);
           if (existingContainer) {
               console.warn(`[Hikka Forge] Found existing container for ${moduleDef.name}. Removing before re-injection.`);
               existingContainer.remove();
           }
            if (this.activeModuleRoots.has(moduleDef.id)) {
                console.warn(`[Hikka Forge] Module ${moduleDef.name} root already exists before injection. Unmounting first.`);
                this.unloadModule(moduleDef.id);
            }

           const container = document.createElement('div');
           container.id = `hikka-forge-module-${moduleDef.id}`;
           container.dataset.moduleId = moduleDef.id;
           container.classList.add('hikka-forge-module-wrapper');

           container.classList.add('animate');

           
           if (!moduleDef.component) {
                console.error(`[Hikka Forge] Cannot inject component for ${moduleDef.name}: component is undefined.`);
                return;
           }

           const root = createRoot(container);
           root.render(React.createElement(moduleDef.component));
           this.activeModuleRoots.set(moduleDef.id, { container, root });

           console.log(`[Hikka Forge] Injecting ${moduleDef.name} ${moduleDef.elementSelector.position} ${moduleDef.elementSelector.selector}`);
            
           this.insertElement(container, targetElement, moduleDef.elementSelector.position);

           requestAnimationFrame(() => {
                    container.classList.add('visible'); 
            });

           console.log(`[Hikka Forge] Module ${moduleDef.name} loaded and rendered successfully.`);

       } catch (error) {
           console.error(`[Hikka Forge] Error injecting component for module ${moduleDef.name}:`, error);
           this.activeModuleRoots.delete(moduleDef.id);
            const failedContainer = document.getElementById(`hikka-forge-module-${moduleDef.id}`);
            failedContainer?.remove();
           this.retryInjection(moduleDef);
       }
   }

     private insertElement(elementToInsert: HTMLElement, targetElement: Element, position: InsertPosition): void {
        switch (position) {
            case 'before':
                targetElement.parentNode?.insertBefore(elementToInsert, targetElement);
                break;
            case 'after':
                targetElement.parentNode?.insertBefore(elementToInsert, targetElement.nextSibling);
                break;
            case 'prepend':
                targetElement.insertBefore(elementToInsert, targetElement.firstChild);
                break;
            case 'append':
                targetElement.appendChild(elementToInsert);
                break;
            case 'replace':
                 
                 
                console.warn(`[Hikka Forge] Using 'replace' for ${elementToInsert.dataset.moduleId}. This can be risky.`);
                targetElement.parentNode?.replaceChild(elementToInsert, targetElement);
                break;
            default:
                console.error(`[Hikka Forge] Invalid insert position: ${position}`);
                targetElement.appendChild(elementToInsert); 
        }
    }


    private retryInjection(moduleDef: ForgeModuleDef, attempt: number = 1): void {
        
        
        if (!moduleDef.elementSelector) {
            
            
            console.warn(`[Hikka Forge] Attempted to retry injection for ${moduleDef.name}, but it has no elementSelector.`);
            return;
        }
        

        if (attempt > 3) {
            console.warn(`[Hikka Forge] Failed to inject ${moduleDef.name} after 3 attempts.`);
            return;
        }
        console.log(`[Hikka Forge] Retrying injection for ${moduleDef.name} (attempt ${attempt})...`);
        setTimeout(() => {
            
            const isEnabled = this.moduleEnabledStates.get(moduleDef.id) ?? false;
            const matchesUrl = this.matchesUrlPatterns(this.currentUrl, moduleDef.urlPatterns);

            
            
            if (!moduleDef.elementSelector) {
                 console.error(`[Hikka Forge] Error during retry for ${moduleDef.name}: elementSelector became undefined unexpectedly.`);
                 return;
            }
             
             if (!isEnabled || !matchesUrl) {
                console.log(`[Hikka Forge] Conditions no longer met for ${moduleDef.name} during retry. Aborting.`);
                return;
            }
            

            
            const elements = document.querySelectorAll(moduleDef.elementSelector.selector);
            

            if (elements.length > 0) {
                 console.log(`[Hikka Forge] Found elements for ${moduleDef.name} on retry.`);
                
                this.injectModuleComponent(moduleDef, elements);
            } else {
                
                this.retryInjection(moduleDef, attempt + 1);
            }
        }, 500 * attempt);
    }

    private unloadModule(moduleId: string): void {
        const moduleDef = this.moduleDefinitions.get(moduleId);
        const name = moduleDef?.name ?? moduleId;

        console.log(`[Hikka Forge] Unloading module: ${name}`);

        
        const activeInstance = this.activeModuleRoots.get(moduleId);
        if (activeInstance) {
            const container = activeInstance.container;

            
            container.classList.remove('visible'); 
            

             
            setTimeout(() => {
                console.log(`[Hikka Forge] Removing DOM after animation for ${name}`);
                try {
                    
                    activeInstance.root.unmount();
                } catch (error) {
                    console.error(`[Hikka Forge] Error unmounting React root for ${name} during unload:`, error);
                }
                try {
                    
                    container.remove();
                } catch (error) {
                     console.error(`[Hikka Forge] Error removing container for ${name} during unload:`, error);
                }
                
                 this.activeModuleRoots.delete(moduleId);
            }, ANIMATION_DURATION_MS); 
             

        } else {
             
             this.activeModuleRoots.delete(moduleId);
        }
        

        
        this.removeStyles(moduleId);
        

        
        this.observers.get(moduleId)?.disconnect();
        this.observers.delete(moduleId);
        

        console.log(`[Hikka Forge] Unload process initiated for ${name}. DOM removal delayed for component.`);
    }

    private waitForSelector(moduleDef: ForgeModuleDef): void {
        
        if (!moduleDef.component || !moduleDef.elementSelector) {
             return;
        }
        if (this.observers.has(moduleDef.id)) return;

        
        console.log(`[Hikka Forge] Setting up MutationObserver for ${moduleDef.name} (selector: ${moduleDef.elementSelector?.selector})`);
        

        const observer = new MutationObserver((mutationsList, obs) => {
            
            if (!moduleDef.elementSelector) {
                obs.disconnect();
                this.observers.delete(moduleDef.id);
                return;
            }
            

            const isEnabled = this.moduleEnabledStates.get(moduleDef.id) ?? false;
            const matchesUrl = this.matchesUrlPatterns(this.currentUrl, moduleDef.urlPatterns);

            if (!isEnabled || !matchesUrl) {
                 console.log(`[Hikka Forge] Conditions no longer met for ${moduleDef.name} while waiting. Disconnecting observer.`);
                 obs.disconnect();
                 this.observers.delete(moduleDef.id);
                 return;
            }

            
            if (document.querySelector(moduleDef.elementSelector.selector)) {
                 console.log(`[Hikka Forge] Selector found for ${moduleDef.name} via MutationObserver.`);
                 obs.disconnect();
                 this.observers.delete(moduleDef.id);
                 if (!this.activeModuleRoots.has(moduleDef.id)) {
                     this.loadModule(moduleDef);
                 } else {
                      console.log(`[Hikka Forge] Component for ${moduleDef.name} became active while waiting. Observer finished.`);
                 }
            }
            
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
        this.observers.set(moduleDef.id, observer);
    }


    
    
     private initUrlChangeListener(): void {
        const handleLocationChange = () => {
            
            requestAnimationFrame(() => {
                const newUrl = window.location.href;
                if (newUrl !== this.currentUrl) {
                    console.log(`[Hikka Forge] URL change detected (event): ${this.currentUrl} -> ${newUrl}`);
                    this.handleUrlChange(newUrl);
                }
            });
        };

        
        window.addEventListener('popstate', handleLocationChange);

        
        const originalPushState = history.pushState;
        history.pushState = function(...args) {
            const result = originalPushState.apply(this, args);
            window.dispatchEvent(new Event('historystatechanged')); 
            return result;
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function(...args) {
            const result = originalReplaceState.apply(this, args);
            window.dispatchEvent(new Event('historystatechanged')); 
            return result;
        };

        window.addEventListener('historystatechanged', handleLocationChange);
    }

    private startUrlPolling(): void {
        let lastCheckedUrl = window.location.href;
        let pollInterval: number | null = null;

        const checkUrl = () => {
            if (document.hidden) return; 

            const currentUrl = window.location.href;
            if (currentUrl !== lastCheckedUrl) {
                console.log(`[Hikka Forge] URL change detected (polling): ${lastCheckedUrl} -> ${currentUrl}`);
                this.handleUrlChange(currentUrl);
                lastCheckedUrl = currentUrl;
            }
        };

        
        if (!document.hidden) {
            pollInterval = setInterval(checkUrl, 1500) as unknown as number;
        }

        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && pollInterval !== null) {
                clearInterval(pollInterval);
                pollInterval = null;
            } else if (!document.hidden && pollInterval === null) {
                lastCheckedUrl = window.location.href; 
                pollInterval = setInterval(checkUrl, 1500) as unknown as number;
            }
        });
    }

    private handleUrlChange(newUrl: string): void {
        if (newUrl === this.currentUrl) return;

        console.log(`[Hikka Forge] Processing URL change: ${this.currentUrl} -> ${newUrl}`);
        this.currentUrl = newUrl;

        
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        
        this.evaluateModulesForCurrentUrl();
    }


    
    private initMessageListener(): void {
        chrome.runtime.onMessage.addListener((message: ContentMessage, sender, sendResponse) => {
            console.log('[Hikka Forge] Content script received message:', message);
            let isAsync = false;

            try {
                switch (message.type) {
                    case 'SYNC_MODULES':
                        
                        this.syncModuleStates(message.enabledStates);
                        sendResponse({ success: true });
                        break;

                    case 'GET_CONTENT_MODULES_INFO':
                         
                        const modulesInfo = this.getModulesInfo();
                        sendResponse({ success: true, modules: modulesInfo });
                        break;

                    case 'MODULE_ACTION':
                        if (message.action === 'REFRESH') {
                            this.refreshAllActiveModules();
                            sendResponse({ success: true });
                        } else {
                             sendResponse({ success: false, error: 'Unknown MODULE_ACTION action for content script' });
                        }
                        break;

                    
                    
                    
                    
                    
                    

                    default:
                        
                         
                         return false; 
                }
            } catch (error) {
                console.error('[Hikka Forge] Error processing message in content script:', error);
                if (!isAsync) {
                    sendResponse({ success: false, error: String(error) });
                }
            }
            
            return isAsync;
        });
    }

     getModulesInfo(): ModuleInfo[] {
        return Array.from(this.moduleDefinitions.values()).map(moduleDef => ({
            id: moduleDef.id,
            name: moduleDef.name,
            description: moduleDef.description,
            enabled: this.moduleEnabledStates.get(moduleDef.id) ?? false,
            urlPatterns: moduleDef.urlPatterns,
        }));
    }

     refreshAllActiveModules(): void {
        console.log('[Hikka Forge] Refreshing all active modules...');
        const activeModuleIds = Array.from(this.activeModuleRoots.keys());

        
        activeModuleIds.forEach(id => this.unloadModule(id));

        
        setTimeout(() => {
            console.log('[Hikka Forge] Re-evaluating modules after refresh...');
            
             this.evaluateModulesForCurrentUrl();
        }, 100); 
    }
}


const moduleManager = new ModuleManager();


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
    version: '1.1.0-modular' 
};

console.log('[Hikka Forge] Content script loaded and HikkaForge exposed.');