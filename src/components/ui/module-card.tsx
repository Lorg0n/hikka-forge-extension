import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { ModuleInfo, ModuleSettings, ModuleSettingValue } from "@/types/module";
import { ModuleSettingsSection } from "./module-settings-section";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@iconify/react/dist/iconify.js";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
    moduleInfo: ModuleInfo;
    currentModuleSettings: ModuleSettings;
    isExpanded: boolean;
    onToggle: (moduleId: string, enabled: boolean) => void;
    onSettingChange: (moduleId: string, settingId: string, value: ModuleSettingValue) => void;
    onResetSettings: (moduleId: string) => void;
    onToggleExpansion: (moduleId: string) => void;
    isAuthenticated?: boolean;
	 onPopupAction?: (href: string) => void;
}

export function ModuleCard({
    moduleInfo,
    currentModuleSettings,
    isExpanded,
    onToggle,
    onSettingChange,
    onResetSettings,
    onToggleExpansion,
    isAuthenticated = false,
	 onPopupAction,
}: ModuleCardProps) {
    const hasSettings = moduleInfo.settings && moduleInfo.settings.length > 0;
    const requiresAuth = moduleInfo.authRequired && !isAuthenticated;

    const switchComponent = (
        <Switch
            checked={moduleInfo.enabled}
            onCheckedChange={(checked) => onToggle(moduleInfo.id, checked)}
            aria-label={`Toggle ${moduleInfo.name}`}
        />
    );

    return (
        <div
            className={cn(
                "overflow-hidden rounded-lg border bg-card shadow-sm transition-colors",
                requiresAuth && "border-muted bg-muted/20"
            )}
        >
            {/* Header — whole row expands the card when the module has settings */}
            <div
                className={cn(
                    "flex items-center gap-3 p-3",
                    hasSettings &&
                        "cursor-pointer select-none transition-colors hover:bg-accent/50"
                )}
                onClick={
                    hasSettings
                        ? () => onToggleExpansion(moduleInfo.id)
                        : undefined
                }
            >
                {moduleInfo.icon && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary/60">
                        <Icon
                            icon={moduleInfo.icon.name}
                            className="size-4.5"
                            style={
                                moduleInfo.icon.color
                                    ? { color: moduleInfo.icon.color }
                                    : undefined
                            }
                        />
                    </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium leading-none">
                            {moduleInfo.name}
                        </span>
                        {moduleInfo.beta && (
                            <span
                                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-amber-600 dark:text-amber-400"
                                aria-label="Beta module"
                                title="Beta module"
                            >
                                Beta
                            </span>
                        )}
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">
                        {moduleInfo.description}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
					{moduleInfo.popupAction && (
						<Button
							variant="outline"
							size="icon-sm"
							className="shrink-0"
							disabled={requiresAuth}
							onClick={(event) => {
								event.stopPropagation();
								onPopupAction?.(moduleInfo.popupAction!.href);
							}}
							aria-label={requiresAuth ? "Увійдіть, щоб відкрити модуль" : moduleInfo.popupAction.label}
							title={requiresAuth ? "Увійдіть, щоб відкрити модуль" : moduleInfo.popupAction.label}
						>
							<Icon icon={moduleInfo.popupAction.icon ?? "material-symbols:open-in-new"} />
						</Button>
					)}
                    {hasSettings && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpansion(moduleInfo.id);
                            }}
                            className="h-7 w-7 p-1 text-muted-foreground"
                            aria-label={`Налаштування ${moduleInfo.name}`}
                            aria-expanded={isExpanded}
                        >
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 transition-transform",
                                    isExpanded && "rotate-180"
                                )}
                            />
                        </Button>
                    )}
					{!moduleInfo.popupAction && <div onClick={(e) => e.stopPropagation()}>
                        {requiresAuth ? (
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <div
                                        className="flex size-8 items-center justify-center text-muted-foreground"
                                        role="status"
                                        aria-label="Потрібен вхід для увімкнення модуля"
                                    >
                                        <Icon
                                            icon="material-symbols:lock-rounded"
                                            className="size-4"
                                        />
					</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Увійдіть, щоб увімкнути цей модуль</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            switchComponent
                        )}
                    </div>}
                </div>
            </div>

            {/* Settings — part of the same card, separated by a divider */}
            {hasSettings && (
                <Collapsible open={isExpanded}>
                    <CollapsibleContent className="space-y-6 border-t bg-muted/30 p-4">
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
