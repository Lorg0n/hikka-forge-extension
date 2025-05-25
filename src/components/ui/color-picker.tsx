"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const hexToRgb = (hex: string): [number, number, number] => {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return [r, g, b];
};

const rgbToHex = (r: number, g: number, b: number): string => {
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, "0")}`;
};

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
	r /= 255;
	g /= 255;
	b /= 255;

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

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
	h /= 360;
	s /= 100;
	l /= 100;

	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	let r, g, b;
	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const v = max;

	const d = max - min;
	s = max === 0 ? 0 : d / max;

	if (max !== min) {
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
	return [h * 360, s * 100, v * 100];
};

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
	s /= 100;
	v /= 100;
	let r = 0,
		g = 0,
		b = 0;
	const i = Math.floor(h / 60);
	const f = h / 60 - i;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		case 5:
			r = v;
			g = p;
			b = q;
			break;
	}
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const hslToHex = (h: number, s: number, l: number): string => {
	const [r, g, b] = hslToRgb(h, s, l);
	return rgbToHex(r, g, b);
};

const hexToHsl = (hex: string): [number, number, number] => {
	if (!/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
		return [0, 0, 0];
	}
	const [r, g, b] = hexToRgb(hex);
	return rgbToHsl(r, g, b);
};

interface ColorPickerProps {
	value?: string;
	onChange?: (color: string) => void;
	className?: string;
}

export function ColorPicker({
	value = "#3b82f6",
	onChange,
	className,
}: ColorPickerProps) {
	const [internalHsl, setInternalHsl] = useState(() => hexToHsl(value));

	const initialPointerPositions = useMemo(() => {
		const [h, s, l] = hexToHsl(value);
		const [r, g, b] = hslToRgb(h, s, l);
		const [, s_hsv, v_hsv] = rgbToHsv(r, g, b);
		return { s: s_hsv, v: v_hsv };
	}, [value]);

	const [pointerS, setPointerS] = useState(initialPointerPositions.s);
	const [pointerV, setPointerV] = useState(initialPointerPositions.v);

	const [open, setOpen] = useState(false);
	const areaRef = useRef<HTMLDivElement>(null);
	const hueRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isDraggingHue, setIsDraggingHue] = useState(false);

	const [hexInputValue, setHexInputValue] = useState(value);

	const hexColorDisplay = useMemo(
		() => hslToHex(internalHsl[0], internalHsl[1], internalHsl[2]),
		[internalHsl],
	);

	useEffect(() => {
		const newHslFromProp = hexToHsl(value);
		const currentHexFromInternalHsl = hexColorDisplay;

		if (value.toLowerCase() !== currentHexFromInternalHsl.toLowerCase()) {
			setInternalHsl(newHslFromProp);
			setHexInputValue(value);

			const [r, g, b] = hslToRgb(newHslFromProp[0], newHslFromProp[1], newHslFromProp[2]);
            const [, s_hsv, v_hsv] = rgbToHsv(r, g, b);
            setPointerS(s_hsv);
            setPointerV(v_hsv);
		}
	}, [value, hexColorDisplay]);

	useEffect(() => {
		if (hexInputValue.toLowerCase() !== hexColorDisplay.toLowerCase()) {
			setHexInputValue(hexColorDisplay);
		}
	}, [hexColorDisplay, hexInputValue]);

	const commitHslChange = useCallback(
		(newHsl: [number, number, number]) => {
			setInternalHsl(newHsl);
			const newHex = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
			onChange?.(newHex);
		},
		[onChange],
	);

	const updateColorFromPosition = useCallback(
		(clientX: number, clientY: number) => {
			if (!areaRef.current) return;

			const rect = areaRef.current.getBoundingClientRect();
			const x = clientX - rect.left;
			const y = clientY - rect.top;

			const clampedX = Math.max(0, Math.min(x, rect.width));
			const clampedY = Math.max(0, Math.min(y, rect.height));

			const newS_hsv_percent = (clampedX / rect.width) * 100;
			const newV_hsv_percent = (1 - clampedY / rect.height) * 100;

			setPointerS(newS_hsv_percent);
			setPointerV(newV_hsv_percent);

			const [r, g, b] = hsvToRgb(
				internalHsl[0],
				newS_hsv_percent,
				newV_hsv_percent,
			);
			const newHsl = rgbToHsl(r, g, b);

			if (
				Math.abs(newHsl[0] - internalHsl[0]) > 0.01 ||
				Math.abs(newHsl[1] - internalHsl[1]) > 0.01 ||
				Math.abs(newHsl[2] - internalHsl[2]) > 0.01
			) {
				commitHslChange(newHsl);
			}
		},
		[internalHsl, commitHslChange],
	);

	const updateHueFromPosition = useCallback(
		(clientX: number) => {
			if (!hueRef.current) return;

			const rect = hueRef.current.getBoundingClientRect();
			const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
			const hue = (x / rect.width) * 360;

			if (Math.abs(hue - internalHsl[0]) > 0.01) {
				commitHslChange([hue, internalHsl[1], internalHsl[2]]);

				const [r, g, b] = hslToRgb(hue, internalHsl[1], internalHsl[2]);
                const [, s_hsv, v_hsv] = rgbToHsv(r, g, b);
                setPointerS(s_hsv);
                setPointerV(v_hsv);
			}
		},
		[internalHsl, commitHslChange],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setIsDragging(true);
			updateColorFromPosition(e.clientX, e.clientY);
		},
		[updateColorFromPosition],
	);

	const handleHueMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setIsDraggingHue(true);
			updateHueFromPosition(e.clientX);
		},
		[updateHueFromPosition],
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
			const newHsl = hexToHsl(newHex);
			commitHslChange(newHsl);

			const [r, g, b] = hslToRgb(newHsl[0], newHsl[1], newHsl[2]);
            const [, s_hsv, v_hsv] = rgbToHsv(r, g, b);
            setPointerS(s_hsv);
            setPointerV(v_hsv);
		}
	};

	const [h] = internalHsl;

	const left_pos_pointer = pointerS;
	const top_pos_pointer = 100 - pointerV;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div className={`flex items-center gap-2 ${className}`}>
					<div
						className="h-8 w-8 rounded-md border"
						style={{ backgroundColor: hexColorDisplay }}
					/>
					<Input
						value={hexInputValue}
						onChange={handleHexInputChange}
						className="flex-1 h-9 text-xs font-mono"
						placeholder="#000000"
						maxLength={7}
					/>
				</div>
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