import { applyPalette, GIFEncoder, quantize } from "gifenc";

interface EncodeRequest {
	frames: ArrayBuffer[];
	delays: number[];
	width: number;
	height: number;
	colors: number;
}

const MAX_PALETTE_PIXELS = 4_000_000;

function createPalette(frames: Uint8ClampedArray[], width: number, height: number, colors: number) {
	const totalPixels = width * height * frames.length;
	const stride = Math.max(1, Math.ceil(totalPixels / MAX_PALETTE_PIXELS));
	const samples = new Uint8ClampedArray(Math.ceil(totalPixels / stride) * 4);
	let destination = 0;
	for (const pixels of frames) {
		for (let offset = 0; offset < pixels.length; offset += 4 * stride) {
			samples[destination++] = pixels[offset];
			samples[destination++] = pixels[offset + 1];
			samples[destination++] = pixels[offset + 2];
			samples[destination++] = pixels[offset + 3];
		}
	}
	return quantize(samples.subarray(0, destination), colors, { format: "rgba4444", oneBitAlpha: true });
}

self.onmessage = (event: MessageEvent<EncodeRequest>) => {
	try {
		const { delays, width, height, colors } = event.data;
		const frames = event.data.frames.map((buffer) => new Uint8ClampedArray(buffer));
		const palette = createPalette(frames, width, height, colors);
		const transparentIndex = palette.findIndex((color) => color[3] === 0);
		const encoder = GIFEncoder();
		for (let index = 0; index < frames.length; index++) {
			const indexed = applyPalette(frames[index], palette, "rgba4444");
			encoder.writeFrame(indexed, width, height, {
				...(index === 0 ? { palette, repeat: 0 } : {}),
				delay: delays[index],
				transparent: transparentIndex >= 0,
				transparentIndex: Math.max(0, transparentIndex),
				dispose: 2,
			});
		}
		encoder.finish();
		const result = encoder.bytes().slice();
		self.postMessage({ bytes: result.buffer }, { transfer: [result.buffer] });
	} catch (reason) {
		self.postMessage({ error: reason instanceof Error ? reason.message : String(reason) });
	}
};
