declare module "gifenc" {
	export interface GifEncoder {
		writeFrame(index: Uint8Array, width: number, height: number, options?: {
			palette?: number[][];
			delay?: number;
			repeat?: number;
			transparent?: boolean;
			transparentIndex?: number;
			dispose?: number;
		}): void;
		finish(): void;
		bytes(): Uint8Array;
	}
	export function GIFEncoder(): GifEncoder;
	export function quantize(data: Uint8Array | Uint8ClampedArray, maxColors: number, options?: {
		format?: "rgb565" | "rgb444" | "rgba4444";
		oneBitAlpha?: boolean | number;
	}): number[][];
	export function applyPalette(data: Uint8Array | Uint8ClampedArray, palette: number[][], format?: "rgb565" | "rgb444" | "rgba4444"): Uint8Array;
}
