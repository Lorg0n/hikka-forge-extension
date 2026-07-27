import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ELK from 'elkjs/lib/elk-api.js';
import elkWorkerUrl from 'elkjs/lib/elk-worker.min.js?url';
import { GraphEdge, GraphNode } from '@/types';
import Link from '@/components/typography/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface RelationsGraphContentProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    currentNodeId?: string;
    relationTypes: string[];
}

interface LayoutNode extends GraphNode {
    x: number;
    y: number;
}

interface RoutedEdge {
    edge: GraphEdge;
    id: string;
    sections: Array<{ startPoint: Point; bendPoints?: Point[]; endPoint: Point }>;
}

interface Point { x: number; y: number }

interface GraphLayout {
    nodes: LayoutNode[];
    edges: RoutedEdge[];
    width: number;
    height: number;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 148;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const GRAPH_PADDING = 72;
let elkPromise: Promise<ELK> | null = null;

// Content scripts have the page origin, so Chrome rejects a Worker pointed
// directly at chrome-extension://… . Fetching the web-accessible worker and
// starting it from a Blob keeps it isolated from the page's patched globals
// while satisfying the content-script worker origin requirement.
const getElk = () => {
    if (!elkPromise) {
        elkPromise = fetch(elkWorkerUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Could not load ELK worker (${response.status}).`);
                return response.text();
            })
            .then(workerSource => new ELK({
                workerFactory: () => {
                    const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
                    const worker = new Worker(url);
                    window.setTimeout(() => URL.revokeObjectURL(url), 0);
                    return worker;
                },
            }));
    }
    return elkPromise;
};

const relationTypeColors: Record<string, string> = {
    SEQUEL: '#4ade80', PREQUEL: '#60a5fa', ALTERNATIVE: '#c084fc', SPIN_OFF: '#fbbf24',
    PARENT: '#f87171', CHARACTER: '#22d3ee', SIDE_STORY: '#2dd4bf', SOURCE: '#a3e635',
    SUMMARY: '#facc15', OTHER: '#9ca3af', ADAPTATION: '#f472b6',
};

const relationTypeLabels: Record<string, string> = {
    SEQUEL: 'Продовження', PREQUEL: 'Приквел', ALTERNATIVE: 'Альтернатива', SPIN_OFF: 'Спін-оф',
    PARENT: 'Основний', CHARACTER: 'Персонаж', SIDE_STORY: 'Побічна історія', SOURCE: 'Джерело',
    SUMMARY: 'Підсумок', OTHER: 'Інше', ADAPTATION: 'Адаптація',
};

const edgePath = (section: RoutedEdge['sections'][number]) => {
    const points = [section.startPoint, ...(section.bendPoints || []), section.endPoint];
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
};

// Some browsers disallow extension workers from content-script contexts. Keep the
// graph usable in that case while retaining ELK as the normal layout engine.
const createFallbackLayout = (nodes: GraphNode[], edges: GraphEdge[], currentNodeId?: string): GraphLayout => {
    const currentIndex = Math.max(0, nodes.findIndex(node => node.id === currentNodeId));
    const ordered = currentIndex > 0 ? [nodes[currentIndex], ...nodes.filter((_, index) => index !== currentIndex)] : nodes;
    const columns = Math.max(1, Math.ceil(Math.sqrt(ordered.length)));
    const positioned = ordered.map((node, index) => ({
        ...node,
        x: GRAPH_PADDING + (index % columns) * (CARD_WIDTH + 92),
        y: GRAPH_PADDING + Math.floor(index / columns) * (CARD_HEIGHT + 72),
    }));
    const byId = new Map(positioned.map(node => [node.id, node]));
    return {
        nodes: positioned,
        edges: edges.flatMap((edge, index) => {
            const source = byId.get(edge.source);
            const target = byId.get(edge.target);
            if (!source || !target) return [];
            const startPoint = { x: source.x + CARD_WIDTH, y: source.y + CARD_HEIGHT / 2 };
            const endPoint = { x: target.x, y: target.y + CARD_HEIGHT / 2 };
            return [{ edge, id: `fallback:${index}`, sections: [{ startPoint, bendPoints: [{ x: (startPoint.x + endPoint.x) / 2, y: startPoint.y }, { x: (startPoint.x + endPoint.x) / 2, y: endPoint.y }], endPoint }] }];
        }),
        width: GRAPH_PADDING * 2 + columns * CARD_WIDTH + Math.max(0, columns - 1) * 92,
        height: GRAPH_PADDING * 2 + Math.ceil(ordered.length / columns) * CARD_HEIGHT + Math.max(0, Math.ceil(ordered.length / columns) - 1) * 72,
    };
};

const createLayout = async (nodes: GraphNode[], edges: GraphEdge[]): Promise<GraphLayout> => {
    const ids = new Set(nodes.map(node => node.id));
    const validEdges = edges.filter(edge => ids.has(edge.source) && ids.has(edge.target));
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();

    validEdges.forEach(edge => {
        incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
        outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
    });

    const graph = await (await getElk()).layout({
        id: 'relations',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'RIGHT',
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.layered.cycleBreaking.strategy': 'GREEDY',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            'elk.layered.nodePlacement.favorStraightEdges': 'true',
            'elk.layered.nodePlacement.bk.edgeStraightening': 'IMPROVE_STRAIGHTNESS',
            // Let ELK reorder nodes inside every layer. Preserving API order here
            // was pinning unrelated cards into crossing routes.
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
            'elk.layered.crossingMinimization.forceNodeModelOrder': 'false',
            'elk.layered.mergeEdges': 'false',
            'elk.layered.unnecessaryBendpoints': 'false',
            'elk.spacing.nodeNode': '104',
            'elk.layered.spacing.nodeNodeBetweenLayers': '208',
            'elk.layered.spacing.edgeNodeBetweenLayers': '44',
            'elk.layered.spacing.edgeEdgeBetweenLayers': '32',
            'elk.padding': `[top=${GRAPH_PADDING},left=${GRAPH_PADDING},bottom=${GRAPH_PADDING},right=${GRAPH_PADDING}]`,
        },
        children: nodes.map(node => ({
            id: node.id,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            layoutOptions: { 'elk.portConstraints': 'FIXED_ORDER' },
            ports: [
                ...Array.from({ length: incoming.get(node.id) || 0 }, (_, index) => ({
                    id: `${node.id}:in:${index}`,
                    width: 1,
                    height: 1,
                    layoutOptions: { 'elk.port.side': 'WEST' },
                })),
                ...Array.from({ length: outgoing.get(node.id) || 0 }, (_, index) => ({
                    id: `${node.id}:out:${index}`,
                    width: 1,
                    height: 1,
                    layoutOptions: { 'elk.port.side': 'EAST' },
                })),
            ],
        })),
        edges: validEdges.map((edge, index) => {
            const inputIndex = validEdges.slice(0, index).filter(item => item.target === edge.target).length;
            const outputIndex = validEdges.slice(0, index).filter(item => item.source === edge.source).length;
            return {
                id: `edge:${index}`,
                sources: [`${edge.source}:out:${outputIndex}`],
                targets: [`${edge.target}:in:${inputIndex}`],
            };
        }),
    });

    const routedById = new Map((graph.edges || []).map(edge => [edge.id, edge]));
    return {
        nodes: nodes.map(node => {
            const positioned = graph.children?.find(child => child.id === node.id);
            return { ...node, x: positioned?.x || 0, y: positioned?.y || 0 };
        }),
        edges: validEdges.map((edge, index) => {
            const routed = routedById.get(`edge:${index}`);
            return { edge, id: `edge:${index}`, sections: (routed?.sections || []) as RoutedEdge['sections'] };
        }),
        width: graph.width || CARD_WIDTH + GRAPH_PADDING * 2,
        height: graph.height || CARD_HEIGHT + GRAPH_PADDING * 2,
    };
};

export const RelationsGraphContent: React.FC<RelationsGraphContentProps> = ({ nodes, edges, currentNodeId, relationTypes }) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState<GraphLayout | null>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const stateRef = useRef({ pan, zoom });
    stateRef.current = { pan, zoom };

    useEffect(() => {
        let active = true;
        const timeout = window.setTimeout(() => {
            if (active) {
                console.error('[Hikka Forge] ELK layout worker timed out; using the graph fallback.');
                setLayout(createFallbackLayout(nodes, edges, currentNodeId));
            }
        }, 3000);
        setLayout(null);
        createLayout(nodes, edges)
            .then(result => { if (active) setLayout(result); })
            .catch(error => {
                console.error('[Hikka Forge] ELK layout failed; using the graph fallback.', error);
                if (active) setLayout(createFallbackLayout(nodes, edges, currentNodeId));
            })
            .finally(() => window.clearTimeout(timeout));
        return () => { active = false; window.clearTimeout(timeout); };
    }, [nodes, edges, currentNodeId]);

    useLayoutEffect(() => {
        const updateSize = () => {
            const rect = viewportRef.current?.getBoundingClientRect();
            if (!rect) return;
            setViewportSize(previous => (
                previous.width === rect.width && previous.height === rect.height
                    ? previous
                    : { width: rect.width, height: rect.height }
            ));
        };
        updateSize();

        const viewport = viewportRef.current;
        const observer = typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(updateSize);
        if (observer && viewport) observer.observe(viewport);
        window.addEventListener('resize', updateSize);

        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    // Open on a complete overview so the page is useful immediately. The user
    // can still zoom into the current title with the regular map controls.
    useEffect(() => {
        if (!layout || !viewportSize.width || !viewportSize.height) return;
        const nextZoom = clampZoom(Math.min(
            viewportSize.width / (layout.width * 1.12),
            viewportSize.height / (layout.height * 1.12),
            1.15,
        ));
        setZoom(nextZoom);
        setPan({
            x: (viewportSize.width - layout.width * nextZoom) / 2,
            y: (viewportSize.height - layout.height * nextZoom) / 2,
        });
    }, [layout, viewportSize.width, viewportSize.height]);

    const visibleNodes = useMemo(() => {
        if (!layout) return [];
        const query = searchQuery.trim().toLowerCase();
        if (!query) return layout.nodes;
        return layout.nodes.filter(node => node.title.toLowerCase().includes(query) || node.type.includes(query) || String(node.year).includes(query));
    }, [layout, searchQuery]);
    const visibleIds = useMemo(() => new Set(visibleNodes.map(node => node.id)), [visibleNodes]);
    const visibleEdges = useMemo(() => layout?.edges.filter(({ edge }) => visibleIds.has(edge.source) && visibleIds.has(edge.target)) || [], [layout, visibleIds]);

    const clampZoom = (value: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    const zoomAt = useCallback((x: number, y: number, nextZoom: number) => {
        const current = stateRef.current;
        const newZoom = clampZoom(nextZoom);
        const ratio = newZoom / current.zoom;
        setPan({ x: x - (x - current.pan.x) * ratio, y: y - (y - current.pan.y) * ratio });
        setZoom(newZoom);
    }, []);
    const handleFit = useCallback(() => {
        if (!layout || !viewportSize.width || !viewportSize.height) return;
        const nextZoom = clampZoom(Math.min(viewportSize.width / (layout.width * 1.15), viewportSize.height / (layout.height * 1.15)));
        setZoom(nextZoom);
        setPan({ x: (viewportSize.width - layout.width * nextZoom) / 2, y: (viewportSize.height - layout.height * nextZoom) / 2 });
    }, [layout, viewportSize]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            const rect = viewport.getBoundingClientRect();
            zoomAt(event.clientX - rect.left, event.clientY - rect.top, stateRef.current.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
        };
        viewport.addEventListener('wheel', onWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', onWheel);
    }, [zoomAt]);

    const pointersRef = useRef(new Map<number, Point>());
    const gestureRef = useRef<{
        type: 'pan' | 'pinch';
        startPoint?: Point;
        startDistance?: number;
        startCenter?: Point;
        startPan: Point;
        startZoom: number;
    } | null>(null);

    const getViewportPoint = (event: React.PointerEvent<HTMLDivElement>): Point => {
        const rect = viewportRef.current?.getBoundingClientRect();
        return {
            x: event.clientX - (rect?.left || 0),
            y: event.clientY - (rect?.top || 0),
        };
    };

    const getPinchData = () => {
        const points = Array.from(pointersRef.current.values()).slice(0, 2);
        if (points.length < 2) return null;
        const [first, second] = points;
        return {
            distance: Math.hypot(second.x - first.x, second.y - first.y),
            center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        };
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) return;
        if ((event.target as HTMLElement).closest('input, button, a, [data-pan-exclude]')) return;
        event.preventDefault();
        const point = getViewportPoint(event);
        pointersRef.current.set(event.pointerId, point);
        event.currentTarget.setPointerCapture(event.pointerId);

        const pinch = getPinchData();
        if (pinch) {
            gestureRef.current = {
                type: 'pinch',
                startDistance: Math.max(pinch.distance, 1),
                startCenter: pinch.center,
                startPan: stateRef.current.pan,
                startZoom: stateRef.current.zoom,
            };
            return;
        }

        gestureRef.current = {
            type: 'pan',
            startPoint: point,
            startPan: stateRef.current.pan,
            startZoom: stateRef.current.zoom,
        };
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!pointersRef.current.has(event.pointerId)) return;
        event.preventDefault();
        pointersRef.current.set(event.pointerId, getViewportPoint(event));

        const pinch = getPinchData();
        const gesture = gestureRef.current;
        if (pinch && gesture?.type === 'pinch' && gesture.startCenter && gesture.startDistance) {
            const nextZoom = clampZoom(gesture.startZoom * (pinch.distance / gesture.startDistance));
            const ratio = nextZoom / gesture.startZoom;
            setPan({
                x: pinch.center.x - (gesture.startCenter.x - gesture.startPan.x) * ratio,
                y: pinch.center.y - (gesture.startCenter.y - gesture.startPan.y) * ratio,
            });
            setZoom(nextZoom);
            return;
        }

        if (pointersRef.current.size === 1 && gesture?.type === 'pan' && gesture.startPoint) {
            const point = pointersRef.current.get(event.pointerId) || gesture.startPoint;
            setPan({
                x: gesture.startPan.x + point.x - gesture.startPoint.x,
                y: gesture.startPan.y + point.y - gesture.startPoint.y,
            });
        }
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        pointersRef.current.delete(event.pointerId);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        const remainingPoint = pointersRef.current.values().next().value as Point | undefined;
        if (remainingPoint) {
            gestureRef.current = {
                type: 'pan',
                startPoint: remainingPoint,
                startPan: stateRef.current.pan,
                startZoom: stateRef.current.zoom,
            };
        } else {
            gestureRef.current = null;
        }
    };

    return (
        <div
            ref={viewportRef}
            className="relative size-full touch-none overflow-hidden bg-background/95"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {layout && <div className="absolute left-0 top-0" style={{ width: layout.width, height: layout.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                <div
                    className="pointer-events-none absolute opacity-60 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]"
                    style={{ inset: -2048 }}
                />
                <svg className="absolute inset-0 size-full overflow-visible pointer-events-none" aria-hidden="true">
                    <defs>{Array.from(new Set(visibleEdges.map(({ edge }) => edge.relationType))).map(type => <marker key={type} id={`relation-arrow-${type}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill={relationTypeColors[type] || relationTypeColors.OTHER} /></marker>)}</defs>
                    {visibleEdges.flatMap(({ edge, id, sections }) => sections.map((section, index) => <path key={`${id}-${index}`} d={edgePath(section)} fill="none" stroke={relationTypeColors[edge.relationType] || relationTypeColors.OTHER} strokeOpacity="0.76" strokeWidth="2.2" markerEnd={`url(#relation-arrow-${edge.relationType})`} />))}
                </svg>
                {visibleNodes.map(node => <RelationCard key={node.id} node={node} isCurrent={node.id === currentNodeId} />)}
            </div>}

            {!layout && <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground">Підготовка графа…</div>}

            <div className="absolute inset-x-2 top-2 z-20 flex flex-col items-stretch gap-2 sm:inset-x-4 sm:top-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex min-w-0 w-full items-center overflow-hidden rounded-lg border border-border/70 bg-background/70 shadow-lg backdrop-blur-md sm:w-auto sm:max-w-[min(24rem,calc(100%-7rem))]">

                    <Icon
                        icon="material-symbols:search"
                        className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                    />

                    <Input
                        placeholder="Пошук у графі..."
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                        className="h-9 w-full border-0 bg-transparent pl-8 pr-8 shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 !border-none !ring-0"
                    />

                    {searchQuery && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 hover:bg-transparent"
                            aria-label="Очистити пошук"
                        >
                            <Icon icon="material-symbols:close" className="size-4" />
                        </Button>
                    )}

                </div>
                <div className="flex shrink-0 self-end gap-1 rounded-lg border border-border/70 bg-background/70 p-1 shadow-lg backdrop-blur-md sm:self-auto">
                    <Button size="icon-sm" variant="ghost" onClick={() => zoomAt(viewportSize.width / 2, viewportSize.height / 2, zoom * 1.2)} title="Збільшити" aria-label="Збільшити"><Icon icon="material-symbols:add" /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => zoomAt(viewportSize.width / 2, viewportSize.height / 2, zoom * 0.8)} title="Зменшити" aria-label="Зменшити"><Icon icon="material-symbols:remove" /></Button>
                    <Button size="icon-sm" variant="ghost" onClick={handleFit} title="Вмістити" aria-label="Вмістити"><Icon icon="material-symbols:fit-screen" /></Button>
                </div>
            </div>
            <div className="absolute inset-x-2 bottom-2 z-20 flex max-h-[35%] flex-col items-stretch gap-2 overflow-hidden sm:inset-x-4 sm:bottom-4 sm:max-h-none sm:flex-row sm:items-end sm:overflow-visible">

                <div className="flex w-fit max-w-full shrink-0 items-center rounded-lg border border-border/70 bg-background/90 px-2 py-1.5 text-[11px] text-muted-foreground shadow-lg backdrop-blur-md sm:px-3 sm:text-xs">
                    <span className="whitespace-nowrap font-mono">
                        {Math.round(zoom * 100)}% · {visibleNodes.length} вузлів
                    </span>
                </div>

                {relationTypes.length > 0 && (
                    <div className="flex max-h-[8rem] max-w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-1 overflow-y-auto rounded-lg border border-border/70 bg-background/90 px-2 py-1.5 text-[11px] text-muted-foreground shadow-lg backdrop-blur-md sm:max-h-none sm:max-w-[calc(100%-13rem)] sm:gap-x-4 sm:overflow-visible sm:px-3 sm:text-xs">
                        {relationTypes.map(type => (
                            <span key={type} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span
                                    className="inline-block size-2.5 shrink-0 rounded-full shadow-sm sm:size-3"
                                    style={{ backgroundColor: relationTypeColors[type] || '#6b7280' }}
                                />
                                {relationTypeLabels[type] || type}
                            </span>
                        ))}
                    </div>
                )}

                <div className="ml-auto hidden shrink-0 items-center rounded-lg border border-border/70 bg-background/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow-lg backdrop-blur-md sm:flex sm:text-xs">
                    <span className="whitespace-nowrap">
                        Перетягуйте, щоб оглянути · колесо — масштаб
                    </span>
                </div>

            </div>
        </div>
    );
};

const RelationCard: React.FC<{ node: LayoutNode; isCurrent: boolean }> = ({ node, isCurrent }) => (
    <article className={cn('surface bg-card/80 absolute flex h-[148px] w-[280px] gap-4 overflow-hidden rounded-xl border p-3 shadow-xl shadow-black/15 transition-shadow', isCurrent ? 'border-amber-400/80 ring-2 ring-amber-400/25' : 'border-border/70')} style={{ left: node.x, top: node.y }} data-pan-exclude>
        <img src={node.imageUrl} alt="" className="h-[124px] w-[84px] shrink-0 rounded-lg bg-muted object-cover" />
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
            <Link
                href={`/${node.type}/${node.slug}`}
                className={cn(
                    'line-clamp-3 text-[15px] font-semibold leading-5',
                    isCurrent
                        ? 'text-amber-500 hover:text-amber-300'
                        : 'text-foreground hover:text-foreground hover:underline',
                )}
            >
                {node.title}
            </Link>
            <span className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">{node.status || 'Статус не вказано'}</span>
            <span className="mt-auto text-xs text-muted-foreground">{[node.year > 0 ? node.year : null, node.format].filter(Boolean).join(' • ') || node.type}</span>
        </div>
    </article>
);
