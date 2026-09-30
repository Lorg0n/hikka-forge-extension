import { Button } from "@/components/ui/button";
import type { ModuleSetting, ModuleSettings, ModuleSettingValue, ThematicScheduleInfo } from "@/types/module";
import { SettingInput } from "./setting-input";
import { ThematicScheduleSettings } from "./thematic-schedule-settings";

interface ModuleSettingsSectionProps {
	moduleId: string;
	settings: ModuleSetting[];
	currentModuleSettings: ModuleSettings;
	onSettingChange: (moduleId: string, settingId: string, value: ModuleSettingValue) => void;
	onResetSettings: (moduleId: string) => void;
	thematicSchedule?: ThematicScheduleInfo;
	moduleEnabled: boolean;
}

export function ModuleSettingsSection({
	moduleId,
	settings,
	currentModuleSettings,
	onSettingChange,
	onResetSettings,
	thematicSchedule,
	moduleEnabled,
}: ModuleSettingsSectionProps) {
	const thematicSettingIds = new Set(
		thematicSchedule
			? [
					thematicSchedule.manualSelectionSettingId,
					...thematicSchedule.items.map((item) => item.calendarEnabledSettingId),
				]
			: [],
	);
	const regularSettings = settings.filter((setting) => !thematicSettingIds.has(setting.id));

	return (
		<>
			{thematicSchedule && (
				<ThematicScheduleSettings
					moduleId={moduleId}
					config={thematicSchedule}
					currentModuleSettings={currentModuleSettings}
					onSettingChange={onSettingChange}
					moduleEnabled={moduleEnabled}
				/>
			)}
			{regularSettings.map((setting) => (
				<SettingInput
					key={setting.id}
					moduleId={moduleId}
					setting={setting}
					currentValue={
						currentModuleSettings[setting.id] ?? setting.defaultValue
					}
					onValueChange={onSettingChange}
				/>
			))}

			<div className="pt-4 border-t border-border mt-4">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onResetSettings(moduleId)}
					className="w-full"
				>
					Скинути налаштування
				</Button>
			</div>
		</>
	);
}
