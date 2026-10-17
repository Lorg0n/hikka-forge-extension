import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ELK, { type ELK as ElkInstance, type ElkNode } from 'elkjs/lib/elk-api.js';
import elkWorkerUrl from 'elkjs/lib/elk-worker.min.js?url';
import { GraphEdge, GraphNode } from '@/types';
import Link from '@/components/typography/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { getContentTypeLabel, getMediaTypeLabel, getReleaseStatusLabel } from '@/constants';

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
let elkPromise: Promise<ElkInstance> | null = null;

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

    const graph = await (await getElk()).layout<ElkNode>({
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
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [layout, setLayout] = useState<GraphLayout | null>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(currentNodeId);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>();
    const [isSelectionDimmed, setIsSelectionDimmed] = useState(Boolean(currentNodeId));
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const stateRef = useRef({ pan, zoom });
    const panAnimationRef = useRef<number | null>(null);
    const initiallyFocusedLayoutRef = useRef<GraphLayout | null>(null);
    const previousViewportSizeRef = useRef({ width: 0, height: 0 });
    stateRef.current = { pan, zoom };

    const stopPanAnimation = useCallback(() => {
        if (panAnimationRef.current !== null) {
            window.cancelAnimationFrame(panAnimationRef.current);
            panAnimationRef.current = null;
        }
    }, []);

    useEffect(() => () => stopPanAnimation(), [stopPanAnimation]);

    useEffect(() => {
        const syncFullscreenState = () => {
            setIsFullscreen(Boolean(fullscreenRef.current?.matches(':fullscreen')));
        };

        document.addEventListener('fullscreenchange', syncFullscreenState);
        syncFullscreenState();
        return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
    }, []);

    const toggleFullscreen = async () => {
        const container = fullscreenRef.current;
        if (!container) return;

        try {
            if (container.matches(':fullscreen')) {
                await document.exitFullscreen();
            } else {
                await container.requestFullscreen();
            }
        } catch {
            setIsFullscreen(container.matches(':fullscreen'));
        }
    };

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

    useEffect(() => {
        setSelectedNodeId(currentNodeId);
        setSelectedEdgeId(undefined);
        setIsSelectionDimmed(Boolean(currentNodeId));
    }, [currentNodeId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setSelectedNodeId(undefined);
            setSelectedEdgeId(undefined);
            setIsSelectionDimmed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    // Keep the same graph point centered when the viewport changes size, most
    // notably when switching to and from fullscreen.
    useLayoutEffect(() => {
        const previous = previousViewportSizeRef.current;
        previousViewportSizeRef.current = viewportSize;
        if (!previous.width || !previous.height || !viewportSize.width || !viewportSize.height) return;
        const offsetX = (viewportSize.width - previous.width) / 2;
        const offsetY = (viewportSize.height - previous.height) / 2;
        if (!offsetX && !offsetY) return;
        setPan(current => ({ x: current.x + offsetX, y: current.y + offsetY }));
    }, [viewportSize]);

    // The graph opens focused on the title from which the user entered it.
    useEffect(() => {
        if (!layout || !viewportSize.width || !viewportSize.height) return;
        if (initiallyFocusedLayoutRef.current === layout) return;
        initiallyFocusedLayoutRef.current = layout;
        const currentNode = layout.nodes.find(node => node.id === currentNodeId) || layout.nodes[0];
        if (!currentNode) return;
        const nextZoom = clampZoom(Math.min(
            0.85,
            viewportSize.width / (CARD_WIDTH + GRAPH_PADDING * 2),
            viewportSize.height / (CARD_HEIGHT + GRAPH_PADDING * 2),
        ));
        setZoom(nextZoom);
        setPan({
            x: viewportSize.width / 2 - (currentNode.x + CARD_WIDTH / 2) * nextZoom,
            y: viewportSize.height / 2 - (currentNode.y + CARD_HEIGHT / 2) * nextZoom,
        });
    }, [layout, viewportSize.width, viewportSize.height, currentNodeId]);

    const searchResults = useMemo(() => {
        if (!layout) return [];
        const query = searchQuery.trim().toLowerCase();
        if (!query) return [];
        return layout.nodes
            .filter(node => node.title.toLowerCase().includes(query) || node.type.includes(query) || String(node.year).includes(query))
            .sort((left, right) => Number(!left.title.toLowerCase().startsWith(query)) - Number(!right.title.toLowerCase().startsWith(query)))
            .slice(0, 10);
    }, [layout, searchQuery]);
    const visibleNodes = layout?.nodes || [];
    const visibleEdges = layout?.edges || [];
    const selectedNodeIds = useMemo(() => {
        if (selectedEdgeId) {
            const selectedEdge = visibleEdges.find(({ id }) => id === selectedEdgeId)?.edge;
            return new Set(selectedEdge ? [selectedEdge.source, selectedEdge.target] : []);
        }
        return new Set(selectedNodeId ? [selectedNodeId] : []);
    }, [selectedEdgeId, selectedNodeId, visibleEdges]);

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

    const focusNode = useCallback((node: LayoutNode) => {
        if (!viewportSize.width || !viewportSize.height) return;
        stopPanAnimation();
        const startPan = stateRef.current.pan;
        const activeZoom = stateRef.current.zoom;
        const targetPan = {
            x: viewportSize.width / 2 - (node.x + CARD_WIDTH / 2) * activeZoom,
            y: viewportSize.height / 2 - (node.y + CARD_HEIGHT / 2) * activeZoom,
        };
        const startedAt = performance.now();
        const duration = 560;
        const animate = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - (1 - progress) ** 3;
            setPan({
                x: startPan.x + (targetPan.x - startPan.x) * eased,
                y: startPan.y + (targetPan.y - startPan.y) * eased,
            });
            if (progress < 1) {
                panAnimationRef.current = window.requestAnimationFrame(animate);
            } else {
                panAnimationRef.current = null;
            }
        };
        panAnimationRef.current = window.requestAnimationFrame(animate);
    }, [stopPanAnimation, viewportSize]);

    const selectNode = useCallback((node: LayoutNode, shouldFocus = true) => {
        setSelectedNodeId(node.id);
        setSelectedEdgeId(undefined);
        setIsSelectionDimmed(true);
        setSearchQuery('');
        setIsSearchFocused(false);
        if (shouldFocus) focusNode(node);
    }, [focusNode]);

    const selectEdge = useCallback((edgeId: string) => {
        setSelectedNodeId(undefined);
        setSelectedEdgeId(edgeId);
        setIsSelectionDimmed(true);
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            stopPanAnimation();
            const rect = viewport.getBoundingClientRect();
            zoomAt(event.clientX - rect.left, event.clientY - rect.top, stateRef.current.zoom * (event.deltaY < 0 ? 1.1 : 0.9));
        };
        viewport.addEventListener('wheel', onWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', onWheel);
    }, [stopPanAnimation, zoomAt]);

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
        stopPanAnimation();
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
        const gesture = gestureRef.current;
        const point = getViewportPoint(event);
        const isClick = gesture?.type === 'pan' && gesture.startPoint && Math.hypot(point.x - gesture.startPoint.x, point.y - gesture.startPoint.y) < 6;
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
            if (isClick) {
                setSelectedNodeId(undefined);
                setSelectedEdgeId(undefined);
                setIsSelectionDimmed(false);
            }
        }
    };

    const toolbar = (
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="relative h-8 w-40 min-w-0 sm:w-80">
                <div className="flex size-full items-center overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-xs dark:border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                    <Icon
                        icon="material-symbols:search"
                        className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        placeholder="Пошук у графі..."
                        value={searchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        onChange={event => setSearchQuery(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter' && searchResults[0]) {
                                event.preventDefault();
                                selectNode(searchResults[0]);
                            }
                        }}
                        className="h-8 w-full border-0 bg-transparent pl-8 pr-8 shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 !border-none !ring-0"
                    />
                    {searchQuery && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => setSearchQuery('')}
                            className="absolute right-1 top-1/2 z-10 -translate-y-1/2 hover:bg-transparent"
                            aria-label="Очистити пошук"
                        >
                            <Icon icon="material-symbols:close" className="size-4" />
                        </Button>
                    )}
                </div>
                {isSearchFocused && searchQuery.trim() && (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md">
                        {searchResults.length > 0 ? searchResults.map(node => (
                            <button
                                key={node.id}
                                type="button"
                                onMouseDown={event => {
                                    event.preventDefault();
                                    selectNode(node);
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
                            >
                                <img src={node.imageUrl} alt="" className="h-10 w-7 shrink-0 rounded bg-muted object-cover" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-medium text-foreground">{node.title}</span>
                                    <span className="block truncate text-[11px] text-muted-foreground">{[getContentTypeLabel(node.type), node.year || null].filter(Boolean).join(' · ')}</span>
                                </span>
                            </button>
                        )) : (
                            <p className="px-2 py-3 text-center text-xs text-muted-foreground">Нічого не знайдено</p>
                        )}
                    </div>
                )}
            </div>
            <div className="ml-auto flex shrink-0 gap-2">
                <Button size="icon-sm" variant="outline" onClick={() => zoomAt(viewportSize.width / 2, viewportSize.height / 2, zoom * 1.2)} title="Збільшити" aria-label="Збільшити"><Icon icon="material-symbols:add" /></Button>
                <Button size="icon-sm" variant="outline" onClick={() => zoomAt(viewportSize.width / 2, viewportSize.height / 2, zoom * 0.8)} title="Зменшити" aria-label="Зменшити"><Icon icon="material-symbols:remove" /></Button>
                <Button size="icon-sm" variant="outline" onClick={handleFit} title="Вмістити" aria-label="Вмістити"><Icon icon="material-symbols:fit-screen" /></Button>
                <Button size="icon-sm" variant="outline" onClick={() => void toggleFullscreen()} title={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'} aria-label={isFullscreen ? 'Вийти з повного екрана' : 'На весь екран'}><Icon icon={isFullscreen ? 'material-symbols:fullscreen-exit' : 'material-symbols:fullscreen'} /></Button>
            </div>
        </div>
    );

    return (
        <div
            ref={fullscreenRef}
            className="flex size-full min-h-0 flex-col overflow-hidden bg-transparent fullscreen:size-screen fullscreen:bg-background"
        >
            {toolbar}
            <div
            ref={viewportRef}
            className="relative min-h-0 flex-1 touch-none overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {layout && <div className="absolute left-0 top-0" style={{ width: layout.width, height: layout.height, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute opacity-70 [background-size:24px_24px]"
                    style={{ inset: -2048, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)' }}
                />
                <svg className="absolute inset-0 size-full overflow-visible pointer-events-none" aria-label="Зв'язки між творами">
                    <defs>{Array.from(new Set(visibleEdges.map(({ edge }) => edge.relationType))).map(type => <marker key={type} id={`relation-arrow-${type}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill={relationTypeColors[type] || relationTypeColors.OTHER} /></marker>)}</defs>
                    {visibleEdges.flatMap(({ edge, id, sections }) => sections.map((section, index) => {
                        const isSelected = id === selectedEdgeId;
                        const isConnectedToSelectedNode = Boolean(selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId));
                        const isDimmed = isSelectionDimmed && !(isSelected || isConnectedToSelectedNode);
                        return <path key={`${id}-${index}`} d={edgePath(section)} fill="none" stroke={relationTypeColors[edge.relationType] || relationTypeColors.OTHER} opacity={isDimmed ? 0.22 : 0.76} strokeWidth={isSelected ? 3.2 : 2.2} markerEnd={`url(#relation-arrow-${edge.relationType})`} className="pointer-events-auto cursor-pointer" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); selectEdge(id); }} />;
                    }))}
                </svg>
                {visibleNodes.map(node => <RelationCard key={node.id} node={node} isSelected={selectedNodeIds.has(node.id)} isDimmed={Boolean(isSelectionDimmed && selectedNodeIds.size > 0 && !selectedNodeIds.has(node.id))} onSelect={() => selectNode(node, false)} />)}
            </div>}

            {!layout && <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground">Підготовка графа…</div>}

            <div className="absolute inset-x-2 bottom-2 z-20 flex max-h-[35%] flex-col items-stretch gap-2 overflow-hidden sm:inset-x-4 sm:bottom-4 sm:max-h-none sm:flex-row sm:items-end sm:overflow-visible">

                {relationTypes.length > 0 && (
                    <div className="flex min-h-8 max-h-[8rem] max-w-full shrink-0 flex-wrap items-center gap-x-4 gap-y-1 overflow-y-auto rounded-lg border border-border bg-background/80 px-2.5 py-1 text-xs text-muted-foreground shadow-xs backdrop-blur-sm dark:border-input dark:bg-input/60 sm:max-h-none sm:max-w-[calc(100%-13rem)] sm:overflow-visible">
                        {relationTypes.map(type => (
                            <span key={type} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span
                                    className="inline-block size-2 shrink-0 rounded-full shadow-sm"
                                    style={{ backgroundColor: relationTypeColors[type] || '#6b7280' }}
                                />
                                {relationTypeLabels[type] || type}
                            </span>
                        ))}
                    </div>
                )}

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="ml-auto shrink-0 bg-background/80 backdrop-blur-sm dark:bg-input/60"
                            aria-label="Керування графом"
                        >
                            <Icon icon="material-symbols:help-outline-rounded" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent container={fullscreenRef.current} side="top" align="end" className="w-72 p-0" collisionPadding={12}>
                        <div className="border-b border-border px-3 py-2.5 text-sm font-medium text-foreground">
                            Керування графом
                        </div>
                        <div className="grid gap-1 p-2">
                            <div className="flex items-center gap-3 rounded-md px-2 py-2">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-xs dark:border-input dark:bg-input/30">
                                    <Icon icon="material-symbols:open-with-rounded" className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground">Переміщення</p>
                                    <p className="text-xs leading-4 text-muted-foreground">Затисніть та перетягуйте поле</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-md px-2 py-2">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-xs dark:border-input dark:bg-input/30">
                                    <Icon icon="material-symbols:zoom-in-rounded" className="size-4" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-foreground">Масштабування</p>
                                    <p className="text-xs leading-4 text-muted-foreground">Прокручуйте колесо миші</p>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

            </div>
            </div>
        </div>
    );
};

const RelationCard: React.FC<{ node: LayoutNode; isSelected: boolean; isDimmed: boolean; onSelect: () => void }> = ({ node, isSelected, isDimmed, onSelect }) => {
    const status = getReleaseStatusLabel(node.status);
    const mediaType = getMediaTypeLabel(node.format);
    const contentType = getContentTypeLabel(node.type);

    return (
    <article
        className={cn('surface absolute flex h-[148px] w-[280px] gap-4 overflow-hidden rounded-lg border border-border p-3 backdrop-blur-md transition-[opacity,box-shadow,border-color,transform] duration-200', isSelected ? 'scale-[1.02] border-primary-foreground/70 ring-2 ring-primary-foreground/20' : '', isDimmed ? 'opacity-45' : '')}
        style={{ left: node.x, top: node.y, backgroundColor: 'color-mix(in oklab, var(--card) 96%, transparent)' }}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => {
            if ((event.target as HTMLElement).closest('a')) return;
            onSelect();
        }}
    >
        <img src={node.imageUrl} alt="" className="h-[124px] w-[84px] shrink-0 rounded-lg bg-muted object-cover" />
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
            <Link
                href={`/${node.type}/${node.slug}`}
                className={cn(
                    'line-clamp-3 text-[15px] font-semibold leading-5',
                    isSelected
                        ? 'text-primary-foreground hover:text-primary-foreground hover:underline'
                        : 'text-foreground hover:text-foreground hover:underline',
                )}
            >
                {node.title}
            </Link>
            <span className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">{status || 'Статус не вказано'}</span>
            <span className="mt-auto text-xs text-muted-foreground">{[node.year > 0 ? node.year : null, mediaType].filter(Boolean).join(' • ') || contentType}</span>
        </div>
    </article>
    );
};
