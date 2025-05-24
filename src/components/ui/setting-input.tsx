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
import type { ModuleSetting } from "@/types/module";

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
				<FormLabel className="text-sm font-medium">{setting.label}</FormLabel>
				{setting.description && (
					<FormDescription className="text-xs">
						{setting.description}
					</FormDescription>
				)}
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
							<div className="flex items-center gap-2">
								<Input
									type="color"
									value={currentValue}
									onChange={(e) => handleInputChange(e.target.value)}
									className="w-12 h-8 p-1 rounded border"
								/>
								<Input
									type="text"
									value={currentValue}
									onChange={(e) => handleInputChange(e.target.value)}
									className="flex-1 text-sm"
									placeholder="#000000"
								/>
							</div>
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
