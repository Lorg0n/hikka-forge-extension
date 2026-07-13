import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GraphEdge, GraphNode } from '@/types';
import { RelationsNodeLabel } from './RelationsNodeLabel';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

interface RelationsGraphContentProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    currentNodeId?: string;
}

interface PositionedNode extends GraphNode {
    x: number;
    y: number;
}

interface LayoutBounds {
    minX: number;
    minY: number;
    width: number;
    height: number;
}

const NODE_RADIUS = 6;
const CURRENT_NODE_RADIUS = 8;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const PADDING = 60;
const COLUMN_WIDTH = 320;
const ROW_HEIGHT = 64;

const typeColors: Record<string, string> = {
    anime: '#3b82f6',
    manga: '#10b981',
    novel: '#a855f7',
};

const relationTypeColors: Record<string, string> = {
    SEQUEL: '#22c55e',
    PREQUEL: '#3b82f6',
    ALTERNATIVE: '#a855f7',
    SPIN_OFF: '#f59e0b',
    PARENT: '#ef4444',
    CHARACTER: '#06b6d4',
    SIDE_STORY: '#14b8a6',
    SOURCE: '#84cc16',
    SUMMARY: '#eab308',
    OTHER: '#6b7280',
    ADAPTATION: '#ec4899',
};

/**
 * Layered BFS layout: assigns each node a layer = shortest-path distance
 * from the current node. Nodes are placed in vertical columns by layer.
 * This produces an organized, "map-like" diagram with clear flow from
 * the current title outward through its relations.
 */
const runLayeredLayout = (
    nodes: GraphNode[],
    edges: GraphEdge[],
    currentNodeId: string | undefined
): PositionedNode[] => {
    if (nodes.length === 0) return [];

    const nodeIds = new Set(nodes.map(n => n.id));
    const adjacency = new Map<string, Set<string>>();
    nodes.forEach(n => adjacency.set(n.id, new Set()));
    edges.forEach(e => {
        if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
            adjacency.get(e.source)!.add(e.target);
            adjacency.get(e.target)!.add(e.source);
        }
    });

    const layerOf = new Map<string, number>();
    const startId =
        currentNodeId && nodeIds.has(currentNodeId)
            ? currentNodeId
            : nodes[0].id;

    const queue: string[] = [startId];
    layerOf.set(startId, 0);
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const u = queue.shift()!;
        const lu = layerOf.get(u)!;
        for (const v of adjacency.get(u) || []) {
            if (!visited.has(v)) {
                visited.add(v);
                layerOf.set(v, lu + 1);
                queue.push(v);
            }
        }
    }

    const maxAssigned = Math.max(0, ...Array.from(layerOf.values()));
    nodes.forEach(n => {
        if (!layerOf.has(n.id)) {
            layerOf.set(n.id, maxAssigned + 1);
        }
    });

    const groups = new Map<number, GraphNode[]>();
    nodes.forEach(n => {
        const l = layerOf.get(n.id)!;
        if (!groups.has(l)) groups.set(l, []);
        groups.get(l)!.push(n);
    });

    const sortedLayers = Array.from(groups.keys()).sort((a, b) => a - b);
    const maxGroupSize = Math.max(
        ...Array.from(groups.values()).map(g => g.length)
    );

    const totalHeight = maxGroupSize * ROW_HEIGHT;
    const positions: PositionedNode[] = [];

    sortedLayers.forEach((layerIdx, col) => {
        const group = groups.get(layerIdx)!;
        const x = col * COLUMN_WIDTH;
        const groupHeight = (group.length - 1) * ROW_HEIGHT;
        const yStart = totalHeight / 2 - groupHeight / 2;

        group.forEach((node, i) => {
            positions.push({ ...node, x, y: yStart + i * ROW_HEIGHT });
        });
    });

    return positions;
};

const computeBounds = (positions: PositionedNode[]): LayoutBounds => {
    if (positions.length === 0) {
        return { minX: 0, minY: 0, width: 1000, height: 600 };
    }
    const xs = positions.map(n => n.x);
    const ys = positions.map(n => n.y);
    const minX = Math.min(...xs) - PADDING;
    const maxX = Math.max(...xs) + PADDING + 160; // extra for label width
    const minY = Math.min(...ys) - PADDING;
    const maxY = Math.max(...ys) + PADDING;
    return {
        minX,
        minY,
        width: maxX - minX,
        height: maxY - minY,
    };
};

export const RelationsGraphContent: React.FC<RelationsGraphContentProps> = ({
    nodes,
    edges,
    currentNodeId,
}) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
    const stateRef = useRef({ pan, zoom });
    stateRef.current = { pan, zoom };

    const positionedNodes = useMemo(
        () => runLayeredLayout(nodes, edges, currentNodeId),
        [nodes, edges, currentNodeId]
    );

    const bounds = useMemo(() => computeBounds(positionedNodes), [positionedNodes]);

    const nodeMap = useMemo(() => {
        const map = new Map<string, PositionedNode>();
        positionedNodes.forEach(n => map.set(n.id, n));
        return map;
    }, [positionedNodes]);

    const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

    const zoomAt = (mx: number, my: number, newZoom: number) => {
        const { pan, zoom } = stateRef.current;
        const nz = clampZoom(newZoom);
        const ratio = nz / zoom;
        setPan({
            x: mx - (mx - pan.x) * ratio,
            y: my - (my - pan.y) * ratio,
        });
        setZoom(nz);
    };

    const handleFit = useCallback(() => {
        const vp = viewportRef.current;
        if (!vp || positionedNodes.length === 0) return;
        const rect = vp.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const scaleX = rect.width / bounds.width;
        const scaleY = rect.height / bounds.height;
        const newZoom = clampZoom(Math.min(scaleX, scaleY) * 0.95);
        setZoom(newZoom);
        setPan({
            x: -bounds.minX * newZoom,
            y: -bounds.minY * newZoom,
        });
    }, [positionedNodes, bounds]);

    // Fit on mount and when data changes
    useLayoutEffect(() => {
        handleFit();
    }, [handleFit]);

    // Wheel zoom
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const vp = viewportRef.current;
            if (!vp) return;
            const rect = vp.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const { zoom } = stateRef.current;
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            zoomAt(mx, my, zoom * factor);
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    // Mouse pan
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 && e.button !== 1) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startPan = { ...stateRef.current.pan };
        const onMove = (ev: MouseEvent) => {
            setPan({
                x: startPan.x + (ev.clientX - startX),
                y: startPan.y + (ev.clientY - startY),
            });
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleZoomIn = () => {
        const vp = viewportRef.current;
        if (!vp) return;
        const rect = vp.getBoundingClientRect();
        zoomAt(rect.width / 2, rect.height / 2, stateRef.current.zoom * 1.2);
    };
    const handleZoomOut = () => {
        const vp = viewportRef.current;
        if (!vp) return;
        const rect = vp.getBoundingClientRect();
        zoomAt(rect.width / 2, rect.height / 2, stateRef.current.zoom * 0.8);
    };

    return (
        <div ref={viewportRef} className="relative w-full h-full overflow-hidden">
            <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                }}
                onMouseDown={handleMouseDown}
            >
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Edges */}
                    {edges.map(edge => {
                        const source = nodeMap.get(edge.source);
                        const target = nodeMap.get(edge.target);
                        if (!source || !target) return null;

                        const color = relationTypeColors[edge.relationType] || '#6b7280';
                        const isHovered =
                            hoveredEdge === `${edge.source}-${edge.target}`;

                        return (
                            <line
                                key={`${edge.source}-${edge.target}`}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke={color}
                                strokeWidth={isHovered ? 2.5 : 1}
                                strokeOpacity={isHovered ? 1 : 0.5}
                            >
                                <title>{edge.relationType}</title>
                            </line>
                        );
                    })}

                    {/* Node circles */}
                    {positionedNodes.map(node => {
                        const isCurrent = node.id === currentNodeId;
                        const color = typeColors[node.type] || '#6b7280';
                        return (
                            <g key={`dot-${node.id}`}>
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={isCurrent ? CURRENT_NODE_RADIUS : NODE_RADIUS}
                                    fill={color}
                                />
                                {isCurrent && (
                                    <circle
                                        cx={node.x}
                                        cy={node.y}
                                        r={CURRENT_NODE_RADIUS + 3}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        className="text-primary"
                                        strokeOpacity={0.6}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Labels */}
                {positionedNodes.map(node => (
                    <div
                        key={`label-${node.id}`}
                        className="absolute"
                        style={{
                            left: `${((node.x - bounds.minX) / bounds.width) * 100}%`,
                            top: `${((node.y - bounds.minY) / bounds.height) * 100}%`,
                            transform: 'translate(14px, -50%)',
                        }}
                        onMouseEnter={() => {
                            const related = new Set(
                                edges
                                    .filter(
                                        e =>
                                            e.source === node.id || e.target === node.id
                                    )
                                    .map(e => `${e.source}-${e.target}`)
                            );
                            if (related.size > 0) {
                                setHoveredEdge(Array.from(related)[0]);
                            }
                        }}
                        onMouseLeave={() => setHoveredEdge(null)}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <RelationsNodeLabel
                            node={node}
                            isCurrent={node.id === currentNodeId}
                        />
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                <Button size="icon-sm" variant="secondary" onClick={handleZoomIn} title="Збільшити">
                    <Icon icon="material-symbols:add" />
                </Button>
                <Button size="icon-sm" variant="secondary" onClick={handleZoomOut} title="Зменшити">
                    <Icon icon="material-symbols:remove" />
                </Button>
                <Button size="icon-sm" variant="secondary" onClick={handleFit} title="Вмістити">
                    <Icon icon="material-symbols:fit-screen" />
                </Button>
            </div>

            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-secondary/80 text-secondary-foreground text-xs font-mono z-10 pointer-events-none">
                {Math.round(zoom * 100)}%
            </div>
        </div>
    );
};
