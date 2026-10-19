import { Icon } from "@iconify/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cropForRatio, defaultStickerImageEdits, drawStickerPreview, outputDimensions, prepareStickerSource, renderStickerImage, type StickerImageEdits, type StickerSource } from "@/services/stickerImageEditor";

interface Props { open: boolean; file: File | null; initialWidthUnits?: number; onOpenChange(open: boolean): void; onSave(file: File, widthUnits: number): void | Promise<void> }
type Tool = "pan" | "crop";
type PreviewMetrics = ReturnType<typeof drawStickerPreview>;
type Gesture = { kind: "pan" | "move-crop" | "resize" | "rotate"; startX: number; startY: number; initial: StickerImageEdits; corner?: number; startAngle?: number };
const clone = (value: StickerImageEdits): StickerImageEdits => ({ ...value, crop: { ...value.crop } });
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function StickerImageEditorDialog({ open, file, initialWidthUnits = 1, onOpenChange, onSave }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const metricsRef = useRef<PreviewMetrics>();
	const gestureRef = useRef<Gesture | null>(null);
	const editsRef = useRef<StickerImageEdits | null>(null);
	const historyRef = useRef<StickerImageEdits[]>([]);
	const historyIndexRef = useRef(-1);
	const [source, setSource] = useState<StickerSource | null>(null);
	const [edits, setEdits] = useState<StickerImageEdits | null>(null);
	const [widthUnits, setWidthUnits] = useState(initialWidthUnits);
	const [tool, setTool] = useState<Tool>("pan");
	const [frameIndex, setFrameIndex] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [preparing, setPreparing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [, forceHistory] = useState(0);

	useEffect(() => { editsRef.current = edits; }, [edits]);
	const replaceHistory = useCallback((value: StickerImageEdits) => { historyRef.current = [clone(value)]; historyIndexRef.current = 0; forceHistory((n) => n + 1); }, []);
	const commit = useCallback((value: StickerImageEdits) => { const next = historyRef.current.slice(0, historyIndexRef.current + 1); next.push(clone(value)); historyRef.current = next.slice(-50); historyIndexRef.current = historyRef.current.length - 1; setEdits(clone(value)); forceHistory((n) => n + 1); }, []);
	const undo = () => { if (historyIndexRef.current <= 0) return; historyIndexRef.current--; setEdits(clone(historyRef.current[historyIndexRef.current])); forceHistory((n) => n + 1); };
	const redo = () => { if (historyIndexRef.current >= historyRef.current.length - 1) return; historyIndexRef.current++; setEdits(clone(historyRef.current[historyIndexRef.current])); forceHistory((n) => n + 1); };

	useEffect(() => {
		if (!open || !file) return;
		let active = true; let loaded: StickerSource | null = null;
		setPreparing(true); setError(null); setFrameIndex(0); setPlaying(true);
		void prepareStickerSource(file).then((value) => { loaded = value; if (!active) return; const initial = defaultStickerImageEdits(value.width, value.height, initialWidthUnits); setSource(value); setEdits(initial); setWidthUnits(initialWidthUnits); replaceHistory(initial); }).catch((reason) => active && setError(reason instanceof Error ? reason.message : String(reason))).finally(() => active && setPreparing(false));
		return () => { active = false; loaded?.dispose(); setSource(null); };
	}, [file, initialWidthUnits, open, replaceHistory]);

	useEffect(() => { if (!source?.animated || !playing) return; const timer = window.setTimeout(() => setFrameIndex((index) => (index + 1) % source.frames.length), source.delays[frameIndex] ?? 100); return () => window.clearTimeout(timer); }, [source, playing, frameIndex]);
	useEffect(() => { const canvas = canvasRef.current; if (!canvas || !source || !edits) return; const context = canvas.getContext("2d"); if (context) metricsRef.current = drawStickerPreview(context, source, edits, frameIndex); }, [source, edits, frameIndex]);

	const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = event.currentTarget; const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; };
	const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
		if (!edits || !metricsRef.current) return; const point = canvasPoint(event); const metrics = metricsRef.current; const crop = "crop" in metrics ? metrics.crop : undefined; if (!crop) return;
		const corners = [[crop.x, crop.y], [crop.x + crop.width, crop.y], [crop.x, crop.y + crop.height], [crop.x + crop.width, crop.y + crop.height]];
		const corner = corners.findIndex(([x, y]) => Math.hypot(point.x - x, point.y - y) < 18);
		let kind: Gesture["kind"] = tool === "pan" ? "pan" : "move-crop";
		if ("rotate" in metrics && Math.hypot(point.x - metrics.rotate.x, point.y - metrics.rotate.y) < 18) kind = "rotate"; else if (corner >= 0) kind = "resize";
		const centerX = crop.x + crop.width / 2, centerY = crop.y + crop.height / 2;
		gestureRef.current = { kind, startX: point.x, startY: point.y, initial: clone(edits), corner, startAngle: Math.atan2(point.y - centerY, point.x - centerX) * 180 / Math.PI };
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const gesture = gestureRef.current, metrics = metricsRef.current, sourceValue = source; if (!gesture || !metrics || !sourceValue) return;
		const point = canvasPoint(event); const dx = (point.x - gesture.startX) / metrics.fit; const dy = (point.y - gesture.startY) / metrics.fit; const next = clone(gesture.initial);
		if (gesture.kind === "pan") { next.offsetX = gesture.initial.offsetX + dx; next.offsetY = gesture.initial.offsetY + dy; }
		if (gesture.kind === "move-crop") { next.crop.x = clamp(gesture.initial.crop.x + dx, 0, sourceValue.width - next.crop.width); next.crop.y = clamp(gesture.initial.crop.y + dy, 0, sourceValue.height - next.crop.height); }
		if (gesture.kind === "resize") { const right = gesture.corner === 1 || gesture.corner === 3; const bottom = gesture.corner === 2 || gesture.corner === 3; const anchorX = right ? gesture.initial.crop.x : gesture.initial.crop.x + gesture.initial.crop.width; const anchorY = bottom ? gesture.initial.crop.y : gesture.initial.crop.y + gesture.initial.crop.height; const requestedWidth = Math.max(16, right ? point.x / metrics.fit - (metrics.stageX / metrics.fit) - anchorX : anchorX - (point.x - metrics.stageX) / metrics.fit); const maxWidthX = right ? sourceValue.width - anchorX : anchorX; const maxWidthY = (bottom ? sourceValue.height - anchorY : anchorY) * widthUnits; const width = Math.min(requestedWidth, maxWidthX, maxWidthY); next.crop.width = width; next.crop.height = width / widthUnits; next.crop.x = right ? anchorX : anchorX - width; next.crop.y = bottom ? anchorY : anchorY - next.crop.height; }
		if (gesture.kind === "rotate" && "crop" in metrics) { const centerX = metrics.crop.x + metrics.crop.width / 2, centerY = metrics.crop.y + metrics.crop.height / 2; const angle = Math.atan2(point.y - centerY, point.x - centerX) * 180 / Math.PI; next.rotationDegrees = Math.round(gesture.initial.rotationDegrees + angle - (gesture.startAngle ?? 0)); }
		setEdits(next);
	};
	const pointerUp = () => { if (!gestureRef.current || !editsRef.current) return; gestureRef.current = null; commit(editsRef.current); };
	const updateAndCommit = (patch: Partial<StickerImageEdits>) => { if (!editsRef.current) return; commit({ ...editsRef.current, ...patch }); };
	const changeWidth = (value: number) => { if (!source || !editsRef.current) return; const crop = editsRef.current.crop; setWidthUnits(value); commit({ ...editsRef.current, crop: cropForRatio(source.width, source.height, value, { x: crop.x + crop.width / 2, y: crop.y + crop.height / 2 }) }); };
	const reset = () => { if (!source) return; const value = defaultStickerImageEdits(source.width, source.height, widthUnits); commit(value); };
	const save = async () => { if (!file || !source || !edits) return; setSaving(true); setError(null); try { await onSave(await renderStickerImage(file, source, edits, widthUnits), widthUnits); onOpenChange(false); } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); } finally { setSaving(false); } };
	const dimensions = outputDimensions(widthUnits, source?.animated ?? false);

	return <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}><DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[56rem] w-[calc(100vw-1rem)] max-w-none flex-col gap-3 overflow-hidden p-3 sm:h-[min(92dvh,56rem)] sm:w-[min(96vw,80rem)] sm:max-w-[min(96vw,80rem)] sm:p-5">
		<DialogHeader className="pr-8"><div className="flex flex-wrap items-center gap-3"><DialogTitle>Редактор стікера</DialogTitle>{source && <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{source.animated ? `GIF · ${source.frames.length} кадрів` : "Зображення"} · {source.width}×{source.height}</span>}</div><DialogDescription>Перетягуйте зображення або рамку. Результат на canvas відповідає файлу після збереження.</DialogDescription></DialogHeader>
		{error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
		<div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(36rem,1fr)_19rem]">
			<div className="flex min-h-[22rem] flex-col overflow-hidden rounded-xl border bg-[#111318]">
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 py-2"><div className="flex gap-1"><Button type="button" size="sm" variant={tool === "pan" ? "secondary" : "ghost"} onClick={() => setTool("pan")}><Icon icon="material-symbols:pan-tool-outline" />Зображення</Button><Button type="button" size="sm" variant={tool === "crop" ? "secondary" : "ghost"} onClick={() => setTool("crop")}><Icon icon="material-symbols:crop" />Рамка</Button></div><div className="flex gap-1"><Button type="button" size="icon-sm" variant="ghost" disabled={historyIndexRef.current <= 0} onClick={undo} title="Скасувати дію"><Icon icon="material-symbols:undo" /></Button><Button type="button" size="icon-sm" variant="ghost" disabled={historyIndexRef.current >= historyRef.current.length - 1} onClick={redo} title="Повторити дію"><Icon icon="material-symbols:redo" /></Button><Button type="button" size="sm" variant="ghost" onClick={reset}>Скинути</Button></div></div>
				<div className="relative flex min-h-[20rem] flex-1 items-center justify-center overflow-hidden bg-[repeating-conic-gradient(#252932_0%_25%,#181b21_0%_50%)_50%/20px_20px] p-2">{preparing && <div className="absolute z-10 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-sm text-white"><Icon icon="svg-spinners:90-ring-with-bg" />Підготовка файлу…</div>}<canvas ref={canvasRef} width={900} height={560} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={(event) => { event.preventDefault(); if (!editsRef.current) return; updateAndCommit({ scale: clamp(editsRef.current.scale - event.deltaY * 0.001, 0.25, 4) }); }} className="block h-full min-h-0 w-full touch-none object-contain" /></div>
				{source?.animated && <div className="flex items-center gap-3 border-t border-white/10 bg-black/20 px-3 py-2"><Button type="button" size="icon-sm" variant="ghost" onClick={() => setPlaying((value) => !value)}><Icon icon={playing ? "material-symbols:pause" : "material-symbols:play-arrow"} /></Button><Button type="button" size="icon-sm" variant="ghost" onClick={() => { setFrameIndex(0); setPlaying(true); }} title="Перезапустити"><Icon icon="material-symbols:replay" /></Button><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-violet-400" style={{ width: `${(frameIndex + 1) / source.frames.length * 100}%` }} /></div><span className="text-xs text-white/60">{frameIndex + 1}/{source.frames.length}</span></div>}
			</div>
			<aside className="min-h-0 space-y-4 overflow-y-auto rounded-xl border bg-muted/15 p-4">
				<section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Розмір у сітці</p><div className="grid grid-cols-12 gap-1">{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <button key={value} type="button" onClick={() => changeWidth(value)} title={`${value}×1`} className={`aspect-square rounded-sm border transition-colors ${value <= widthUnits ? "border-violet-400 bg-violet-500/45" : "border-border bg-background hover:bg-muted"}`} />)}</div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{widthUnits} квадратів</span><span>{dimensions.width}×{dimensions.height} px</span></div></section>
				<section className="space-y-3 border-t pt-4"><ControlLabel label="Масштаб" value={`${Math.round((edits?.scale ?? 1) * 100)}%`} /><Slider value={[edits?.scale ?? 1]} min={0.25} max={4} step={0.01} onValueChange={([scale]) => edits && setEdits({ ...edits, scale })} onValueCommit={() => editsRef.current && commit(editsRef.current)} /></section>
				<section className="space-y-3 border-t pt-4"><ControlLabel label="Поворот" value={`${Math.round(edits?.rotationDegrees ?? 0)}°`} /><Slider value={[edits?.rotationDegrees ?? 0]} min={-180} max={180} step={1} onValueChange={([rotationDegrees]) => edits && setEdits({ ...edits, rotationDegrees })} onValueCommit={() => editsRef.current && commit(editsRef.current)} /><div className="grid grid-cols-[1fr_auto] gap-2"><Input type="number" min={-180} max={180} value={Math.round(edits?.rotationDegrees ?? 0)} onChange={(event) => updateAndCommit({ rotationDegrees: clamp(Number(event.target.value), -180, 180) })} className="h-9" /><div className="flex gap-1"><Button type="button" size="icon-sm" variant="outline" onClick={() => updateAndCommit({ rotationDegrees: (editsRef.current?.rotationDegrees ?? 0) - 90 })}><Icon icon="material-symbols:rotate-left" /></Button><Button type="button" size="icon-sm" variant="outline" onClick={() => updateAndCommit({ rotationDegrees: (editsRef.current?.rotationDegrees ?? 0) + 90 })}><Icon icon="material-symbols:rotate-right" /></Button></div></div></section>
				<section className="border-t pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Відображення</p><div className="grid grid-cols-2 gap-2"><Button type="button" size="sm" variant={edits?.flipX ? "secondary" : "outline"} onClick={() => updateAndCommit({ flipX: !editsRef.current?.flipX })}><Icon icon="material-symbols:flip" />Гориз.</Button><Button type="button" size="sm" variant={edits?.flipY ? "secondary" : "outline"} onClick={() => updateAndCommit({ flipY: !editsRef.current?.flipY })}><Icon icon="material-symbols:flip-camera-android" />Верт.</Button></div></section>
				<section className="border-t pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Фон</p><div className="flex gap-2"><input type="color" value={edits?.background ?? "#000000"} onChange={(event) => updateAndCommit({ background: event.target.value })} className="h-9 w-12 rounded-md border bg-background p-1" /><Button type="button" size="sm" variant={!edits?.background ? "secondary" : "outline"} className="flex-1" onClick={() => updateAndCommit({ background: null })}>Прозорий</Button></div></section>
			</aside>
		</div>
		<DialogFooter className="border-t pt-3"><Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>Скасувати</Button><Button type="button" size="sm" disabled={!source || !edits || saving} onClick={() => void save()}><Icon icon={saving ? "svg-spinners:90-ring-with-bg" : "material-symbols:save-outline"} />{saving ? "Обробка…" : "Зберегти стікер"}</Button></DialogFooter>
	</DialogContent></Dialog>;
}

function ControlLabel({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span><span className="text-xs tabular-nums text-muted-foreground">{value}</span></div>; }
