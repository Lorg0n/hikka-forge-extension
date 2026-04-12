import { FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ModuleSetting } from "@/types/module";
import { ColorPicker } from "@/components/ui/color-picker";
import { Icon } from "@iconify/react/dist/iconify.js";

interface SettingInputProps {
    moduleId: string;
    setting: ModuleSetting;
    currentValue: any;
    onValueChange: (moduleId: string, settingId: string, value: any) => void;
}

export function SettingInput({
    moduleId,
    setting,
    currentValue,
    onValueChange,
}: SettingInputProps) {
    const handleInputChange = (value: any) => {
        onValueChange(moduleId, setting.id, value);
    };

    return (
        <FormItem key={setting.id} className="space-y-1">
            <div className="flex flex-col gap-0">
                <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium leading-none">
                        {setting.label}
                    </FormLabel>
                    {setting.description && (
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center justify-center size-3.5 rounded-full text-muted-foreground hover:text-foreground transition-colors outline-none shrink-0"
                                >
                                    <Icon
                                        icon="material-symbols:help-outline-rounded"
                                        className="size-3.5"
                                    />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="max-w-[260px] text-xs leading-relaxed"
                            >
                                {setting.description}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>

            {(() => {
                switch (setting.type) {
                    case "slider":
                        return (
                            <div className="flex items-center gap-3">
                                <Slider
                                    value={[currentValue]}
                                    onValueChange={([value]) => handleInputChange(value)}
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
                        );

                    case "colorPicker":
                        return (
                            <ColorPicker
                                value={currentValue}
                                onChange={handleInputChange}
                            />
                        );

                    case "toggle":
                        return (
                            <div className="flex flex-row items-center justify-between space-y-0 py-2">
                                <Switch
                                    checked={currentValue}
                                    onCheckedChange={handleInputChange}
                                />
                            </div>
                        );

                    case "select":
                        return (
                            <Select value={currentValue} onValueChange={handleInputChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {setting.options?.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        );

                    case "text":
                        return (
                            <Input
                                type="text"
                                value={currentValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                placeholder={setting.placeholder}
                                className="w-full"
                            />
                        );

                    default:
                        return null;
                }
            })()}
        </FormItem>
    );
}