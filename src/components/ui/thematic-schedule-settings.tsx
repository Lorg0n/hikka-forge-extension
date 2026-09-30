import { Icon } from "@iconify/react/dist/iconify.js";
import { Switch } from "@/components/ui/switch";
import type {
	ModuleSettings,
	ModuleSettingValue,
	ThematicScheduleInfo,
} from "@/types/module";
import { cn } from "@/lib/utils";

interface ThematicScheduleSettingsProps {
	moduleId: string;
	config: ThematicScheduleInfo;
	currentModuleSettings: ModuleSettings;
	onSettingChange: (
		moduleId: string,
		settingId: string,
		value: ModuleSettingValue,
	) => void;
	moduleEnabled: boolean;
}

export function ThematicScheduleSettings({
	moduleId,
	config,
	currentModuleSettings,
	onSettingChange,
	moduleEnabled,
}: ThematicScheduleSettingsProps) {
	const configuredSelection = currentModuleSettings[config.manualSelectionSettingId];
	const selectedItemId =
		typeof configuredSelection === "string" &&
		config.items.some((item) => item.id === configuredSelection)
			? configuredSelection
			: config.automaticValue;
	const selectedItem = config.items.find((item) => item.id === selectedItemId);

	return (
		<section className="space-y-3" aria-label="Керування тематиками">
			<div className="space-y-1">
				<div className="flex items-center gap-1.5 text-sm font-medium">
					<Icon icon="material-symbols:calendar-month-outline-rounded" className="size-4 text-muted-foreground" />
					<span>Режим показу</span>
				</div>
				<p className="text-xs leading-snug text-muted-foreground">
					{selectedItem
						? `Вручну обрано: ${selectedItem.label}. Календар тимчасово не застосовується.`
						: "За календарем"}
				</p>
				{!moduleEnabled && (
					<p className="text-xs leading-snug text-amber-600 dark:text-amber-400">
						Вибір збережеться та застосовується після увімкнення модуля.
					</p>
				)}
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/80 px-3 py-2.5 shadow-sm">
					<span className="text-sm font-medium">Обрати поточне</span>
					<select
						value={selectedItemId}
						onChange={(event) =>
							onSettingChange(moduleId, config.manualSelectionSettingId, event.target.value)
						}
						className="h-8 w-44 rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
					>
						<option value={config.automaticValue}>Авто</option>
						{config.items.map((item) => (
							<option key={item.id} value={item.id}>
								{item.label}
							</option>
						))}
					</select>
				</div>

				{config.items.map((item) => {
					const calendarEnabled = currentModuleSettings[item.calendarEnabledSettingId] !== false;
					const isForced = selectedItemId === item.id;
					const isActiveNow = config.activeItemIds.includes(item.id);

					return (
						<div
							key={item.id}
							className={cn(
								"rounded-lg border border-border/70 bg-card/80 p-3 shadow-sm transition-colors",
								isForced && "border-primary/40 bg-primary/10",
							)}
						>
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0 space-y-0.5">
									<div className="flex flex-wrap items-center gap-1.5">
										<p className="text-sm font-medium">{item.label}</p>
										{isForced && (
											<span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
												Обрано вручну
											</span>
										)}
										{isActiveNow && !isForced && (
											<span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success-foreground">
												Зараз за календарем
											</span>
										)}
									</div>
									<p className="text-xs text-muted-foreground">{item.scheduleLabel}</p>
								</div>
								<div className="flex shrink-0 items-center">
									<Switch
										checked={calendarEnabled}
										onCheckedChange={(enabled) =>
											onSettingChange(moduleId, item.calendarEnabledSettingId, enabled)
										}
										aria-label={`Автопоказ ${item.label} за датою`}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
