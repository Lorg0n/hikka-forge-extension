import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { ModuleInfo } from "@/types/module";
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
    currentModuleSettings: Record<string, any>;
    isExpanded: boolean;
    onToggle: (moduleId: string, enabled: boolean) => void;
    onSettingChange: (moduleId: string, settingId: string, value: any) => void;
    onResetSettings: (moduleId: string) => void;
    onToggleExpansion: (moduleId: string) => void;
    isAuthenticated?: boolean;
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
}: ModuleCardProps) {
    const hasSettings = moduleInfo.settings && moduleInfo.settings.length > 0;
    const requiresAuth = moduleInfo.authRequired && !isAuthenticated;

    const switchComponent = (
        <Switch
            checked={moduleInfo.enabled}
            onCheckedChange={(checked) => onToggle(moduleInfo.id, checked)}
            disabled={requiresAuth}
            aria-label={`Toggle ${moduleInfo.name}`}
        />
    );

    return (
        <div
            className={cn(
                "overflow-hidden rounded-lg border bg-card shadow-sm transition-colors",
                requiresAuth && "opacity-60"
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
                        {requiresAuth && (
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <div className="flex size-4 shrink-0 items-center justify-center">
                                        <Icon
                                            icon="material-symbols:lock-rounded"
                                            className="size-3.5 text-muted-foreground"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Увійдіть для використання цього модуля</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">
                        {moduleInfo.description}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
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
                    <div onClick={(e) => e.stopPropagation()}>
                        {requiresAuth ? (
                            <Tooltip delayDuration={200}>
                                <TooltipTrigger asChild>
                                    <div>{switchComponent}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Увійдіть для використання цього модуля</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            switchComponent
                        )}
                    </div>
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
