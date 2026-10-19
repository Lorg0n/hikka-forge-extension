import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { decompressFrames, parseGIF, type ParsedFrame } from "gifuct-js";

export interface CropRect { x: number; y: number; width: number; height: number }
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
	staticImage?: ImageBitmap;
	dispose(): void;
}

const isGif = (file: File) => file.type === "image/gif" || /\.gif$/i.test(file.name);
const createCanvas = (width: number, height: number) => { const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; return canvas; };
const MAX_GIF_FRAMES = 240;
const MAX_GIF_COMPOSITED_PIXELS = 24_000_000;

export function cropForRatio(width: number, height: number, widthUnits: number, center?: { x: number; y: number }): CropRect {
	const ratio = widthUnits;
	let cropWidth = width;
	let cropHeight = cropWidth / ratio;
	if (cropHeight > height) { cropHeight = height; cropWidth = cropHeight * ratio; }
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
	crop: cropForRatio(width, height, widthUnits), scale: 1, offsetX: 0, offsetY: 0,
	rotationDegrees: 0, flipX: false, flipY: false, background: null,
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

export async function prepareStickerSource(file: File): Promise<StickerSource> {
	if (!isGif(file)) {
		const image = await createImageBitmap(file);
		return { width: image.width, height: image.height, animated: false, frames: [], delays: [], staticImage: image, dispose: () => image.close() };
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
		width: parsed.lsd.width, height: parsed.lsd.height, animated: decoded.length > 1,
		frames,
		delays: decoded.map((frame) => Math.max(20, frame.delay || 100)), dispose: () => undefined,
	};
}

function drawSource(context: CanvasRenderingContext2D, source: CanvasImageSource, sourceWidth: number, sourceHeight: number, edits: StickerImageEdits) {
	context.save();
	context.translate(sourceWidth / 2 + edits.offsetX, sourceHeight / 2 + edits.offsetY);
	context.rotate(edits.rotationDegrees * Math.PI / 180);
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
	context.save(); context.translate(stageX, stageY); context.scale(fit, fit);
	if (edits.background) { context.fillStyle = edits.background; context.fillRect(0, 0, source.width, source.height); }
	drawSource(context, frameCanvas(source, frameIndex), source.width, source.height, edits);
	context.restore();
	if (!showOverlay) return { fit, stageX, stageY };
	const crop = { x: stageX + edits.crop.x * fit, y: stageY + edits.crop.y * fit, width: edits.crop.width * fit, height: edits.crop.height * fit };
	context.save();
	context.fillStyle = "rgb(0 0 0 / 0.58)"; context.beginPath(); context.rect(0, 0, canvas.width, canvas.height); context.rect(crop.x, crop.y, crop.width, crop.height); context.fill("evenodd");
	context.strokeStyle = "#ffffff"; context.lineWidth = 2; context.strokeRect(crop.x, crop.y, crop.width, crop.height);
	context.strokeStyle = "rgb(255 255 255 / 0.42)"; context.lineWidth = 1;
	for (let index = 1; index < Math.round(edits.crop.width / edits.crop.height); index++) { const x = crop.x + crop.width * index / Math.round(edits.crop.width / edits.crop.height); context.beginPath(); context.moveTo(x, crop.y); context.lineTo(x, crop.y + crop.height); context.stroke(); }
	const handles = [[crop.x, crop.y], [crop.x + crop.width, crop.y], [crop.x, crop.y + crop.height], [crop.x + crop.width, crop.y + crop.height]];
	context.fillStyle = "#ffffff"; for (const [x, y] of handles) context.fillRect(x - 5, y - 5, 10, 10);
	const rotateX = crop.x + crop.width / 2; const rotateY = crop.y - 24;
	context.beginPath(); context.moveTo(rotateX, crop.y); context.lineTo(rotateX, rotateY); context.stroke(); context.beginPath(); context.arc(rotateX, rotateY, 6, 0, Math.PI * 2); context.fill();
	context.restore();
	return { fit, stageX, stageY, crop, rotate: { x: rotateX, y: rotateY } };
}

function renderOutput(source: StickerSource, edits: StickerImageEdits, width: number, height: number, frameIndex: number): ImageData {
	const canvas = createCanvas(width, height); const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) throw new Error("Canvas недоступний у цьому браузері.");
	if (edits.background) { context.fillStyle = edits.background; context.fillRect(0, 0, width, height); }
	context.save(); context.scale(width / edits.crop.width, height / edits.crop.height); context.translate(-edits.crop.x, -edits.crop.y);
	drawSource(context, frameCanvas(source, frameIndex), source.width, source.height, edits); context.restore();
	return context.getImageData(0, 0, width, height);
}

function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> { return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Не вдалося підготувати зображення.")), "image/png")); }

export async function renderStickerImage(file: File, source: StickerSource, edits: StickerImageEdits, widthUnits: number): Promise<File> {
	const size = outputDimensions(widthUnits, source.animated);
	if (!source.animated) {
		const canvas = createCanvas(size.width, size.height); canvas.getContext("2d")?.putImageData(renderOutput(source, edits, size.width, size.height, 0), 0, 0);
		return new File([await blobFromCanvas(canvas)], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
	}
	const encoder = GIFEncoder();
	for (let index = 0; index < source.frames.length; index++) {
		const pixels = renderOutput(source, edits, size.width, size.height, index).data;
		const palette = quantize(pixels, 256, { format: "rgba4444", oneBitAlpha: true });
		const indexed = applyPalette(pixels, palette, "rgba4444");
		const transparentIndex = palette.findIndex((color) => color[3] === 0);
		encoder.writeFrame(indexed, size.width, size.height, { palette, delay: source.delays[index], repeat: 0, transparent: transparentIndex >= 0, transparentIndex: Math.max(0, transparentIndex), dispose: 2 });
	}
	encoder.finish();
	return new File([encoder.bytes()], file.name.replace(/\.[^.]+$/, "") + ".gif", { type: "image/gif" });
}
