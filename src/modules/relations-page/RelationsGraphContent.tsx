import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GraphEdge, GraphNode } from '@/types';
import { RelationsNodeLabel } from './RelationsNodeLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

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

const CANVAS_SIZE = 100000;
const CENTER = CANVAS_SIZE / 2;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const PADDING = 100;
const BASE_NODE_SPACING_X = 380;
const BASE_NODE_SPACING_Y = 200;
const NODE_RADIUS = 8;
const CURRENT_NODE_RADIUS = 11;

const typeColors: Record<string, { main: string; glow: string }> = {
    anime: { main: '#60a5fa', glow: '#3b82f6' },
    manga: { main: '#34d399', glow: '#10b981' },
    novel: { main: '#c084fc', glow: '#a855f7' },
};

const relationTypeColors: Record<string, { main: string; glow: string }> = {
    SEQUEL: { main: '#4ade80', glow: '#22c55e' },
    PREQUEL: { main: '#60a5fa', glow: '#3b82f6' },
    ALTERNATIVE: { main: '#c084fc', glow: '#a855f7' },
    SPIN_OFF: { main: '#fbbf24', glow: '#f59e0b' },
    PARENT: { main: '#f87171', glow: '#ef4444' },
    CHARACTER: { main: '#22d3ee', glow: '#06b6d4' },
    SIDE_STORY: { main: '#2dd4bf', glow: '#14b8a6' },
    SOURCE: { main: '#a3e635', glow: '#84cc16' },
    SUMMARY: { main: '#facc15', glow: '#eab308' },
    OTHER: { main: '#9ca3af', glow: '#6b7280' },
    ADAPTATION: { main: '#f472b6', glow: '#ec4899' },
};

interface LayoutResult {
    positions: PositionedNode[];
    bounds: LayoutBounds;
}

const computeImprovedLayout = (
    nodes: GraphNode[],
    edges: GraphEdge[],
    currentNodeId: string | undefined
): LayoutResult => {
    if (nodes.length === 0) {
        return {
            positions: [],
            bounds: { minX: 0, minY: 0, width: CANVAS_SIZE, height: CANVAS_SIZE }
        };
    }

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
    const startId = currentNodeId && nodeIds.has(currentNodeId) ? currentNodeId : nodes[0].id;

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
        if (!layerOf.has(n.id)) layerOf.set(n.id, maxAssigned + 1);
    });

    const groups = new Map<number, GraphNode[]>();
    nodes.forEach(n => {
        const l = layerOf.get(n.id)!;
        if (!groups.has(l)) groups.set(l, []);
        groups.get(l)!.push(n);
    });

    const sortedLayers = Array.from(groups.keys()).sort((a, b) => a - b);

    const positions: PositionedNode[] = [];
    const nodePositionMap = new Map<string, PositionedNode>();

    sortedLayers.forEach((layerIdx, col) => {
        const group = groups.get(layerIdx)!;
        const x = col * BASE_NODE_SPACING_X;

        group.forEach((node, i) => {
            let y = i * BASE_NODE_SPACING_Y;

            if (group.length > 1) {
                const totalHeight = (group.length - 1) * BASE_NODE_SPACING_Y;
                y = (sortedLayers.length > 1 ? 400 : 300) + (i * BASE_NODE_SPACING_Y) - totalHeight / 2;
            }

            const pos: PositionedNode = { ...node, x, y };
            positions.push(pos);
            nodePositionMap.set(node.id, pos);
        });
    });

    const MIN_GAP = BASE_NODE_SPACING_Y * 0.75;

    for (let pass = 0; pass < 40; pass++) {
        let moved = false;

        sortedLayers.forEach(layerIdx => {
            const layerNodes = positions
                .filter(p => layerOf.get(p.id) === layerIdx)
                .sort((a, b) => a.y - b.y);

            for (let i = 0; i < layerNodes.length; i++) {
                const node = layerNodes[i];
                const neighbors = Array.from(adjacency.get(node.id) || []);
                let dy = 0;

                neighbors.forEach(nId => {
                    const other = nodePositionMap.get(nId);
                    if (other && other.id !== node.id) {
                        dy += (other.y - node.y) * 0.03;
                    }
                });

                const above = layerNodes[i - 1];
                const below = layerNodes[i + 1];
                if (above && node.y - above.y < MIN_GAP) {
                    dy -= (MIN_GAP - (node.y - above.y)) * 0.6;
                }
                if (below && below.y - node.y < MIN_GAP) {
                    dy += (MIN_GAP - (below.y - node.y)) * 0.6;
                }

                if (Math.abs(dy) > 0.5) {
                    node.y += dy;
                    moved = true;
                }
            }

            for (let i = 1; i < layerNodes.length; i++) {
                if (layerNodes[i].y - layerNodes[i - 1].y < MIN_GAP) {
                    layerNodes[i].y = layerNodes[i - 1].y + MIN_GAP;
                    moved = true;
                }
            }
        });

        if (!moved && pass > 5) break;
    }

    const xs = positions.map(n => n.x);
    const ys = positions.map(n => n.y);
    const minX = Math.min(...xs) - PADDING;
    const maxX = Math.max(...xs) + PADDING + 200;
    const minY = Math.min(...ys) - PADDING;
    const maxY = Math.max(...ys) + PADDING;

    return {
        positions,
        bounds: { minX, minY, width: maxX - minX, height: maxY - minY }
    };
};

const getEdgePath = (
    x1: number, y1: number,
    x2: number, y2: number,
    targetRadius: number = NODE_RADIUS,
    curvature: number = 0
): string => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;

    const cpLen = Math.min(dist * 0.5, 120);

    const cp1x = x1 + ux * cpLen + px * curvature;
    const cp1y = y1 + uy * cpLen + py * curvature;
    const cp2x = x2 - ux * cpLen + px * curvature;
    const cp2y = y2 - uy * cpLen + py * curvature;

    const tx = x2 - cp2x;
    const ty = y2 - cp2y;
    const tlen = Math.sqrt(tx * tx + ty * ty) || 1;
    const shorten = targetRadius + 2;

    const endShift = curvature * 0.25;
    const endX = x2 - (tx / tlen) * shorten + px * endShift;
    const endY = y2 - (ty / tlen) * shorten + py * endShift;

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
};

export const RelationsGraphContent: React.FC<RelationsGraphContentProps> = ({
    nodes,
    edges,
    currentNodeId,
}) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMiniPreview, setShowMiniPreview] = useState<string | null>(null);
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const stateRef = useRef({ pan, zoom });
    stateRef.current = { pan, zoom };

    const layerOf = useMemo(() => {
        if (nodes.length === 0) return new Map<string, number>();
        const nodeIds = new Set(nodes.map(n => n.id));
        const adjacency = new Map<string, Set<string>>();
        nodes.forEach(n => adjacency.set(n.id, new Set()));
        edges.forEach(e => {
            if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
                adjacency.get(e.source)!.add(e.target);
                adjacency.get(e.target)!.add(e.source);
            }
        });

        const layerMap = new Map<string, number>();
        const startId = currentNodeId && nodeIds.has(currentNodeId) ? currentNodeId : nodes[0].id;
        const queue = [startId];
        layerMap.set(startId, 0);
        const visited = new Set([startId]);

        while (queue.length > 0) {
            const u = queue.shift()!;
            const lu = layerMap.get(u)!;
            for (const v of adjacency.get(u) || []) {
                if (!visited.has(v)) {
                    visited.add(v);
                    layerMap.set(v, lu + 1);
                    queue.push(v);
                }
            }
        }
        return layerMap;
    }, [nodes, edges, currentNodeId]);

    const { positions, bounds } = useMemo(
        () => computeImprovedLayout(nodes, edges, currentNodeId),
        [nodes, edges, currentNodeId]
    );

    const nodeMap = useMemo(() => {
        const map = new Map<string, PositionedNode>();
        positions.forEach(n => map.set(n.id, n));
        return map;
    }, [positions]);

    const filteredPositions = useMemo(() => {
        if (!searchQuery.trim()) return positions;
        const q = searchQuery.toLowerCase();
        return positions.filter(n =>
            n.title.toLowerCase().includes(q) ||
            n.type.toLowerCase().includes(q) ||
            String(n.year).includes(q)
        );
    }, [positions, searchQuery]);

    const visibleEdges = useMemo(() => {
        if (!searchQuery.trim()) return edges;
        const visibleIds = new Set(filteredPositions.map(n => n.id));
        return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
    }, [edges, filteredPositions, searchQuery]);

    const edgeCurvatures = useMemo(() => {
        const counts = new Map<string, number>();
        const indices = new Map<string, number>();
        visibleEdges.forEach(edge => {
            const key = [edge.source, edge.target].sort().join('--');
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return visibleEdges.map(edge => {
            const key = [edge.source, edge.target].sort().join('--');
            const total = counts.get(key) || 1;
            const idx = indices.get(key) || 0;
            indices.set(key, idx + 1);
            const step = 55;
            return (idx - (total - 1) / 2) * step;
        });
    }, [visibleEdges]);

    const highlightedNodes = useMemo(() => {
        const highlighted = new Set<string>();
        if (hoveredNode || selectedNode) {
            const active = hoveredNode || selectedNode;
            highlighted.add(active!);
            edges.forEach(e => {
                if (e.source === active) highlighted.add(e.target);
                if (e.target === active) highlighted.add(e.source);
            });
        }
        return highlighted;
    }, [hoveredNode, selectedNode, edges]);

    useLayoutEffect(() => {
        const updateSize = () => {
            if (viewportRef.current) {
                const rect = viewportRef.current.getBoundingClientRect();
                setViewportSize({ width: rect.width, height: rect.height });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const handleFit = useCallback(() => {
        if (positions.length === 0 || viewportSize.width === 0) return;
        const scaleX = viewportSize.width / (bounds.width * 1.2);
        const scaleY = viewportSize.height / (bounds.height * 1.2);
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));
        setZoom(newZoom);
        setPan({
            x: viewportSize.width / 2 - (bounds.minX + bounds.width / 2) * newZoom,
            y: viewportSize.height / 2 - (bounds.minY + bounds.height / 2) * newZoom,
        });
    }, [positions, bounds, viewportSize]);

    useLayoutEffect(() => {
        handleFit();
    }, [handleFit]);

    const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

    const zoomAt = useCallback((mx: number, my: number, newZoom: number) => {
        const { pan, zoom } = stateRef.current;
        const nz = clampZoom(newZoom);
        const ratio = nz / zoom;
        setPan({
            x: mx - (mx - pan.x) * ratio,
            y: my - (my - pan.y) * ratio,
        });
        setZoom(nz);
    }, []);

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const { zoom } = stateRef.current;
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            zoomAt(mx, my, zoom * factor);
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [zoomAt]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 && e.button !== 1) return;
        const target = e.target as HTMLElement;
        if (target.closest('input, button, a, [contenteditable], [data-pan-exclude]')) return;
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

    const handleNodeClick = (nodeId: string) => {
        setSelectedNode(prev => prev === nodeId ? null : nodeId);
    };

    const handleZoomIn = () => {
        if (!viewportRef.current) return;
        const rect = viewportRef.current.getBoundingClientRect();
        zoomAt(rect.width / 2, rect.height / 2, stateRef.current.zoom * 1.2);
    };

    const handleZoomOut = () => {
        if (!viewportRef.current) return;
        const rect = viewportRef.current.getBoundingClientRect();
        zoomAt(rect.width / 2, rect.height / 2, stateRef.current.zoom * 0.8);
    };

    const screenToCanvas = useCallback((screenX: number, screenY: number) => {
        const { pan, zoom } = stateRef.current;
        return {
            x: (screenX - pan.x) / zoom,
            y: (screenY - pan.y) / zoom
        };
    }, []);

    return (
        <div
            ref={viewportRef}
            className="relative w-full h-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20"
            onMouseDown={handleMouseDown}
        >
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    overflow: 'visible',
                }}
            >
                <defs>
                    <filter id="glow-soft" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {Object.entries(typeColors).map(([type, colors]) => (
                        <filter key={`glow-${type}`} id={`glow-${type}`} x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    ))}
                    {Array.from(new Set(edges.map(e => e.relationType))).map(type => {
                        const color = relationTypeColors[type]?.main || relationTypeColors.OTHER.main;
                        return (
                            <marker
                                key={`arrow-${type}`}
                                id={`arrow-${type}`}
                                markerWidth="8"
                                markerHeight="6"
                                refX="7"
                                refY="3"
                                orient="auto"
                            >
                                <polygon points="0 0, 8 3, 0 6" fill={color} />
                            </marker>
                        );
                    })}
                </defs>

                <g transform={`translate(${-bounds.minX}, ${-bounds.minY})`}>
                    {visibleEdges.map((edge, idx) => {
                        const source = nodeMap.get(edge.source);
                        const target = nodeMap.get(edge.target);
                        if (!source || !target) return null;

                        const colors = relationTypeColors[edge.relationType] || relationTypeColors.OTHER;
                        const isHighlighted = highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target);

                        const isTargetCurrent = target.id === currentNodeId;
                        const targetRadius = isTargetCurrent ? CURRENT_NODE_RADIUS : NODE_RADIUS;
                        const curvature = edgeCurvatures[idx] || 0;

                        return (
                            <path
                                key={`${edge.source}-${edge.target}-${idx}`}
                                d={getEdgePath(source.x, source.y, target.x, target.y, targetRadius, curvature)}
                                stroke={colors.main}
                                strokeWidth={isHighlighted ? 2.5 : 1.2}
                                strokeOpacity={isHighlighted ? 0.9 : 0.35}
                                fill="none"
                                markerEnd={`url(#arrow-${edge.relationType})`}
                            />
                        );
                    })}

                    {filteredPositions.map(node => {
                        const isCurrent = node.id === currentNodeId;
                        const isHighlighted = highlightedNodes.has(node.id);
                        const colors = typeColors[node.type] || typeColors.anime;

                        return (
                            <g
                                key={`dot-${node.id}`}
                                className="cursor-pointer pointer-events-auto"
                                transform={`translate(${node.x}, ${node.y})`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNodeClick(node.id);
                                }}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                {isHighlighted && (
                                    <circle
                                        r={NODE_RADIUS + 12}
                                        fill={colors.main}
                                        fillOpacity={0.15}
                                    />
                                )}

                                <circle
                                    r={NODE_RADIUS + 6}
                                    fill={colors.main}
                                    fillOpacity={0.2}
                                    filter="url(#glow-soft)"
                                />

                                <circle
                                    r={isCurrent ? CURRENT_NODE_RADIUS : NODE_RADIUS}
                                    fill={colors.main}
                                    filter={`url(#glow-${node.type})`}
                                />

                                {isCurrent && (
                                    <circle
                                        r={CURRENT_NODE_RADIUS + 5}
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth={2.5}
                                    />
                                )}
                            </g>
                        );
                    })}
                </g>
            </svg>

            {filteredPositions.map(node => {
                const isCurrent = node.id === currentNodeId;
                const isHighlighted = highlightedNodes.has(node.id);
                const colors = typeColors[node.type] || typeColors.anime;
                const canvasX = node.x - bounds.minX;
                const canvasY = node.y - bounds.minY;
                const screenX = canvasX * zoom + pan.x;
                const screenY = canvasY * zoom + pan.y;

                return (
                    <div
                        key={`label-${node.id}`}
                        className="absolute pointer-events-auto z-10"
                        style={{
                            left: screenX,
                            top: screenY,
                            transform: 'translate(18px, -50%)',
                        }}
                        onMouseEnter={() => {
                            setHoveredNode(node.id);
                            setShowMiniPreview(node.id);
                        }}
                        onMouseLeave={() => {
                            setHoveredNode(null);
                            setShowMiniPreview(null);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNodeClick(node.id);
                        }}
                    >
                        <RelationsNodeLabel
                            node={node}
                            isCurrent={isCurrent}
                            isHighlighted={isHighlighted}
                        />
                    </div>
                );
            })}

            {showMiniPreview && (() => {
                const previewNode = nodeMap.get(showMiniPreview);
                if (!previewNode) return null;
                const canvasX = previewNode.x - bounds.minX;
                const canvasY = previewNode.y - bounds.minY;
                const screenX = canvasX * zoom + pan.x;
                const screenY = canvasY * zoom + pan.y;

                return (
                    <div
                        className="absolute z-50 pointer-events-none"
                        style={{
                            left: screenX,
                            top: screenY,
                            transform: 'translate(50%, -50%)',
                        }}
                    >
                        <div className="bg-secondary/95 border border-border/50 rounded-xl shadow-2xl p-3 w-48">
                            <div className="flex gap-3">
                                <img
                                    src={previewNode.imageUrl}
                                    alt={previewNode.title}
                                    className="w-16 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{previewNode.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {previewNode.year > 0 ? previewNode.year : '?'} • {previewNode.format || previewNode.type}
                                    </p>
                                    <span className={cn(
                                        "inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded font-medium",
                                        previewNode.type === 'anime' ? "bg-blue-500/20 text-blue-500" :
                                        previewNode.type === 'manga' ? "bg-emerald-500/20 text-emerald-500" :
                                        "bg-purple-500/20 text-purple-500"
                                    )}>
                                        {previewNode.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div className="absolute top-3 left-3 z-20">
                <div className="relative">
                    <Icon icon="material-symbols:search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Пошук..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 w-48 bg-secondary/90 border-border/50"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <Icon icon="material-symbols:close" className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
                <Button size="icon-sm" variant="secondary" onClick={handleZoomIn} title="Збільшити" className="bg-secondary/90 border-border/50 shadow-lg">
                    <Icon icon="material-symbols:add" />
                </Button>
                <Button size="icon-sm" variant="secondary" onClick={handleZoomOut} title="Зменшити" className="bg-secondary/90 border-border/50 shadow-lg">
                    <Icon icon="material-symbols:remove" />
                </Button>
                <Button size="icon-sm" variant="secondary" onClick={handleFit} title="Вмістити" className="bg-secondary/90 border-border/50 shadow-lg">
                    <Icon icon="material-symbols:fit-screen" />
                </Button>
                {selectedNode && (
                    <Button size="icon-sm" variant="secondary" onClick={() => setSelectedNode(null)} title="Скинути" className="bg-secondary/90 border-border/50 shadow-lg">
                        <Icon icon="material-symbols:close" />
                    </Button>
                )}
            </div>

            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-secondary/90 border border-border/50 text-xs font-mono text-muted-foreground z-20 flex items-center gap-3">
                <span>{Math.round(zoom * 100)}%</span>
                <span className="text-border">|</span>
                <span>{filteredPositions.length} вузлів</span>
                {selectedNode && (
                    <>
                        <span className="text-border">|</span>
                        <span className="text-primary">Вибрано: {nodeMap.get(selectedNode)?.title}</span>
                    </>
                )}
            </div>

            {(hoveredNode || selectedNode) && (
                <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary z-20">
                    {hoveredNode ? nodeMap.get(hoveredNode)?.title : nodeMap.get(selectedNode)?.title}
                </div>
            )}
        </div>
    );
};