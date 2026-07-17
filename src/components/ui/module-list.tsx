import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModuleCategory, ModuleInfo } from "@/types/module";
import { MODULE_CATEGORIES } from "@/constants";
import { useForm } from "react-hook-form"; 
import { ModuleCard } from "./module-card";

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
	isAuthenticated?: boolean;
}

interface ModuleGroup {
	id: ModuleCategory;
	label: string;
	modules: ModuleInfo[];
}

function groupModulesByCategory(modules: ModuleInfo[]): ModuleGroup[] {
	const grouped = new Map<ModuleCategory, ModuleInfo[]>();

	for (const moduleInfo of modules) {
		const category: ModuleCategory =
			moduleInfo.category && moduleInfo.category in MODULE_CATEGORIES
				? moduleInfo.category
				: "other";
		const list = grouped.get(category) ?? [];
		list.push(moduleInfo);
		grouped.set(category, list);
	}

	return (Object.keys(MODULE_CATEGORIES) as ModuleCategory[])
		.filter((category) => grouped.has(category))
		.map((category) => ({
			id: category,
			label: MODULE_CATEGORIES[category],
			modules: grouped.get(category)!,
		}));
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
	isAuthenticated = false,
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
				Модулі не знайдено. Спробуй перезавантажити сторінку hikka.io
			</p>
		);
	}

	const groups = groupModulesByCategory(modules);

	return (
		<Form {...form}>
			<div className="space-y-5">
				{groups.map((group) => (
					<section key={group.id} className="space-y-1">
						<h3 className="px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{group.label}
						</h3>
						<div className="space-y-1">
							{group.modules.map((moduleInfo) => (
								<ModuleCard
									key={moduleInfo.id}
									moduleInfo={moduleInfo}
									currentModuleSettings={moduleSettings[moduleInfo.id] || {}}
									isExpanded={expandedModules.has(moduleInfo.id)}
									onToggle={handleToggleChange}
									onSettingChange={handleSettingChange}
									onResetSettings={handleResetSettings}
									onToggleExpansion={toggleModuleExpansion}
									isAuthenticated={isAuthenticated}
								/>
							))}
						</div>
					</section>
				))}
			</div>
		</Form>
	);
}