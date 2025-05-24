import { useEffect, useState, useCallback, useRef } from "react";
import browser from "webextension-polyfill";
import logo from "@/assets/logo.svg";

import { Button } from "@/components/ui/button";
import { ModuleList } from "@/components/ui/module-list"; // Import the new component

import type {
	ModuleInfo,
	PopupMessage,
	GetModulesResponse,
	SimpleActionResponse
} from "@/types/module";

function App() {
	const [modules, setModules] = useState<ModuleInfo[]>([]);
	const [moduleSettings, setModuleSettings] = useState<
		Record<string, Record<string, any>>
	>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedModules, setExpandedModules] = useState<Set<string>>(
		new Set()
	);

	const settingUpdateTimers = useRef<Record<string, NodeJS.Timeout>>({});

	const loadModules = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		console.log("Popup: Requesting module definitions...");
		try {
			const message: PopupMessage = { type: "GET_MODULE_DEFINITIONS" };
			const response = (await browser.runtime.sendMessage(
				message
			)) as GetModulesResponse;
			console.log("Popup: Received response:", response);
			if (response?.success && Array.isArray(response.modules)) {
				setModules(response.modules);
				if ("moduleSettings" in response) {
					setModuleSettings(response.moduleSettings || {});
				}
			} else {
				const errorMessage =
					response?.error || "Unknown error loading modules.";
				setError("Failed to load module settings. " + errorMessage);
				console.error("Popup: Error loading modules -", errorMessage);
			}
		} catch (err: any) {
			setError(`Error communicating with background script: ${err.message}`);
			console.error("Popup: Error sending message -", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadModules();

		return () => {
			for (const timerId in settingUpdateTimers.current) {
				clearTimeout(settingUpdateTimers.current[timerId]);
			}
		};
	}, [loadModules]);

	const handleToggleChange = useCallback(
		async (moduleId: string, enabled: boolean) => {
			console.log(`Popup: Toggling ${moduleId} to ${enabled}`);
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
					console.error(
						`Popup: Failed to toggle module ${moduleId} -`,
						errorMessage
					);
					setError(`Failed to save setting for ${moduleId}. ${errorMessage}`);
					loadModules();
				} else {
					console.log(`Popup: Module ${moduleId} toggled successfully.`);
					setError(null);
				}
			} catch (err: any) {
				console.error("Popup: Error sending toggle message -", err);
				setError(`Error saving setting: ${err.message}`);
				loadModules();
			}
		},
		[loadModules]
	);

	const handleSettingChange = useCallback(
		(moduleId: string, settingId: string, value: any) => {
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
				console.log(
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
						console.error(
							`Popup: Failed to update setting ${settingId} for module ${moduleId} -`,
							errorMessage
						);
						setError(`Failed to save setting. ${errorMessage}`);
						loadModules();
					} else {
						console.log(
							`Popup: Setting ${settingId} for module ${moduleId} updated successfully.`
						);
						setError(null);
					}
				} catch (err: any) {
					console.error("Popup: Error sending setting update message -", err);
					setError(`Error saving setting: ${err.message}`);
					loadModules();
				} finally {
					delete settingUpdateTimers.current[timerKey];
				}
			}, 300);
		},
		[loadModules]
	);

	const handleRefresh = useCallback(async () => {
		console.log("Popup: Requesting content refresh...");
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
				console.error("Popup: Failed to trigger refresh -", errorMessage);
				setError("Failed to refresh content. " + errorMessage);
			} else {
				console.log("Popup: Refresh triggered successfully.");
				setError(null);

				loadModules();
			}
		} catch (err: any) {
			console.error("Popup: Error sending refresh message -", err);
			setError(`Error triggering refresh: ${err.message}`);
		}
	}, [loadModules]);

	const handleResetSettings = useCallback(
		async (moduleId: string) => {
			console.log(`Popup: Resetting settings for module ${moduleId}`);
			const moduleDef = modules.find((m) => m.id === moduleId);
			if (!moduleDef || !moduleDef.settings) {
				console.warn(
					`Popup: Module ${moduleId} not found or has no settings to reset.`
				);
				return;
			}

			const newModuleSettings: Record<string, any> = {};
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
				console.log(`Popup: All settings for ${moduleId} reset in storage.`);
				setError(null);

				await handleRefresh();
				console.log(
					`Popup: Refresh triggered after settings reset for ${moduleId}.`
				);
			} catch (err: any) {
				console.error(`Popup: Error resetting settings for ${moduleId}:`, err);
				setError(
					`Failed to reset settings for ${moduleDef.name}. ${err.message}`
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

	return (
		<div className="flex flex-col min-w-[350px] max-w-[450px] relative overflow-hidden p-4 gap-6 bg-background text-foreground">
			<div className="flex justify-between items-center flex-grow-0 flex-shrink-0 relative gap-4">
				<div className="flex items-center gap-3">
					<img src={logo} alt="Logo" className="size-7" />
					<h1 className="font-bold text-xl">Hikka Forge</h1>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleRefresh}
					title="Refresh active modules on page"
				>
					Refresh Content
				</Button>
			</div>

			{error && (
				<div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md">
					Error: {error}
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
				/>
			</div>
		</div>
	);
}

export default App;