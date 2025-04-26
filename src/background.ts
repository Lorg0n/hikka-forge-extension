interface ModuleAction {
  type: 'MODULE_ACTION';
  action: 'TOGGLE' | 'REFRESH';
  moduleId?: string;
  enabled?: boolean;
}

interface GetModuleInfo {
  type: 'GET_MODULE_INFO';
}

interface UrlChangedMessage {
  type: 'URL_CHANGED';
  url: string;
}

interface SyncModulesMessage {
  type: 'SYNC_MODULES';
  settings: Record<string, any>;
}

type Message = ModuleAction | GetModuleInfo | UrlChangedMessage | SyncModulesMessage;

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  urlPatterns: string[];
}

interface TabState {
  url: string;
  lastChecked: number;
}

class BackgroundManager {
  private tabStates: Map<number, TabState> = new Map();
  private updateInterval: number | null = null;

  constructor() {
    this.initWebNavigationListeners();
    this.initTabsListeners();
    this.initMessageListener();

    console.log('[Hikka Forge] Background script initialized');
  }

  private initWebNavigationListeners(): void {
    chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
      if (details.frameId === 0 && details.url.startsWith('https://hikka.io/')) {
        this.handleUrlChange(details.tabId, details.url);
      }
    });

    chrome.webNavigation.onCompleted.addListener(details => {
      if (details.frameId === 0 && details.url.startsWith('https://hikka.io/')) {
        this.handleUrlChange(details.tabId, details.url);
      }
    });
  }

  private initTabsListeners(): void {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if ((changeInfo.status === 'complete' || changeInfo.url) &&
          tab.url && tab.url.startsWith('https://hikka.io/')) {
        this.handleUrlChange(tabId, tab.url);
      }
    });

    chrome.tabs.onRemoved.addListener(tabId => {
      this.tabStates.delete(tabId);
    });
  }

  private initMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      if (message.type === 'GET_MODULE_INFO') {
        this.getModulesInfo(sender.tab?.id)
          .then(modules => {
            sendResponse({ success: true, modules });
          })
          .catch(error => {
            sendResponse({ success: false, error: String(error) });
          });
        return true;
      }

      if (message.type === 'MODULE_ACTION') {
        this.handleModuleAction(message as ModuleAction, sendResponse);
        return true;
      }

      return false;
    });
  }

  private handleUrlChange(tabId: number, url: string): void {
    const now = Date.now();

    const tabState = this.tabStates.get(tabId);
    if (tabState && tabState.url === url && now - tabState.lastChecked < 1000) {
      return;
    }

    this.tabStates.set(tabId, { url, lastChecked: now });

    chrome.tabs.sendMessage(tabId, {
      type: 'URL_CHANGED',
      url
    }).catch(error => {
      if (!error.message.includes('Could not establish connection')) {
        console.error('[Hikka Forge] Error sending URL:', error);
      }
    });
  }

  private async getModulesInfo(tabId?: number): Promise<ModuleInfo[]> {
    if (!tabId) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        return [];
      }
      tabId = tabs[0].id;
    }

    if (!tabId) return [];

    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_MODULE_INFO' });
      if (response && response.success && Array.isArray(response.modules)) {
        return response.modules;
      }
      return [];
    } catch (error) {
      console.error('[Hikka Forge] Error getting module info:', error);
      return [];
    }
  }

  private handleModuleAction(message: ModuleAction, sendResponse: (response?: any) => void): void {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]?.id) {
        sendResponse({ success: false, error: 'Active tab not found' });
        return;
      }

      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, message);
        sendResponse(response);

        if (message.action === 'TOGGLE' && message.moduleId && message.enabled !== undefined) {
          this.syncModuleState(message.moduleId, message.enabled);
        }
      } catch (error) {
        sendResponse({ success: false, error: String(error) });
      }
    });
  }

  private async syncModuleState(moduleId: string, enabled: boolean): Promise<void> {
    try {
      await chrome.storage.sync.set({ [`module_${moduleId}`]: enabled });

      const tabs = await chrome.tabs.query({ url: 'https://hikka.io/*' });
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SYNC_MODULES',
            settings: { [`module_${moduleId}`]: enabled }
          }).catch(error => {
            if (!error.message.includes('Could not establish connection')) {
              console.error('[Hikka Forge] Error syncing with tab:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('[Hikka Forge] Error during module synchronization:', error);
    }
  }

  async getAllActiveModules(): Promise<Record<string, ModuleInfo[]>> {
    const result: Record<string, ModuleInfo[]> = {};

    try {
      const tabs = await chrome.tabs.query({ url: 'https://hikka.io/*' });

      for (const tab of tabs) {
        if (tab.id && tab.url) {
          try {
            const modules = await this.getModulesInfo(tab.id);
            result[tab.url] = modules;
          } catch (error) {
            console.error(`[Hikka Forge] Error getting modules for ${tab.url}:`, error);
            result[tab.url] = [];
          }
        }
      }
    } catch (error) {
      console.error('[Hikka Forge] Error getting all active modules:', error);
    }

    return result;
  }

  async checkModulesHealth(): Promise<void> {
    try {
      const settings = await chrome.storage.sync.get(null);

      const tabs = await chrome.tabs.query({ url: 'https://hikka.io/*' });

      if (tabs.length > 0) {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'SYNC_MODULES',
              settings
            }).catch(() => {
              // Ignore connection errors
            });
          }
        }
      }
    } catch (error) {
      console.error('[Hikka Forge] Error checking module health:', error);
    }
  }

  startHealthCheck(intervalMs: number = 30000): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.checkModulesHealth();
    }, intervalMs) as unknown as number;
  }

  stopHealthCheck(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

const backgroundManager = new BackgroundManager();

backgroundManager.startHealthCheck();

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('[Hikka Forge] Extension installed');

    chrome.storage.sync.set({
      'module_anime-module': true,
      'module_manga-module': true
    }).catch(error => {
      console.error('[Hikka Forge] Error setting initial settings:', error);
    });
  } else if (details.reason === 'update') {
    console.log(`[Hikka Forge] Extension updated from version ${details.previousVersion}`);

    setTimeout(() => {
      backgroundManager.checkModulesHealth();
    }, 5000);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ALL_ACTIVE_MODULES') {
    backgroundManager.getAllActiveModules()
      .then(modules => {
        sendResponse({ success: true, modules });
      })
      .catch(error => {
        sendResponse({ success: false, error: String(error) });
      });
    return true;
  }

  return false;
});