import type { BackgroundMessage, ModuleInfo, ContentMessage } from './types/module';

let moduleDefinitionsCache: ModuleInfo[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

class BackgroundManager {
    private tabStates: Map<number, { url: string; lastChecked: number }> = new Map();

    constructor() {
        this.initWebNavigationListeners();
        this.initTabsListeners();
        this.initMessageListener();
        this.initInstallAndUpdateListeners();
        console.log('[Hikka Forge] Background script initialized');

        this.primeModuleDefinitionsCache();
    }

    private initWebNavigationListeners(): void {
        chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
            if (details.frameId === 0 && details.url.startsWith('https://hikka.io/')) {
                this.handleUrlChange(details.tabId, details.url);
            }
        }, { url: [{ hostEquals: 'hikka.io' }] });

        chrome.webNavigation.onCompleted.addListener(details => {
            if (details.frameId === 0 && details.url.startsWith('https://hikka.io/')) {
                this.handleUrlChange(details.tabId, details.url);
            }
        }, { url: [{ hostEquals: 'hikka.io' }] });
    }

    private initTabsListeners(): void {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.url && tab.url?.startsWith('https://hikka.io/')) {
                this.handleUrlChange(tabId, tab.url);
            }

            if (changeInfo.status === 'complete' && tab.url?.startsWith('https://hikka.io/')) {
                this.syncTabIfNeeded(tabId);
            }
        });

        chrome.tabs.onRemoved.addListener(tabId => {
            this.tabStates.delete(tabId);
        });
    }

    private initInstallAndUpdateListeners(): void {
        chrome.runtime.onInstalled.addListener(details => {
            if (details.reason === 'install') {
                console.log('[Hikka Forge] Extension installed');
                chrome.storage.sync.set({
                    'module_enabled_example-button': true,
                    'module_enabled_font-override': false,
                }).then(() => {
                    console.log('[Hikka Forge] Default module states set.');
                }).catch(error => {
                    console.error('[Hikka Forge] Error setting default module states:', error);
                });
            } else if (details.reason === 'update') {

            }
            moduleDefinitionsCache = null;
        });
    }

    private initMessageListener(): void {
        chrome.runtime.onMessage.addListener((message: BackgroundMessage | any, sender, sendResponse) => {
            let isAsync = false;

            if (message.type === 'GET_MODULE_DEFINITIONS') {
                isAsync = true;
                this.getModuleDefinitionsWithState()
                    .then(modules => sendResponse({ success: true, modules }))
                    .catch(error => {
                        console.error("[Hikka Forge] Error getting module definitions:", error);
                        sendResponse({ success: false, error: String(error) });
                    });
            } else if (message.type === 'MODULE_ACTION') {
                if (message.action === 'TOGGLE' && message.moduleId && typeof message.enabled === 'boolean') {
                    isAsync = true;
                    this.toggleModuleState(message.moduleId, message.enabled)
                        .then(() => sendResponse({ success: true }))
                        .catch(error => {
                            console.error(`[Hikka Forge] Error toggling module ${message.moduleId}:`, error);
                            sendResponse({ success: false, error: String(error) });
                        });
                } else if (message.action === 'REFRESH') {
                    isAsync = true;
                    this.refreshContentInAllTabs()
                        .then(() => sendResponse({ success: true }))
                        .catch(error => {
                            console.error("[Hikka Forge] Error refreshing content:", error);
                            sendResponse({ success: false, error: String(error) });
                        });
                } else {
                    console.warn("[Hikka Forge] Unknown MODULE_ACTION received:", message);
                    sendResponse({ success: false, error: 'Invalid module action' });
                }
            }
            return isAsync;
        });
    }

    private handleUrlChange(tabId: number, url: string): void {
        const now = Date.now();
        const tabState = this.tabStates.get(tabId);

        if (tabState && tabState.url === url && now - tabState.lastChecked < 500) {
            return;
        }

        console.log(`[Hikka Forge] URL change detected for tab ${tabId}: ${url}`);
        this.tabStates.set(tabId, { url, lastChecked: now });

        this.syncTabIfNeeded(tabId);
    }

    private async toggleModuleState(moduleId: string, enabled: boolean): Promise<void> {
        const storageKey = `module_enabled_${moduleId}`;
        console.log(`[Hikka Forge] Setting ${storageKey} to ${enabled}`);
        try {
            await chrome.storage.sync.set({ [storageKey]: enabled });

            moduleDefinitionsCache = null;

            await this.syncAllTabs();
        } catch (error) {
            console.error(`[Hikka Forge] Failed to save state for ${moduleId}:`, error);
            throw error;
        }
    }

    private async primeModuleDefinitionsCache(): Promise<void> {
        console.log('[Hikka Forge] Priming module definitions cache...');
        try {
            await this.fetchModuleDefinitionsFromContentScript();
            console.log('[Hikka Forge] Cache primed successfully.');
        } catch (error) {
            console.warn('[Hikka Forge] Could not prime cache on startup (no active Hikka tabs?):', error);
        }
    }

    private async getModuleDefinitionsWithState(): Promise<ModuleInfo[]> {
        const now = Date.now();
        if (moduleDefinitionsCache && now - cacheTimestamp < CACHE_DURATION) {
            console.log("[Hikka Forge] Returning cached module definitions.");

            return this.updateCachedStatesFromStorage(moduleDefinitionsCache);
        }

        console.log("[Hikka Forge] Cache expired or empty, fetching fresh module definitions...");
        try {
            const definitions = await this.fetchModuleDefinitionsFromContentScript();
            moduleDefinitionsCache = definitions;
            cacheTimestamp = now;

            return this.updateCachedStatesFromStorage(definitions);
        } catch (error) {
            console.error("[Hikka Forge] Failed to fetch fresh definitions, returning empty/stale cache:", error);

            return this.updateCachedStatesFromStorage(moduleDefinitionsCache || []);
        }
    }

    private async updateCachedStatesFromStorage(definitions: ModuleInfo[]): Promise<ModuleInfo[]> {
        if (!definitions || definitions.length === 0) {
            return [];
        }
        const keys = definitions.map(def => `module_enabled_${def.id}`);
        try {
            const storedStates = await chrome.storage.sync.get(keys);
            return definitions.map(def => ({
                ...def,
                enabled: storedStates[`module_enabled_${def.id}`] ?? false
            }));
        } catch (error) {
            console.error("[Hikka Forge] Failed to get states from storage:", error);

            return definitions;
        }
    }

    private async fetchModuleDefinitionsFromContentScript(): Promise<ModuleInfo[]> {
        const tabs = await chrome.tabs.query({ url: "https://hikka.io/*", status: "complete" });

        if (tabs.length === 0) {
            throw new Error("No active Hikka tabs found to fetch module definitions from.");
        }

        for (const tab of tabs) {
            if (tab.id) {
                try {
                    console.log(`[Hikka Forge] Requesting module info from tab ${tab.id}`);
                    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CONTENT_MODULES_INFO' } as ContentMessage);
                    if (response?.success && Array.isArray(response.modules)) {
                        console.log(`[Hikka Forge] Received module info from tab ${tab.id}:`, response.modules.length);

                        return response.modules.map((m: ModuleInfo) => ({
                            id: m.id,
                            name: m.name,
                            description: m.description,
                            enabled: false,
                            urlPatterns: m.urlPatterns,
                        }));
                    } else {
                        console.warn(`[Hikka Forge] Invalid response from tab ${tab.id}:`, response);
                    }
                } catch (error: any) {

                    if (!error.message.includes('Could not establish connection') && !error.message.includes('Receiving end does not exist')) {
                        console.warn(`[Hikka Forge] Error fetching module info from tab ${tab.id}:`, error);
                    } else {
                        // TODO: Handle this error more gracefully
                    }
                }
            }
        }
        throw new Error("Failed to fetch module definitions from any active Hikka tab.");
    }

    private async syncTabIfNeeded(tabId: number): Promise<void> {

        if (this.tabStates.has(tabId)) {
            try {
                await this.sendSyncMessageToTab(tabId);
            } catch (error) {

            }
        }
    }

    private async syncAllTabs(): Promise<void> {
        console.log('[Hikka Forge] Syncing states with all Hikka tabs...');
        try {
            const tabs = await chrome.tabs.query({ url: "https://hikka.io/*" });
            const syncPromises = tabs
                .filter(tab => tab.id !== undefined)
                .map(tab => this.sendSyncMessageToTab(tab.id!));

            await Promise.allSettled(syncPromises);
            console.log('[Hikka Forge] Sync attempt completed for all tabs.');
        } catch (error) {
            console.error('[Hikka Forge] Error querying tabs for sync:', error);
        }
    }

    private async sendSyncMessageToTab(tabId: number): Promise<void> {
        try {
            const allSettings = await chrome.storage.sync.get(null);
            const enabledStates: Record<string, boolean> = {};

            for (const key in allSettings) {
                if (key.startsWith('module_enabled_')) {
                    const moduleId = key.substring('module_enabled_'.length);
                    enabledStates[moduleId] = !!allSettings[key];
                }
            }

            console.log(`[Hikka Forge] Sending SYNC_MODULES to tab ${tabId}`, enabledStates);
            await chrome.tabs.sendMessage(tabId, {
                type: 'SYNC_MODULES',
                enabledStates
            } as ContentMessage);
            console.log(`[Hikka Forge] SYNC_MODULES sent successfully to tab ${tabId}`);
        } catch (error: any) {
            if (!error.message.includes('Could not establish connection') && !error.message.includes('Receiving end does not exist')) {
                console.error(`[Hikka Forge] Error sending SYNC_MODULES to tab ${tabId}:`, error);
            }
        }
    }

    private async refreshContentInAllTabs(): Promise<void> {
        console.log('[Hikka Forge] Sending REFRESH action to all Hikka tabs...');
        try {
            const tabs = await chrome.tabs.query({ url: "https://hikka.io/*" });
            const refreshPromises = tabs
                .filter(tab => tab.id !== undefined)
                .map(tab =>
                    chrome.tabs.sendMessage(tab.id!, { type: 'MODULE_ACTION', action: 'REFRESH' } as ContentMessage)
                        .catch(err => { })
                );
            await Promise.allSettled(refreshPromises);
            console.log('[Hikka Forge] REFRESH action sent to all tabs.');
        } catch (error) {
            console.error('[Hikka Forge] Error sending REFRESH action:', error);
            throw error;
        }
    }

}

const backgroundManager = new BackgroundManager();