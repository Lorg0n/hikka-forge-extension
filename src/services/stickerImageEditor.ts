import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";

export interface CropRect {
	x: number;
	y: number;
	width: number;
	height: number;
}
export interface StickerImageEdits {
	crop: CropRect;
	scale: number;
	offsetX: number;
	offsetY: number;
	rotationDegrees: number;
	flipX: boolean;
	flipY: boolean;
	background: string | null;
}
export interface StickerSource {
	width: number;
	height: number;
	animated: boolean;
	frames: ImageData[];
	delays: number[];
	duration?: number;
	clip?: TimeRange;
	staticImage?: ImageBitmap;
	dispose(): void;
}

export interface TimeRange {
	start: number;
	end: number;
}

const isGif = (file: File) => file.type === "image/gif" || /\.gif$/i.test(file.name);
const createCanvas = (width: number, height: number) => {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
};
const MAX_GIF_FRAMES = 240;
const MAX_GIF_COMPOSITED_PIXELS = 24_000_000;
const MAX_MP4_SIZE = 5 * 1024 * 1024;
export const MAX_STICKER_CLIP_SECONDS = 6;
const MP4_FRAME_RATE = 12;
const MAX_VIDEO_SIDE = 480;
const MAX_ENCODED_GIF_SIZE = 10 * 1024 * 1024;
const MAX_GIF_PALETTE_PIXELS = 4_000_000;

const isMp4 = (file: File) => file.type === "video/mp4" || /\.mp4$/i.test(file.name);

function waitForMediaEvent(target: HTMLMediaElement, event: "loadeddata" | "loadedmetadata" | "seeked"): Promise<void> {
	if (event === "loadedmetadata" && target.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
	if (event === "loadeddata" && target.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const done = () => {
			cleanup();
			resolve();
		};
		const failed = () => {
			cleanup();
			reject(new Error("Не вдалося декодувати MP4 у цьому браузері."));
		};
		const cleanup = () => {
			target.removeEventListener(event, done);
			target.removeEventListener("error", failed);
		};
		target.addEventListener(event, done, { once: true });
		target.addEventListener("error", failed, { once: true });
	});
}

async function prepareMp4Source(file: File, requestedClip?: TimeRange): Promise<StickerSource> {
	if (file.size > MAX_MP4_SIZE) throw new Error("MP4 має бути не більшим за 5 МБ.");
	const url = URL.createObjectURL(file);
	const video = document.createElement("video");
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";
	try {
		video.src = url;
		await waitForMediaEvent(video, "loadedmetadata");
		if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("Не вдалося визначити тривалість MP4.");
		await waitForMediaEvent(video, "loadeddata");
		const minimumClip = Math.min(0.1, video.duration);
		const start = Math.max(0, Math.min(requestedClip?.start ?? 0, Math.max(0, video.duration - minimumClip)));
		const end = Math.min(video.duration, Math.max(start + minimumClip, Math.min(requestedClip?.end ?? Math.min(video.duration, MAX_STICKER_CLIP_SECONDS), video.duration, start + MAX_STICKER_CLIP_SECONDS)));
		const scale = Math.min(1, MAX_VIDEO_SIDE / Math.max(video.videoWidth, video.videoHeight));
		const width = Math.max(1, Math.round(video.videoWidth * scale));
		const height = Math.max(1, Math.round(video.videoHeight * scale));
		const canvas = createCanvas(width, height);
		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (!context) throw new Error("Canvas недоступний у цьому браузері.");
		const frameCount = Math.max(1, Math.min(MAX_GIF_FRAMES, Math.ceil((end - start) * MP4_FRAME_RATE)));
		const delay = 1000 / MP4_FRAME_RATE;
		const frames: ImageData[] = [];
		for (let index = 0; index < frameCount; index++) {
			const time = Math.min(end - 0.001, start + index / MP4_FRAME_RATE);
			if (Math.abs(video.currentTime - time) > 0.001) {
				video.currentTime = time;
				await waitForMediaEvent(video, "seeked");
			}
			context.drawImage(video, 0, 0, width, height);
			frames.push(context.getImageData(0, 0, width, height));
		}
		return {
			width,
			height,
			animated: true,
			frames,
			delays: frames.map(() => delay),
			duration: video.duration,
			clip: { start, end },
			dispose: () => undefined,
		};
	} finally {
		video.removeAttribute("src");
		video.load();
		URL.revokeObjectURL(url);
	}
}

export async function prepareStickerInputFile(file: File): Promise<File> {
	if (isMp4(file) && file.size > MAX_MP4_SIZE) throw new Error("MP4 має бути не більшим за 5 МБ.");
	return file;
}

export function cropForRatio(width: number, height: number, widthUnits: number, center?: { x: number; y: number }): CropRect {
	const ratio = widthUnits;
	let cropWidth = width;
	let cropHeight = cropWidth / ratio;
	if (cropHeight > height) {
		cropHeight = height;
		cropWidth = cropHeight * ratio;
	}
	const cx = center?.x ?? width / 2;
	const cy = center?.y ?? height / 2;
	return {
		x: Math.max(0, Math.min(width - cropWidth, cx - cropWidth / 2)),
		y: Math.max(0, Math.min(height - cropHeight, cy - cropHeight / 2)),
		width: cropWidth,
		height: cropHeight,
	};
}

export const defaultStickerImageEdits = (width: number, height: number, widthUnits: number): StickerImageEdits => ({
	crop: cropForRatio(width, height, widthUnits),
	scale: 1,
	offsetX: 0,
	offsetY: 0,
	rotationDegrees: 0,
	flipX: false,
	flipY: false,
	background: null,
});

export function outputDimensions(widthUnits: number, animated: boolean): { width: number; height: number } {
	const height = Math.min(248, animated ? Math.floor(480 / widthUnits) : 248);
	return { width: height * widthUnits, height };
}

function composeGifFrame(context: CanvasRenderingContext2D, frame: ParsedFrame): ImageData {
	const before = frame.disposalType === 3 ? context.getImageData(0, 0, context.canvas.width, context.canvas.height) : null;
	const patch = createCanvas(frame.dims.width, frame.dims.height);
	patch.getContext("2d")?.putImageData(new ImageData(frame.patch, frame.dims.width, frame.dims.height), 0, 0);
	// GIF transparency means "keep the accumulated pixel", so patches must be
	// alpha-composited instead of replacing the destination via putImageData.
	context.drawImage(patch, frame.dims.left, frame.dims.top);
	const rendered = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
	if (frame.disposalType === 2) context.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
	else if (before) context.putImageData(before, 0, 0);
	return rendered;
}

export async function prepareStickerSource(file: File, clip?: TimeRange): Promise<StickerSource> {
	if (isMp4(file)) return prepareMp4Source(file, clip);
	if (!isGif(file)) {
		const image = await createImageBitmap(file);
		return {
			width: image.width,
			height: image.height,
			animated: false,
			frames: [],
			delays: [],
			staticImage: image,
			dispose: () => image.close(),
		};
	}
	const parsed = parseGIF(await file.arrayBuffer());
	const frameCount = parsed.frames.reduce((count, frame) => count + ("image" in frame ? 1 : 0), 0);
	const expandedPixels = parsed.lsd.width * parsed.lsd.height * frameCount;
	if (frameCount > MAX_GIF_FRAMES || expandedPixels > MAX_GIF_COMPOSITED_PIXELS) {
		throw new Error(`GIF завеликий для редактора: максимум ${MAX_GIF_FRAMES} кадрів і ${MAX_GIF_COMPOSITED_PIXELS.toLocaleString("uk-UA")} пікселів після декодування.`);
	}
	const decoded = decompressFrames(parsed, true);
	if (!decoded.length) throw new Error("GIF не містить кадрів.");
	const canvas = createCanvas(parsed.lsd.width, parsed.lsd.height);
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) throw new Error("Canvas недоступний у цьому браузері.");
	const frames: ImageData[] = [];
	for (const frame of decoded) {
		frames.push(composeGifFrame(context, frame));
		// Release decompressed patches as full composited frames replace them.
		frame.patch = new Uint8ClampedArray(0);
	}
	return {
		width: parsed.lsd.width,
		height: parsed.lsd.height,
		animated: decoded.length > 1,
		frames,
		delays: decoded.map((frame) => Math.max(20, frame.delay || 100)),
		dispose: () => undefined,
	};
}

function drawSource(context: CanvasRenderingContext2D, source: CanvasImageSource, sourceWidth: number, sourceHeight: number, edits: StickerImageEdits) {
	context.save();
	context.translate(sourceWidth / 2 + edits.offsetX, sourceHeight / 2 + edits.offsetY);
	context.rotate((edits.rotationDegrees * Math.PI) / 180);
	context.scale((edits.flipX ? -1 : 1) * edits.scale, (edits.flipY ? -1 : 1) * edits.scale);
	context.drawImage(source, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
	context.restore();
}

function frameCanvas(source: StickerSource, frameIndex: number): CanvasImageSource {
	if (source.staticImage) return source.staticImage;
	const canvas = createCanvas(source.width, source.height);
	canvas.getContext("2d")?.putImageData(source.frames[Math.min(frameIndex, source.frames.length - 1)], 0, 0);
	return canvas;
}

export function drawStickerPreview(context: CanvasRenderingContext2D, source: StickerSource, edits: StickerImageEdits, frameIndex: number, showOverlay = true) {
	const canvas = context.canvas;
	const padding = 28;
	const fit = Math.min((canvas.width - padding * 2) / source.width, (canvas.height - padding * 2) / source.height);
	const stageX = (canvas.width - source.width * fit) / 2;
	const stageY = (canvas.height - source.height * fit) / 2;
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.save();
	context.translate(stageX, stageY);
	context.scale(fit, fit);
	if (edits.background) {
		context.fillStyle = edits.background;
		context.fillRect(0, 0, source.width, source.height);
	}
	drawSource(context, frameCanvas(source, frameIndex), source.width, source.height, edits);
	context.restore();
	if (!showOverlay) return { fit, stageX, stageY };
	const crop = {
		x: stageX + edits.crop.x * fit,
		y: stageY + edits.crop.y * fit,
		width: edits.crop.width * fit,
		height: edits.crop.height * fit,
	};
	context.save();
	context.fillStyle = "rgb(0 0 0 / 0.58)";
	context.beginPath();
	context.rect(0, 0, canvas.width, canvas.height);
	context.rect(crop.x, crop.y, crop.width, crop.height);
	context.fill("evenodd");
	context.strokeStyle = "#ffffff";
	context.lineWidth = 2;
	context.strokeRect(crop.x, crop.y, crop.width, crop.height);
	context.strokeStyle = "rgb(255 255 255 / 0.42)";
	context.lineWidth = 1;
	for (let index = 1; index < Math.round(edits.crop.width / edits.crop.height); index++) {
		const x = crop.x + (crop.width * index) / Math.round(edits.crop.width / edits.crop.height);
		context.beginPath();
		context.moveTo(x, crop.y);
		context.lineTo(x, crop.y + crop.height);
		context.stroke();
	}
	const handles = [
		[crop.x, crop.y],
		[crop.x + crop.width, crop.y],
		[crop.x, crop.y + crop.height],
		[crop.x + crop.width, crop.y + crop.height],
	];
	context.fillStyle = "#ffffff";
	for (const [x, y] of handles) context.fillRect(x - 5, y - 5, 10, 10);
	const rotateX = crop.x + crop.width / 2;
	const rotateY = crop.y - 24;
	context.beginPath();
	context.moveTo(rotateX, crop.y);
	context.lineTo(rotateX, rotateY);
	context.stroke();
	context.beginPath();
	context.arc(rotateX, rotateY, 6, 0, Math.PI * 2);
	context.fill();
	context.restore();
	return { fit, stageX, stageY, crop, rotate: { x: rotateX, y: rotateY } };
}

function renderOutput(source: StickerSource, edits: StickerImageEdits, width: number, height: number, frameIndex: number): ImageData {
	const canvas = createCanvas(width, height);
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) throw new Error("Canvas недоступний у цьому браузері.");
	if (edits.background) {
		context.fillStyle = edits.background;
		context.fillRect(0, 0, width, height);
	}
	context.save();
	context.scale(width / edits.crop.width, height / edits.crop.height);
	context.translate(-edits.crop.x, -edits.crop.y);
	drawSource(context, frameCanvas(source, frameIndex), source.width, source.height, edits);
	context.restore();
	return context.getImageData(0, 0, width, height);
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Не вдалося підготувати зображення."))), "image/png"));
}

function paletteForFrames(frames: ImageData[]): ReturnType<typeof quantize> {
	const totalPixels = frames.reduce((sum, frame) => sum + frame.width * frame.height, 0);
	const stride = Math.max(1, Math.ceil(totalPixels / MAX_GIF_PALETTE_PIXELS));
	const samples = new Uint8ClampedArray(Math.ceil(totalPixels / stride) * 4);
	let destination = 0;
	for (const frame of frames) {
		const pixels = frame.data;
		for (let offset = 0; offset < pixels.length; offset += 4 * stride) {
			samples[destination++] = pixels[offset];
			samples[destination++] = pixels[offset + 1];
			samples[destination++] = pixels[offset + 2];
			samples[destination++] = pixels[offset + 3];
		}
	}
	return quantize(samples.subarray(0, destination), 256, {
		format: "rgba4444",
		oneBitAlpha: true,
	});
}

function gifPalette(source: StickerSource, edits: StickerImageEdits, width: number, height: number): ReturnType<typeof quantize> {
	const frames = source.frames.map((_, index) => renderOutput(source, edits, width, height, index));
	return paletteForFrames(frames);
}

export async function renderStickerImage(file: File, source: StickerSource, edits: StickerImageEdits, widthUnits: number): Promise<File> {
	const size = outputDimensions(widthUnits, source.animated);
	if (!source.animated) {
		const canvas = createCanvas(size.width, size.height);
		canvas.getContext("2d")?.putImageData(renderOutput(source, edits, size.width, size.height, 0), 0, 0);
		return new File([await blobFromCanvas(canvas)], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
	}
	const encoder = GIFEncoder();
	const palette = gifPalette(source, edits, size.width, size.height);
	const transparentIndex = palette.findIndex((color) => color[3] === 0);
	for (let index = 0; index < source.frames.length; index++) {
		const pixels = renderOutput(source, edits, size.width, size.height, index).data;
		const indexed = applyPalette(pixels, palette, "rgba4444");
		encoder.writeFrame(indexed, size.width, size.height, {
			...(index === 0 ? { palette, repeat: 0 } : {}),
			delay: source.delays[index],
			transparent: transparentIndex >= 0,
			transparentIndex: Math.max(0, transparentIndex),
			dispose: 2,
		});
	}
	encoder.finish();
	const bytes = encoder.bytes();
	if (bytes.byteLength > MAX_ENCODED_GIF_SIZE) throw new Error("Після обробки GIF перевищує 10 МБ. Скоротіть анімацію або зменште її розмір.");
	return new File([bytes], file.name.replace(/\.[^.]+$/, "") + ".gif", {
		type: "image/gif",
	});
}
