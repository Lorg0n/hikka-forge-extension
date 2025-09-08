import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModuleInfo } from "@/types/module";
import { useForm } from "react-hook-form"; 
import { ModuleCard } from "@/components/ui/module-card";

interface ModuleListProps {
	modules: ModuleInfo[];
	moduleSettings: Record<string, Record<string, any>>;
	isLoading: boolean;
	error: string | null;
	expandedModules: Set<string>;
	handleToggleChange: (moduleId: string, enabled: boolean) => Promise<void>;
	handleSettingChange: (moduleId: string, settingId: string, value: any) => void;
	handleResetSettings: (moduleId: string) => Promise<void>;
	toggleModuleExpansion: (moduleId: string) => void;
}

export function ModuleList({
	modules,
	moduleSettings,
	isLoading,
	error,
	expandedModules,
	handleToggleChange,
	handleSettingChange,
	handleResetSettings,
	toggleModuleExpansion,
}: ModuleListProps) {
	const form = useForm();

	if (isLoading) {
		return (
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
		);
	}

	if (modules.length === 0 && !error) {
		return (
			<p className="text-muted-foreground text-center py-4">
				No modules found or Hikka tab not active.
			</p>
		);
	}

	return (
		<Form {...form}>
			<div className="space-y-1">
				{modules.map((moduleInfo) => (
					<ModuleCard
						key={moduleInfo.id}
						moduleInfo={moduleInfo}
						currentModuleSettings={moduleSettings[moduleInfo.id] || {}}
						isExpanded={expandedModules.has(moduleInfo.id)}
						onToggle={handleToggleChange}
						onSettingChange={handleSettingChange}
						onResetSettings={handleResetSettings}
						onToggleExpansion={toggleModuleExpansion}
					/>
				))}
			</div>
		</Form>
	);
}
