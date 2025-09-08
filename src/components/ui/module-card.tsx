import {
	FormItem,
	FormLabel,
	FormDescription,
	FormControl,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { ModuleInfo } from "@/types/module";
import { ModuleSettingsSection } from "./module-settings-section";
import { Badge } from "@/components/ui/badge";

interface ModuleCardProps {
	moduleInfo: ModuleInfo;
	currentModuleSettings: Record<string, any>;
	isExpanded: boolean;
	onToggle: (moduleId: string, enabled: boolean) => void;
	onSettingChange: (moduleId: string, settingId: string, value: any) => void;
	onResetSettings: (moduleId: string) => void;
	onToggleExpansion: (moduleId: string) => void;
}

export function ModuleCard({
	moduleInfo,
	currentModuleSettings,
	isExpanded,
	onToggle,
	onSettingChange,
	onResetSettings,
	onToggleExpansion,
}: ModuleCardProps) {
	const hasSettings = moduleInfo.settings && moduleInfo.settings.length > 0;
	
	// Check if module name contains "(Beta)" to show badge
	const isBetaModule = moduleInfo.name.includes('(Beta)');
	const displayName = moduleInfo.name.replace(' (Beta)', '');

	return (
		<div>
			<FormItem
				className={`flex flex-row items-center justify-between p-3 shadow-sm hover:bg-accent/50 transition-colors 
					${
						isExpanded && hasSettings
							? "border-l border-r border-t rounded-t-lg rounded-bl-none rounded-br-none"
							: "border rounded-lg"
					}`}
			>
				<div className="space-y-0.5 mr-4 flex-1">
					<div className="flex items-center gap-2">
						<FormLabel className="text-base">{displayName}</FormLabel>
						{isBetaModule && (
							<Badge variant="secondary" className="text-xs">
								Beta
							</Badge>
						)}
					</div>
					<FormDescription>{moduleInfo.description}</FormDescription>
				</div>
				<div className="flex items-center gap-2">
					{hasSettings && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onToggleExpansion(moduleInfo.id)}
							className="p-1 h-6 w-6"
						>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${
									isExpanded ? "rotate-180" : ""
								}`}
							/>
						</Button>
					)}
					<FormControl>
						<Switch
							checked={moduleInfo.enabled}
							onCheckedChange={(checked) => onToggle(moduleInfo.id, checked)}
							aria-label={`Toggle ${moduleInfo.name}`}
						/>
					</FormControl>
				</div>
			</FormItem>

			{hasSettings && (
				<Collapsible
					open={isExpanded}
					onOpenChange={() => onToggleExpansion(moduleInfo.id)}
				>
					<CollapsibleContent className="border-l border-r border-b rounded-b-lg p-4 space-y-6 bg-muted/30">
						<ModuleSettingsSection
							moduleId={moduleInfo.id}
							settings={moduleInfo.settings!}
							currentModuleSettings={currentModuleSettings}
							onSettingChange={onSettingChange}
							onResetSettings={onResetSettings}
						/>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
}
