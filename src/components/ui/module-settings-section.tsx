import { Button } from "@/components/ui/button";
import type { ModuleSetting } from "@/types/module";
import { SettingInput } from "./setting-input";

interface ModuleSettingsSectionProps {
	moduleId: string;
	settings: ModuleSetting[];
	currentModuleSettings: Record<string, any>;
	onSettingChange: (moduleId: string, settingId: string, value: any) => void;
	onResetSettings: (moduleId: string) => void;
}

export function ModuleSettingsSection({
	moduleId,
	settings,
	currentModuleSettings,
	onSettingChange,
	onResetSettings,
}: ModuleSettingsSectionProps) {
	return (
		<>
			{settings.map((setting) => (
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
