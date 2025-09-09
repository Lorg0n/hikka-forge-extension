import type {
	BackgroundMessage,
	ModuleInfo,
	ContentMessage,
} from "./types/module";
import { pipeline, env } from '@huggingface/transformers';

if (import.meta.env.BROWSER === "firefox" && env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("assets/");
  console.log("[Hikka Forge] Browser: Firefox")
}

// Singleton to hold the pipeline instance
class EmbeddingPipeline {
	static task = 'feature-extraction' as const; // Simpler type declaration
	static model = 'Lorg0n/hikka-forge-paraphrase-multilingual-MiniLM-L12-v2';
	static instance: any = null; // Use simpler type to avoid complex union issues

	static async getInstance() {
		if (this.instance === null) {
			console.log("Loading model in background service worker...");
			// Now, TypeScript correctly infers the return type without creating a huge union.
			this.instance = await pipeline(this.task, this.model, {
				dtype: "fp32", // or "fp16"
				device: "webgpu", // enable WebGPU acceleration
			});
			console.log("Model loaded successfully.");
		}
		return this.instance;
	}
}

// Pre-load the model when the extension starts
EmbeddingPipeline.getInstance();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface ModuleCache {
  definitions: ModuleInfo[];
  timestamp: number;
}

class BackgroundManager {
	private tabStates: Map<number, { url: string; lastChecked: number }> = new Map();
	private moduleCache: ModuleCache | null = null;

	constructor() {
		this.initTabsListeners();
		this.initMessageListener();
		this.initInstallAndUpdateListeners();
		console.log("[Hikka Forge] Background script initialized");

		// Initialize cache asynchronously
		this.primeModuleCache().catch(error => {
			console.warn("[Hikka Forge] Failed to prime module cache on startup:", error);
		});
	}

	// private initWebNavigationListeners(): void {
	// 	chrome.webNavigation.onHistoryStateUpdated.addListener(
	// 		(details) => {
	// 			if (
	// 				details.frameId === 0 &&
	// 				details.url.startsWith("https://hikka.io/")
	// 			) {
	// 				this.handleUrlChange(details.tabId, details.url);
	// 			}
	// 		},
	// 		{ url: [{ hostEquals: "hikka.io" }] }
	// 	);

	// 	chrome.webNavigation.onCompleted.addListener(
	// 		(details) => {
	// 			if (
	// 				details.frameId === 0 &&
	// 				details.url.startsWith("https://hikka.io/")
	// 			) {
	// 				this.handleUrlChange(details.tabId, details.url);
	// 			}
	// 		},
	// 		{ url: [{ hostEquals: "hikka.io" }] }
	// 	);
	// }

	private initTabsListeners(): void {
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if (
				changeInfo.status === "complete" &&
				tab.url?.startsWith("https://hikka.io/")
			) {
				this.syncTabIfNeeded(tabId);
			}
		}
		);

		chrome.tabs.onRemoved.addListener((tabId) => {
			this.tabStates.delete(tabId);
		});
	}

	private initInstallAndUpdateListeners(): void {
		chrome.runtime.onInstalled.addListener((details) => {
			if (details.reason === "install") {
				console.log("[Hikka Forge] Extension installed. Default states will be applied on first use.");
			} else if (details.reason === "update") {
			}
			this.moduleCache = null;
		});
	}

	private initMessageListener(): void {
		chrome.runtime.onMessage.addListener(
			(message: BackgroundMessage | any, sender, sendResponse) => {
				let isAsync = false;

				if (message.type === "REGISTER_CONTENT_SCRIPT") {
					console.log(`[Hikka Forge] Content script from tab ${sender.tab?.id} registered with ${message.modules.length} modules.`);
					isAsync = true;
					this.handleContentScriptRegistration(message.modules, sender.tab?.id)
						.then(() => sendResponse({ success: true }))
						.catch(error => {
							console.error("[Hikka Forge] Error handling content script registration:", error);
							sendResponse({ success: false, error: String(error) });
						});
				} else if (message.type === "GET_MODULE_DEFINITIONS") {
					isAsync = true;
					this.getModuleDefinitionsWithState()
						.then((result) =>
							sendResponse({
								success: true,
								modules: result.modules,
								moduleSettings: result.moduleSettings,
							})
						)
						.catch((error) => {
							console.error(
								"[Hikka Forge] Error getting module definitions:",
								error
							);
							sendResponse({ success: false, error: String(error) });
						});
				} else if (message.type === "MODULE_ACTION") {
					if (
						message.action === "TOGGLE" &&
						message.moduleId &&
						typeof message.enabled === "boolean"
					) {
						isAsync = true;
						this.toggleModuleState(message.moduleId, message.enabled)
							.then(() => sendResponse({ success: true }))
							.catch((error) => {
								console.error(
									`[Hikka Forge] Error toggling module ${message.moduleId}:`,
									error
								);
								sendResponse({ success: false, error: String(error) });
							});
					} else if (
						message.action === "UPDATE_SETTING" &&
						message.moduleId &&
						message.settingId
					) {
						isAsync = true;
						this.updateModuleSetting(
							message.moduleId,
							message.settingId,
							message.value
						)
							.then(() => sendResponse({ success: true }))
							.catch((error) => {
								console.error(`[Hikka Forge] Error updating setting:`, error);
								sendResponse({ success: false, error: String(error) });
							});
					} else if (message.action === "REFRESH") {
						isAsync = true;
						this.refreshContentInAllTabs()
							.then(() => sendResponse({ success: true }))
							.catch((error) => {
								console.error("[Hikka Forge] Error refreshing content:", error);
								sendResponse({ success: false, error: String(error) });
							});
					} else {
						console.warn(
							"[Hikka Forge] Unknown MODULE_ACTION received:",
							message
						);
						sendResponse({ success: false, error: "Invalid module action" });
					}
				} else if (message.type === "FETCH_EMBEDDING") {
					isAsync = true;
					const { prompt } = message.payload;

					(async () => {
						try {
							console.log("[Hikka Forge][DEBUG] Starting embedding generation");
							console.log(`[Hikka Forge][DEBUG] Prompt: "${prompt}" (length: ${prompt.length})`);

							const extractor = await EmbeddingPipeline.getInstance();
							console.log(`[Hikka Forge][DEBUG] Extractor type: ${typeof extractor}`);

							// FIX: The pipeline expects an array of strings.
							const modelInput = [prompt];
							console.log("[Hikka Forge][DEBUG] Calling model with input:", modelInput);

							// The extractor function handles tokenization internally
							const embeddings = await extractor(modelInput, { pooling: 'mean', normalize: true });

							console.log("[Hikka Forge][DEBUG] Model execution completed successfully");

							// Convert tensor to JavaScript array and get the embedding for the first (and only) sentence
							const embeddingVector = embeddings[0].tolist();

							console.log(`[Hikka Forge][DEBUG] Generated embedding vector (length: ${embeddingVector.length})`);
							sendResponse({ success: true, embedding: embeddingVector });
						} catch (e: any) {
							console.error("[Hikka Forge] Transformers.js error in background script:");
							console.error("Error object:", e);
							console.error("Error stack:", e.stack);
							// Log the inner details if the error has them
							if (e.message.includes('model execution')) {
								console.error("This often happens due to incorrect input format or memory issues.");
							}
							sendResponse({ success: false, error: e.message });
						}
					})();
					return true; // Keep the message channel open for async response
				}
				return isAsync;
			}
		);
	}

	// private handleUrlChange(tabId: number, url: string): void {
	// 	const now = Date.now();
	// 	const tabState = this.tabStates.get(tabId);

	// 	if (tabState && tabState.url === url && now - tabState.lastChecked < 500) {
	// 		return;
	// 	}

	// 	console.log(`[Hikka Forge] URL change detected for tab ${tabId}: ${url}`);
	// 	this.tabStates.set(tabId, { url, lastChecked: now });

	// 	this.syncTabIfNeeded(tabId);
	// }

	private async toggleModuleState(
		moduleId: string,
		enabled: boolean
	): Promise<void> {
		const storageKey = `module_enabled_${moduleId}`;
		console.log(`[Hikka Forge] Setting ${storageKey} to ${enabled}`);
		try {
			await chrome.storage.sync.set({ [storageKey]: enabled });
			this.invalidateModuleCache();
			await this.syncAllTabs();
		} catch (error: any) {
			console.error(
				`[Hikka Forge] Failed to save state for ${moduleId}:`,
				error
			);
			throw error;
		}
	}

	private async handleContentScriptRegistration(modules: ModuleInfo[], tabId?: number): Promise<void> {
		if (!this.moduleCache || this.moduleCache.definitions.length === 0) {
			console.log("[Hikka Forge] Populating module cache from registration.");
			this.moduleCache = {
				definitions: modules.map(m => ({ ...m, enabled: false, isBeta: m.isBeta })),
				timestamp: Date.now()
			};
		}

		if (tabId) {
			console.log(`[Hikka Forge] Immediately syncing tab ${tabId} after registration.`);
			await this.sendSyncMessageToTab(tabId);
		}
	}

	/**
	 * Invalidates the module cache when needed (e.g., after module changes)
	 */
	private invalidateModuleCache(): void {
		this.moduleCache = null;
		console.log("[Hikka Forge] Module cache invalidated.");
	}

	private async updateModuleSetting(
		moduleId: string,
		settingId: string,
		value: any
	): Promise<void> {
		const storageKey = `module_setting_${moduleId}_${settingId}`;
		console.log(`[Hikka Forge] Setting ${storageKey} to:`, value);
		try {
			await chrome.storage.sync.set({ [storageKey]: value });
			this.invalidateModuleCache();
			await this.syncAllTabs();
		} catch (error: any) {
			console.error(
				`[Hikka Forge] Failed to save setting for ${moduleId}.${settingId}:`,
				error
			);
			throw error;
		}
	}

	private async primeModuleCache(): Promise<void> {
		console.log("[Hikka Forge] Priming module cache...");
		try {
			const definitions = await this.fetchModuleDefinitionsFromContentScript();
			this.moduleCache = {
				definitions,
				timestamp: Date.now()
			};
			console.log("[Hikka Forge] Cache primed successfully.");
		} catch (error) {
			console.warn(
				"[Hikka Forge] Could not prime cache on startup (no active Hikka tabs?):",
				error
			);
		}
	}

	private async getModuleDefinitionsWithState(): Promise<{
		modules: ModuleInfo[];
		moduleSettings: Record<string, Record<string, any>>;
	}> {
		const now = Date.now();
		if (this.moduleCache && now - this.moduleCache.timestamp < CACHE_DURATION) {
			console.log("[Hikka Forge] Returning cached module definitions.");
			return this.updateCachedStatesFromStorage(this.moduleCache.definitions);
		}

		console.log(
			"[Hikka Forge] Cache expired or empty, fetching fresh module definitions..."
		);
		try {
			const definitions = await this.fetchModuleDefinitionsFromContentScript();
			this.moduleCache = {
				definitions,
				timestamp: now
			};

			return this.updateCachedStatesFromStorage(definitions);
		} catch (error) {
			console.error(
				"[Hikka Forge] Failed to fetch fresh definitions, returning empty/stale cache:",
				error
			);
			return this.updateCachedStatesFromStorage(this.moduleCache?.definitions || []);
		}
	}

	private async updateCachedStatesFromStorage(
		definitions: ModuleInfo[]
	): Promise<{
		modules: ModuleInfo[];
		moduleSettings: Record<string, Record<string, any>>;
	}> {
		if (!definitions || definitions.length === 0) {
			return { modules: [], moduleSettings: {} };
		}

		try {
			const allStoredData = await chrome.storage.sync.get(null);
			const moduleSettings: Record<string, Record<string, any>> = {};

			const updatedModules = definitions.map((def) => {
				const enabledKey = `module_enabled_${def.id}`;
				const enabled = allStoredData[enabledKey] ?? def.enabledByDefault ?? false;

				const settings: Record<string, any> = {};
				if (def.settings) {
					def.settings.forEach((setting) => {
						const settingKey = `module_setting_${def.id}_${setting.id}`;
						settings[setting.id] =
							allStoredData[settingKey] ?? setting.defaultValue;
					});
				}
				moduleSettings[def.id] = settings;

				return {
					...def,
					enabled,
					isBeta: def.isBeta,
				};
			});

			return { modules: updatedModules, moduleSettings };
		} catch (error) {
			console.error("[Hikka Forge] Failed to get states from storage:", error);
			return { modules: definitions, moduleSettings: {} };
		}
	}

	private async fetchModuleDefinitionsFromContentScript(): Promise<ModuleInfo[]> {
		try {
			const tabs = await chrome.tabs.query({
				url: "https://hikka.io/*",
				status: "complete",
			});

			if (tabs.length === 0) {
				console.warn(
					"[Hikka Forge] Could not find active Hikka tabs to request module definitions. Waiting for a tab to register itself."
				);
				return [];
			}

			for (const tab of tabs) {
				if (!tab.id) continue;

				try {
					console.log(
						`[Hikka Forge] Requesting module info from tab ${tab.id}`
					);
					const response = await chrome.tabs.sendMessage(tab.id, {
						type: "GET_CONTENT_MODULES_INFO",
					} as ContentMessage);

					if (response?.success && Array.isArray(response.modules)) {
						console.log(
							`[Hikka Forge] Received module info from tab ${tab.id}:`,
							response.modules.length
						);

						return response.modules.map((m: ModuleInfo) => ({
							id: m.id,
							name: m.name,
							description: m.description,
							enabled: false,
							urlPatterns: m.urlPatterns,
							settings: m.settings || [],
							enabledByDefault: m.enabledByDefault,
							isBeta: m.isBeta,
						}));
					} else {
						console.warn(
							`[Hikka Forge] Invalid response from tab ${tab.id}:`,
							response
						);
					}
				} catch (tabError: any) {
					if (
						!tabError.message?.includes("Could not establish connection") &&
						!tabError.message?.includes("Receiving end does not exist")
					) {
						console.warn(
							`[Hikka Forge] Error fetching module info from tab ${tab.id}:`,
							tabError
						);
					}
				}
			}

			console.error(
				"[Hikka Forge] Failed to get module definitions from any active tab. They may still be loading. Waiting for registration."
			);
			return [];
		} catch (error: any) {
			console.error("[Hikka Forge] Error querying tabs:", error);
			return [];
		}
	}

	private async syncTabIfNeeded(tabId: number): Promise<void> {
		if (this.tabStates.has(tabId)) {
			try {
				await this.sendSyncMessageToTab(tabId);
			} catch (error: any) {
				console.warn(`[Hikka Forge] Failed to sync tab ${tabId}:`, error);
			}
		}
	}

	private async syncAllTabs(): Promise<void> {
		console.log("[Hikka Forge] Syncing states with all Hikka tabs...");
		try {
			const tabs = await chrome.tabs.query({ url: "https://hikka.io/*" });
			const syncPromises = tabs
				.filter((tab): tab is chrome.tabs.Tab => tab.id !== undefined)
				.map((tab) => this.sendSyncMessageToTab(tab.id!));

			await Promise.allSettled(syncPromises);
			console.log("[Hikka Forge] Sync attempt completed for all tabs.");
		} catch (error: any) {
			console.error("[Hikka Forge] Error querying tabs for sync:", error);
		}
	}

	private async sendSyncMessageToTab(tabId: number): Promise<void> {
		try {
			const { modules, moduleSettings } = await this.getModuleDefinitionsWithState();
			const enabledStates: Record<string, boolean> = {};
			const flatModuleSettings: Record<string, Record<string, any>> = {};

			modules.forEach((mod) => {
				enabledStates[mod.id] = mod.enabled;
				if (moduleSettings[mod.id]) {
					flatModuleSettings[mod.id] = moduleSettings[mod.id];
				}
			});

			console.log(
				`[Hikka Forge] Sending SYNC_MODULES to tab ${tabId}`,
				enabledStates,
				flatModuleSettings
			);
			await chrome.tabs.sendMessage(tabId, {
				type: "SYNC_MODULES",
				enabledStates: enabledStates,
				moduleSettings: flatModuleSettings,
			} as ContentMessage);
			console.log(
				`[Hikka Forge] SYNC_MODULES sent successfully to tab ${tabId}`
			);
		} catch (error: any) {
			if (
				!error.message?.includes("Could not establish connection") &&
				!error.message?.includes("Receiving end does not exist")
			) {
				console.error(
					`[Hikka Forge] Error sending SYNC_MODULES to tab ${tabId}:`,
					error
				);
			}
		}
	}

	private async refreshContentInAllTabs(): Promise<void> {
		console.log("[Hikka Forge] Sending REFRESH action to all Hikka tabs...");
		try {
			const tabs = await chrome.tabs.query({ url: "https://hikka.io/*" });
			const refreshPromises = tabs
				.filter((tab): tab is chrome.tabs.Tab & { id: number } => tab.id !== undefined)
				.map((tab) =>
					chrome.tabs
						.sendMessage(tab.id, {
							type: "MODULE_ACTION",
							action: "REFRESH",
						} as ContentMessage)
						.catch((err: any) => {
							console.warn(
								`[Hikka Forge] Error sending REFRESH to tab ${tab.id}:`,
								err
							);
						})
				);
			await Promise.allSettled(refreshPromises);
			console.log("[Hikka Forge] REFRESH action sent to all tabs.");
		} catch (error: any) {
			console.error("[Hikka Forge] Error sending REFRESH action:", error);
			throw error;
		}
	}
}

const backgroundManager = new BackgroundManager();
