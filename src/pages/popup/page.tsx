import { getConsoleLoggingEnabled, logger, setConsoleLoggingEnabled } from "@/utils/logger";
import { useEffect, useState, useCallback, useRef } from "react";
import browser from "webextension-polyfill";
import logo from "@/assets/logo.svg";

import { Button } from "@/components/ui/button";
import { ModuleList } from "@/components/ui/module-list";
import { UserMenu } from "@/components/ui/auth/user-menu";
import { useAuth } from "@/contexts/AuthContext";

import type {
	ModuleInfo,
	PopupMessage,
	GetModulesResponse,
	SimpleActionResponse,
	ModuleSettings,
	ModuleSettingValue,
} from "@/types/module";
import { GITHUB_REPO, HIKKA_BASE, POLICY_PAGE } from "@/constants";

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function App() {
	const [modules, setModules] = useState<ModuleInfo[]>([]);
	const [moduleSettings, setModuleSettings] = useState<
		Record<string, ModuleSettings>
	>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set()
	);
	const [hasPermission, setHasPermission] = useState(true);
	const [consoleLoggingEnabled, setConsoleLoggingEnabledState] = useState(false);

	const [version, setVersion] = useState('');

	const { isAuthenticated } = useAuth();

	const settingUpdateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

	const loadModules = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		logger.log("Popup: Requesting module definitions...");
		try {
			const message: PopupMessage = { type: "GET_MODULE_DEFINITIONS" };
			const response = (await browser.runtime.sendMessage(
				message
			)) as GetModulesResponse;
			logger.log("Popup: Received response:", response);
			if (response?.success && Array.isArray(response.modules)) {
				const visibleModules = response.modules.filter(module => !module.hidden);
				setModules(visibleModules);
				if ("moduleSettings" in response) {
					setModuleSettings(response.moduleSettings || {});
				}
			} else {
				const errorMessage =
					response?.error || "Unknown error loading modules.";
				setError("Failed to load module settings. " + errorMessage);
				logger.error("Popup: Error loading modules -", errorMessage);
			}
		} catch (err: unknown) {
			setError(`Error communicating with background script: ${getErrorMessage(err)}`);
			logger.error("Popup: Error sending message -", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const checkPermissions = useCallback(async () => {
		const has = await browser.permissions.contains({
			origins: ["https://dev.hikka.io/*"],
		});
		setHasPermission(has);
		if (has) {
			loadModules();
		} else {
			setIsLoading(false);
		}
	}, [loadModules]);

	useEffect(() => {
		const timers = settingUpdateTimers.current;
		checkPermissions();
		void getConsoleLoggingEnabled().then(setConsoleLoggingEnabledState);

		const manifest = browser.runtime.getManifest();
		setVersion(manifest.version);

		return () => {
			for (const timerId in timers) {
				clearTimeout(timers[timerId]);
			}
		};
	}, [checkPermissions]);

	const handleConsoleLoggingChange = useCallback(async (value: boolean) => {
		setConsoleLoggingEnabledState(value);
		try {
			await setConsoleLoggingEnabled(value);
		} catch (err: unknown) {
			setConsoleLoggingEnabledState(!value);
			setError(`Failed to update debug logging: ${getErrorMessage(err)}`);
		}
	}, []);

	const handleRequestPermission = useCallback(async () => {
		const granted = await browser.permissions.request({
			origins: ["https://dev.hikka.io/*"],
		});
		if (granted) {
			setHasPermission(true);
			window.location.reload();
		}
	}, []);

	const handleToggleChange = useCallback(
		async (moduleId: string, enabled: boolean) => {
			const module = modules.find(m => m.id === moduleId);

			// Check if module requires auth and user is not authenticated
			if (module?.authRequired && !isAuthenticated) {
				logger.log(`Popup: Module ${moduleId} requires authentication`);
				return;
			}

			logger.log(`Popup: Toggling ${moduleId} to ${enabled}`);
			setModules((prevModules) =>
				prevModules.map((mod) =>
					mod.id === moduleId ? { ...mod, enabled } : mod
				)
			);
			try {
				const message: PopupMessage = {
					type: "MODULE_ACTION",
					action: "TOGGLE",
					moduleId,
					enabled,
				};
				const response = (await browser.runtime.sendMessage(
					message
				)) as SimpleActionResponse;
				if (!response?.success) {
					const errorMessage = response?.error || "Unknown toggle error.";
					logger.error(
						`Popup: Failed to toggle module ${moduleId} -`,
						errorMessage
					);
					setError(`Failed to save setting for ${moduleId}. ${errorMessage}`);
					loadModules();
				} else {
					logger.log(`Popup: Module ${moduleId} toggled successfully.`);
					setError(null);
				}
			} catch (err: unknown) {
				logger.error("Popup: Error sending toggle message -", err);
				setError(`Error saving setting: ${getErrorMessage(err)}`);
				loadModules();
			}
		},
		[loadModules, isAuthenticated, modules]
	);

	const handleSettingChange = useCallback(
		(moduleId: string, settingId: string, value: ModuleSettingValue) => {
			setModuleSettings((prev) => ({
				...prev,
				[moduleId]: {
					...prev[moduleId],
					[settingId]: value,
				},
			}));

			const timerKey = `${moduleId}-${settingId}`;

			if (settingUpdateTimers.current[timerKey]) {
				clearTimeout(settingUpdateTimers.current[timerKey]);
			}

			settingUpdateTimers.current[timerKey] = setTimeout(async () => {
				logger.log(
					`Popup: Sending debounced update for setting ${settingId} of module ${moduleId} to:`,
					value
				);
				try {
					const message: PopupMessage = {
						type: "MODULE_ACTION",
						action: "UPDATE_SETTING",
						moduleId,
						settingId,
						value,
					};
					const response = (await browser.runtime.sendMessage(
						message
					)) as SimpleActionResponse;
					if (!response?.success) {
						const errorMessage =
							response?.error || "Unknown setting update error.";
						logger.error(
							`Popup: Failed to update setting ${settingId} for module ${moduleId} -`,
							errorMessage
						);
						setError(`Failed to save setting. ${errorMessage}`);
						loadModules();
					} else {
						logger.log(
							`Popup: Setting ${settingId} for module ${moduleId} updated successfully.`
						);
						setError(null);
					}
				} catch (err: unknown) {
					logger.error("Popup: Error sending setting update message -", err);
					setError(`Error saving setting: ${getErrorMessage(err)}`);
					loadModules();
				} finally {
					delete settingUpdateTimers.current[timerKey];
				}
			}, 300);
		},
		[loadModules]
	);

	const handleRefresh = useCallback(async () => {
		logger.log("Popup: Requesting content refresh...");
		try {
			const message: PopupMessage = {
				type: "MODULE_ACTION",
				action: "REFRESH",
			};
			const response = (await browser.runtime.sendMessage(
				message
			)) as SimpleActionResponse;
			if (!response?.success) {
				const errorMessage = response?.error || "Unknown refresh error.";
				logger.error("Popup: Failed to trigger refresh -", errorMessage);
				setError("Failed to refresh content. " + errorMessage);
			} else {
				logger.log("Popup: Refresh triggered successfully.");
				setError(null);

				loadModules();
			}
		} catch (err: unknown) {
			logger.error("Popup: Error sending refresh message -", err);
			setError(`Error triggering refresh: ${getErrorMessage(err)}`);
		}
	}, [loadModules]);

	const handleResetSettings = useCallback(
		async (moduleId: string) => {
			logger.log(`Popup: Resetting settings for module ${moduleId}`);
			const moduleDef = modules.find((m) => m.id === moduleId);
			if (!moduleDef || !moduleDef.settings) {
				logger.warn(
					`Popup: Module ${moduleId} not found or has no settings to reset.`
				);
				return;
			}

			const newModuleSettings: ModuleSettings = {};
			const promises: Promise<SimpleActionResponse>[] = [];

			moduleDef.settings.forEach((setting) => {
				const defaultValue = setting.defaultValue;
				newModuleSettings[setting.id] = defaultValue;

				const timerKey = `${moduleId}-${setting.id}`;
				if (settingUpdateTimers.current[timerKey]) {
					clearTimeout(settingUpdateTimers.current[timerKey]);
					delete settingUpdateTimers.current[timerKey];
				}

				promises.push(
					browser.runtime.sendMessage({
						type: "MODULE_ACTION",
						action: "UPDATE_SETTING",
						moduleId,
						settingId: setting.id,
						value: defaultValue,
					} as PopupMessage)
				);
			});

			setModuleSettings((prev) => ({
				...prev,
				[moduleId]: newModuleSettings,
			}));

			try {
				await Promise.all(promises);
				logger.log(`Popup: All settings for ${moduleId} reset in storage.`);
				setError(null);

				await handleRefresh();
				logger.log(
					`Popup: Refresh triggered after settings reset for ${moduleId}.`
				);
			} catch (err: unknown) {
				logger.error(`Popup: Error resetting settings for ${moduleId}:`, err);
				setError(
					`Failed to reset settings for ${moduleDef.name}. ${getErrorMessage(err)}`
				);

				loadModules();
			}
		},
		[modules, handleRefresh, loadModules]
	);

	const toggleModuleExpansion = useCallback((moduleId: string) => {
		setExpandedModules((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(moduleId)) {
				newSet.delete(moduleId);
			} else {
				newSet.add(moduleId);
			}
			return newSet;
		});
	}, []);

	if (!hasPermission && !isLoading) {
		return (
			<div className="flex w-full flex-col gap-4 bg-background p-4 text-foreground">
				<h1 className="font-bold text-xl">Потрібен дозвіл</h1>
				<p className="text-sm text-muted-foreground">
					Hikka Forge потрібен дозвіл для роботи на сайті dev.hikka.io.
				</p>
				<Button variant={"default"} onClick={handleRequestPermission}>
					Надати дозвіл
				</Button>
			</div>
		);
	}

	return (
		<div className="relative flex w-full flex-col gap-6 overflow-hidden bg-background p-4 text-foreground">
			<div className="flex justify-between items-center flex-grow-0 flex-shrink-0 relative gap-4">
				<div className="flex items-center gap-3">
					<img src={logo} alt="Logo" className="size-7" />
					<h1 className="font-bold text-xl">Hikka Forge</h1>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant={consoleLoggingEnabled ? "default" : "outline"}
						size="icon-sm"
						className={consoleLoggingEnabled ? "text-primary-foreground hover:text-primary-foreground" : "text-muted-foreground"}
						onClick={() => handleConsoleLoggingChange(!consoleLoggingEnabled)}
						aria-pressed={consoleLoggingEnabled}
						aria-label="Увімкнути або вимкнути debug у консолі"
						title="Увімкнути або вимкнути вивід debug у консолі"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m8 9 3 3-3 3M13 15h3" />
							<rect width="20" height="14" x="2" y="5" rx="2" />
						</svg>
					</Button>

					<Button
						variant="outline"
						size="icon-sm"
						className="text-muted-foreground"
						onClick={handleRefresh}
						title="Оновити активні модулі"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
						</svg>
					</Button>

					<UserMenu />
				</div>
			</div>

			{error && (
				<div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md">
					Помилка: {error}
				</div>
			)}

			<div className="flex flex-col gap-4">
				<ModuleList
					modules={modules}
					moduleSettings={moduleSettings}
					isLoading={isLoading}
					error={error}
					expandedModules={expandedModules}
					handleToggleChange={handleToggleChange}
					handleSettingChange={handleSettingChange}
					handleResetSettings={handleResetSettings}
					toggleModuleExpansion={toggleModuleExpansion}
					isAuthenticated={isAuthenticated}
				/>
			</div>

			<footer className="mt-2 pt-4 px-2 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
				<a href={`${GITHUB_REPO}/releases`} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-foreground transition-colors">
					v{version}
				</a>
				<div className="flex items-center gap-4">
					<a href={POLICY_PAGE} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-foreground transition-colors">
						Policy
					</a>
					<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-foreground transition-colors">
						GitHub
					</a>
					<a href={`${HIKKA_BASE}/articles?page=1&tags=forge&author=Lorg0n`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-medium">
						Hikka
					</a>
				</div>
			</footer>
		</div>
	);
}

export default App;
