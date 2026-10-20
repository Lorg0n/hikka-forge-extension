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
import { GITHUB_REPO, getHikkaBaseForUrl, HIKKA_BASE, POLICY_PAGE } from "@/constants";

const REQUIRED_ORIGINS = [
	"https://hikka.io/*",
	"https://dev.hikka.io/*",
	"https://api.hikka.io/*",
	"https://hikka-forge.lorgon.dev/*",
] as const;

const PERMISSION_REQUEST_PENDING_KEY = "permission_request_pending";

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
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [isRequestingPermission, setIsRequestingPermission] = useState(false);
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
		const [has, stored] = await Promise.all([
			browser.permissions.contains({ origins: [...REQUIRED_ORIGINS] }),
			browser.storage.local.get(PERMISSION_REQUEST_PENDING_KEY),
		]);
		setHasPermission(has);
		if (has) {
			setPermissionDenied(false);
			await browser.storage.local.remove(PERMISSION_REQUEST_PENDING_KEY);
			loadModules();
		} else {
			// A popup can be closed while the browser displays its native permission
			// prompt. If it is opened again without the permission, that request was denied.
			setPermissionDenied(Boolean(stored[PERMISSION_REQUEST_PENDING_KEY]));
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
		setIsRequestingPermission(true);
		setPermissionDenied(false);
		// Do not await before request(): browsers require this call to remain in the
		// button's user-gesture handler. The marker also survives if the popup closes
		// while the native browser dialog is displayed.
		const markPermissionRequest = browser.storage.local.set({
			[PERMISSION_REQUEST_PENDING_KEY]: true,
		}).catch((err: unknown) => {
			logger.error("Popup: Could not persist permission request state -", err);
		});

		try {
			const permissionRequest = browser.permissions.request({
				origins: [...REQUIRED_ORIGINS],
			});
			// Leave only the browser-owned permission dialog visible. The pending marker
			// lets the next popup render the denied state if this popup is destroyed.
			window.close();
			const granted = await permissionRequest;
			if (granted) {
				await markPermissionRequest;
				await browser.storage.local.remove(PERMISSION_REQUEST_PENDING_KEY);
				setHasPermission(true);
				loadModules();
				return;
			}

			setPermissionDenied(true);
		} catch (err: unknown) {
			logger.error("Popup: Permission request failed -", err);
			setPermissionDenied(true);
		} finally {
			setIsRequestingPermission(false);
		}
	}, [loadModules]);

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

	const handlePopupAction = useCallback(async (href: string) => {
		try {
			const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
			if (!tab?.id) throw new Error("Active tab was not found.");
			await browser.tabs.update(tab.id, {
				url: new URL(href, getHikkaBaseForUrl(tab.url)).toString(),
			});
			window.close();
		} catch (err: unknown) {
			setError(`Не вдалося відкрити сторінку: ${getErrorMessage(err)}`);
		}
	}, []);

	if (!hasPermission && !isLoading && !permissionDenied) {
		return (
			<div className="flex min-w-0 w-full flex-col gap-4 overflow-hidden bg-background p-3 text-foreground min-[400px]:p-4">
				<div className="flex min-w-0 items-center gap-3">
					<img src={logo} alt="Hikka Forge" className="size-8 shrink-0" />
					<h1 className="truncate font-bold text-xl">Потрібен дозвіл</h1>
				</div>
				{isRequestingPermission ? (
					<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
						<div className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
						<span>Очікуємо відповідь браузера…</span>
					</div>
				) : (
					<p className="text-sm leading-5 text-muted-foreground">
						Hikka Forge потрібен доступ до hikka.io, dev.hikka.io та hikka-forge.lorgon.dev для модулів і авторизації.
					</p>
				)}
				<Button className="w-full" variant="default" disabled={isRequestingPermission} onClick={handleRequestPermission}>
					Надати дозвіл
				</Button>
			</div>
		);
	}

	return (
		<div className="relative flex min-w-0 w-full flex-col gap-6 overflow-hidden bg-background p-3 text-foreground min-[400px]:p-4">
			<div className="relative flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<img src={logo} alt="Logo" className="size-7" />
					<h1 className="truncate font-bold text-xl">Hikka Forge</h1>
				</div>

				<div className="flex shrink-0 items-center gap-1.5">
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

			{permissionDenied && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
					<div className="min-w-0 flex-1">
						<p className="font-medium text-sm text-foreground">Розширення працює в обмеженому режимі</p>
						<p className="mt-1 text-sm leading-5 text-muted-foreground">
							Доступ до hikka.io, dev.hikka.io та hikka-forge.lorgon.dev не надано. Без нього модулі, авторизація та пов’язані функції можуть не працювати.
						</p>
					</div>
					<Button className="w-full shrink-0 min-[400px]:w-auto" variant="default" onClick={handleRequestPermission}>
						Надати дозвіл
					</Button>
				</div>
			)}

			{error && (
				<div className="break-words rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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
					handlePopupAction={handlePopupAction}
				/>
			</div>

			<footer className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border/50 px-2 pt-4 text-xs text-muted-foreground">
				<a href={`${GITHUB_REPO}/releases`} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-foreground transition-colors">
					v{version}
				</a>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
