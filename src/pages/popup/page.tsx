import React, { useEffect, useState, useCallback, useRef } from "react";
import browser from "webextension-polyfill";
import logo from "@/assets/logo.svg";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

import type {
	ModuleInfo,
	PopupMessage,
	GetModulesResponse,
	SimpleActionResponse,
	ModuleSetting,
} from "@/types/module";
import { useForm } from "react-hook-form";

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

	const form = useForm();

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

	const handleToggleChange = async (moduleId: string, enabled: boolean) => {
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
	};

	const handleSettingChange = (
		moduleId: string,
		settingId: string,
		value: any
	) => {
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
	};

	const handleRefresh = async () => {
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
	};

	const handleResetSettings = async (moduleId: string) => {
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
	};

	const toggleModuleExpansion = (moduleId: string) => {
		setExpandedModules((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(moduleId)) {
				newSet.delete(moduleId);
			} else {
				newSet.add(moduleId);
			}
			return newSet;
		});
	};

	const renderSetting = (moduleId: string, setting: ModuleSetting) => {
		const currentValue =
			moduleSettings[moduleId]?.[setting.id] ?? setting.defaultValue;

		switch (setting.type) {
			case "slider":
				return (
					<FormItem key={setting.id} className="space-y-1">
						<div className="flex flex-col gap-0">
							<FormLabel className="text-sm font-medium">
								{setting.label}
							</FormLabel>
							{setting.description && (
								<FormDescription className="text-xs">
									{setting.description}
								</FormDescription>
							)}
						</div>
						<div className="flex items-center gap-3">
							<Slider
								value={[currentValue]}
								onValueChange={([value]) =>
									handleSettingChange(moduleId, setting.id, value)
								}
								min={setting.min}
								max={setting.max}
								step={setting.step || 1}
								className="flex-1"
							/>
							<span className="text-sm min-w-[3rem] text-right">
								{currentValue}
								{setting.unit || ""}
							</span>
						</div>
					</FormItem>
				);

			case "colorPicker":
				return (
					<FormItem key={setting.id} className="space-y-1">
						<div className="flex flex-col gap-0">
							<FormLabel className="text-sm font-medium">
								{setting.label}
							</FormLabel>
							{setting.description && (
								<FormDescription className="text-xs">
									{setting.description}
								</FormDescription>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Input
								type="color"
								value={currentValue}
								onChange={(e) =>
									handleSettingChange(moduleId, setting.id, e.target.value)
								}
								className="w-12 h-8 p-1 rounded border"
							/>
							<Input
								type="text"
								value={currentValue}
								onChange={(e) =>
									handleSettingChange(moduleId, setting.id, e.target.value)
								}
								className="flex-1 text-sm"
								placeholder="#000000"
							/>
						</div>
					</FormItem>
				);

			case "toggle":
				return (
					<FormItem
						key={setting.id}
						className="flex flex-row items-center justify-between space-y-0 py-2"
					>
						<div className="flex flex-col gap-0">
							<FormLabel className="text-sm font-medium">
								{setting.label}
							</FormLabel>
							{setting.description && (
								<FormDescription className="text-xs">
									{setting.description}
								</FormDescription>
							)}
						</div>
						<Switch
							checked={currentValue}
							onCheckedChange={(checked) =>
								handleSettingChange(moduleId, setting.id, checked)
							}
						/>
					</FormItem>
				);

			case "select":
				return (
					<FormItem key={setting.id} className="space-y-1">
						<div className="flex flex-col gap-0">
							<FormLabel className="text-sm font-medium">
								{setting.label}
							</FormLabel>
							{setting.description && (
								<FormDescription className="text-xs">
									{setting.description}
								</FormDescription>
							)}
						</div>
						<Select
							value={currentValue}
							onValueChange={(value) =>
								handleSettingChange(moduleId, setting.id, value)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{setting.options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormItem>
				);

			case "text":
				return (
					<FormItem key={setting.id} className="space-y-1">
						<div className="flex flex-col gap-0">
							<FormLabel className="text-sm font-medium">
								{setting.label}
							</FormLabel>
							{setting.description && (
								<FormDescription className="text-xs">
									{setting.description}
								</FormDescription>
							)}
						</div>
						<Input
							type="text"
							value={currentValue}
							onChange={(e) =>
								handleSettingChange(moduleId, setting.id, e.target.value)
							}
							placeholder={setting.placeholder}
							className="w-full"
						/>
					</FormItem>
				);

			default:
				return null;
		}
	};

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
				{isLoading ? (
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="flex flex-row items-center justify-between p-1"
							>
								<div className="space-y-1">
									<Skeleton className="h-5 w-28" />
									<Skeleton className="h-3 w-48" />
								</div>
								<Skeleton className="h-5 w-10 rounded-full" />
							</div>
						))}
					</div>
				) : modules.length === 0 && !error ? (
					<p className="text-muted-foreground text-center py-4">
						No modules found or Hikka tab not active.
					</p>
				) : (
					<Form {...form}>
						<div className="space-y-1">
							{modules.map((moduleInfo) => (
								<div key={moduleInfo.id}>
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm hover:bg-accent/50 transition-colors">
										<div className="space-y-0.5 mr-4 flex-1">
											<FormLabel className="text-base">
												{moduleInfo.name}
											</FormLabel>
											<FormDescription>
												{moduleInfo.description}
											</FormDescription>
										</div>
										<div className="flex items-center gap-2">
											{moduleInfo.settings &&
												moduleInfo.settings.length > 0 && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => toggleModuleExpansion(moduleInfo.id)}
														className="p-1 h-6 w-6"
													>
														<ChevronDown
															className={`h-4 w-4 transition-transform ${
																expandedModules.has(moduleInfo.id)
																	? "rotate-180"
																	: ""
															}`}
														/>
													</Button>
												)}
											<FormControl>
												<Switch
													checked={moduleInfo.enabled}
													onCheckedChange={(checked) =>
														handleToggleChange(moduleInfo.id, checked)
													}
													aria-label={`Toggle ${moduleInfo.name}`}
												/>
											</FormControl>
										</div>
									</FormItem>

									{moduleInfo.settings && moduleInfo.settings.length > 0 && (
										<Collapsible
											open={expandedModules.has(moduleInfo.id)}
											onOpenChange={() => toggleModuleExpansion(moduleInfo.id)}
										>
											<CollapsibleContent className="border-l border-r border-b rounded-b-lg p-4 space-y-6 bg-muted/30">
												{moduleInfo.settings.map((setting) =>
													renderSetting(moduleInfo.id, setting)
												)}

												<div className="pt-4 border-t border-border mt-4">
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleResetSettings(moduleInfo.id)}
														className="w-full"
													>
														Скинути налаштування
													</Button>
												</div>
											</CollapsibleContent>
										</Collapsible>
									)}
								</div>
							))}
						</div>
					</Form>
				)}
			</div>
		</div>
	);
}

export default App;
