"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerProps {
	value?: string;
	onChange?: (color: string) => void;
	className?: string;
}

const hslToHex = (h: number, s: number, l: number): string => {
	h = h / 360;
	s = s / 100;
	l = l / 100;

	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h * 12) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex: string): [number, number, number] => {
	if (!/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
		return [0, 0, 0];
	}

	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return [h * 360, s * 100, l * 100];
};

export function ColorPicker({
	value = "#3b82f6",
	onChange,
	className,
}: ColorPickerProps) {
	const [internalHsl, setInternalHsl] = useState(() => hexToHsl(value));

	const [open, setOpen] = useState(false);
	const areaRef = useRef<HTMLDivElement>(null);
	const hueRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isDraggingHue, setIsDraggingHue] = useState(false);

	const [hexInputValue, setHexInputValue] = useState(value);

	const hexColorDisplay = useMemo(
		() => hslToHex(internalHsl[0], internalHsl[1], internalHsl[2]),
		[internalHsl]
	);

	useEffect(() => {
		const newHslFromProp = hexToHsl(value);
		const currentHexFromInternalHsl = hexColorDisplay;

		if (value.toLowerCase() !== currentHexFromInternalHsl.toLowerCase()) {
			setInternalHsl(newHslFromProp);
			setHexInputValue(value);
		}
	}, [value, hexColorDisplay]);

	useEffect(() => {
		if (hexInputValue.toLowerCase() !== hexColorDisplay.toLowerCase()) {
			setHexInputValue(hexColorDisplay);
		}
	}, [hexColorDisplay]);

	const commitHslChange = useCallback(
		(newHsl: [number, number, number]) => {
			setInternalHsl(newHsl);
			const newHex = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
			onChange?.(newHex);
			setHexInputValue(newHex);
		},
		[onChange]
	);

	const updateColorFromPosition = useCallback(
		(clientX: number, clientY: number) => {
			if (!areaRef.current) return;

			const rect = areaRef.current.getBoundingClientRect();
			const x = clientX - rect.left;
			const y = clientY - rect.top;

			const clampedX = Math.max(0, Math.min(x, rect.width));
			const clampedY = Math.max(0, Math.min(y, rect.height));

			const s_hsv = clampedX / rect.width;
			const v_hsv = 1 - clampedY / rect.height;

			const h = internalHsl[0];

			let s_hsl_norm: number;
			let l_hsl_norm: number = v_hsv * (1 - s_hsv / 2);

			if (l_hsl_norm === 0 || l_hsl_norm === 1) {
				s_hsl_norm = 0;
			} else {
				s_hsl_norm = (v_hsv * s_hsv) / (1 - Math.abs(2 * l_hsl_norm - 1));
				s_hsl_norm = Math.max(0, Math.min(1, s_hsl_norm));
			}

			const s_hsl_percent = s_hsl_norm * 100;
			const l_hsl_percent = l_hsl_norm * 100;

			if (
				Math.abs(s_hsl_percent - internalHsl[1]) > 0.01 ||
				Math.abs(l_hsl_percent - internalHsl[2]) > 0.01
			) {
				commitHslChange([h, s_hsl_percent, l_hsl_percent]);
			}
		},
		[internalHsl, commitHslChange]
	);

	const updateHueFromPosition = useCallback(
		(clientX: number) => {
			if (!hueRef.current) return;

			const rect = hueRef.current.getBoundingClientRect();
			const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
			const hue = (x / rect.width) * 360;

			if (Math.abs(hue - internalHsl[0]) > 0.01) {
				commitHslChange([hue, internalHsl[1], internalHsl[2]]);
			}
		},
		[internalHsl, commitHslChange]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setIsDragging(true);
			updateColorFromPosition(e.clientX, e.clientY);
		},
		[updateColorFromPosition]
	);

	const handleHueMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setIsDraggingHue(true);
			updateHueFromPosition(e.clientX);
		},
		[updateHueFromPosition]
	);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				updateColorFromPosition(e.clientX, e.clientY);
			}
			if (isDraggingHue) {
				updateHueFromPosition(e.clientX);
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setIsDraggingHue(false);
		};

		if (isDragging || isDraggingHue) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDragging,
		isDraggingHue,
		updateColorFromPosition,
		updateHueFromPosition,
	]);

	const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newHex = e.target.value;
		setHexInputValue(newHex);

		if (/^#[0-9A-Fa-f]{6}$/i.test(newHex)) {
			commitHslChange(hexToHsl(newHex));
		}
	};

	const [h] = internalHsl;

	const currentS_hsl_norm = internalHsl[1] / 100;
	const currentL_hsl_norm = internalHsl[2] / 100;

	let currentS_hsv_calc = 0;
	let currentV_hsv_calc = 0;

	if (currentL_hsl_norm === 0) {
		currentV_hsv_calc = 0;
		currentS_hsv_calc = 0;
	} else if (currentL_hsl_norm === 1) {
		currentV_hsv_calc = 1;
		currentS_hsv_calc = 0;
	} else {
		currentV_hsv_calc =
			currentL_hsl_norm +
			currentS_hsl_norm * Math.min(currentL_hsl_norm, 1 - currentL_hsl_norm);
		if (currentV_hsv_calc !== 0) {
			currentS_hsv_calc = 2 * (1 - currentL_hsl_norm / currentV_hsv_calc);
		}
	}

	const left_pos_pointer = currentS_hsv_calc * 100;
	const top_pos_pointer = (1 - currentV_hsv_calc) * 100;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={`h-10 w-10 p-0 ${className}`}
					style={{ backgroundColor: hexColorDisplay }}
				>
					<span className="sr-only">Pick color</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="start">
				<div className="space-y-3">
					<div
						ref={areaRef}
						className="relative h-32 w-full cursor-crosshair select-none overflow-hidden rounded-md"
						style={{
							background: `
                linear-gradient(to top, #000, transparent),
                linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))
              `,
						}}
						onMouseDown={handleMouseDown}
					>
						<div
							className={`absolute z-10 h-3 w-3 rounded-full border-2 border-white shadow-lg transition-transform duration-100 pointer-events-none ${
								isDragging
									? "scale-125 ring-2 ring-blue-400 ring-opacity-50"
									: "scale-100"
							}`}
							style={{
								left: `${left_pos_pointer}%`,
								top: `${top_pos_pointer}%`,
								transform: "translate(-50%, -50%)",
								backgroundColor: hexColorDisplay,
							}}
						/>
					</div>

					<div
						ref={hueRef}
						className="relative h-4 w-full cursor-pointer select-none rounded-md"
						style={{
							background:
								"linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
						}}
						onMouseDown={handleHueMouseDown}
					>
						<div
							className={`absolute z-10 h-4 w-4 rounded-full border-2 border-white shadow-lg transition-transform duration-100 pointer-events-none ${
								isDraggingHue ? "scale-110" : "scale-100"
							}`}
							style={{
								left: `${(h / 360) * 100}%`,
								top: "50%",
								transform: "translate(-50%, -50%)",
								backgroundColor: `hsl(${h}, 100%, 50%)`,
							}}
						/>
					</div>

					<div className="flex items-center gap-2">
						<div
							className="h-4 w-4 rounded border border-gray-300"
							style={{ backgroundColor: hexColorDisplay }}
						/>

						<Input
							value={hexInputValue}
							onChange={handleHexInputChange}
							className="h-7 flex-1 font-mono text-xs"
							placeholder="#000000"
							maxLength={7}
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
