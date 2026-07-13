import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GraphEdge, GraphNode } from '@/types';
import { RelationsNodeCard } from './RelationsNodeCard';
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

const VIRTUAL_WIDTH = 2400;
const VIRTUAL_HEIGHT = 1200;
const NODE_WIDTH = 130;
const NODE_HEIGHT = 40;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;

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

const runForceSimulation = (
    nodes: GraphNode[],
    edges: GraphEdge[],
    width: number,
    height: number,
    iterations: number = 300
): PositionedNode[] => {
    if (nodes.length === 0) return [];

    interface SimNode extends GraphNode {
        x: number;
        y: number;
        vx: number;
        vy: number;
    }

    const cx = width / 2;
    const cy = height / 2;
    const initialRadius = Math.min(width, height) * 0.4;

    const simNodes: SimNode[] = nodes.map((node, i) => {
        const angle = (i / Math.max(nodes.length, 1)) * 2 * Math.PI;
        return {
            ...node,
            x: cx + Math.cos(angle) * initialRadius,
            y: cy + Math.sin(angle) * initialRadius,
            vx: 0,
            vy: 0,
        };
    });

    const nodeMap = new Map(simNodes.map(n => [n.id, n]));

    const idealEdgeLength = 160;
    const repulsionStrength = 30000;
    const springStrength = 0.015;
    const centeringStrength = 0.008;

    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < simNodes.length; i++) {
            for (let j = i + 1; j < simNodes.length; j++) {
                const a = simNodes[i];
                const b = simNodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq) || 1;
                const force = repulsionStrength / distSq;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                a.vx += fx;
                a.vy += fy;
                b.vx -= fx;
                b.vy -= fy;
            }
        }

        edges.forEach(edge => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - idealEdgeLength) * springStrength;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
        });

        simNodes.forEach(node => {
            node.vx += (cx - node.x) * centeringStrength;
            node.vy += (cy - node.y) * centeringStrength;
        });

        const marginX = NODE_WIDTH / 2 + 10;
        const marginY = NODE_HEIGHT / 2 + 10;
        simNodes.forEach(node => {
            if (node.x < marginX) node.vx += (marginX - node.x) * 0.05;
            if (node.x > width - marginX) node.vx -= (node.x - (width - marginX)) * 0.05;
            if (node.y < marginY) node.vy += (marginY - node.y) * 0.05;
            if (node.y > height - marginY) node.vy -= (node.y - (height - marginY)) * 0.05;
        });

        simNodes.forEach(node => {
            node.vx *= 0.8;
            node.vy *= 0.8;
            node.x += node.vx;
            node.y += node.vy;
        });
    }

    return simNodes;
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
        () => runForceSimulation(nodes, edges, VIRTUAL_WIDTH, VIRTUAL_HEIGHT),
        [nodes, edges]
    );

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

    // Wheel zoom (non-passive to prevent page scroll)
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
    const handleReset = () => {
        setPan({ x: 0, y: 0 });
        setZoom(1);
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
                    viewBox={`0 0 ${VIRTUAL_WIDTH} ${VIRTUAL_HEIGHT}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {edges.map(edge => {
                        const source = nodeMap.get(edge.source);
                        const target = nodeMap.get(edge.target);
                        if (!source || !target) return null;

                        const color = relationTypeColors[edge.relationType] || '#6b7280';
                        const isHovered =
                            hoveredEdge === `${edge.source}-${edge.target}`;

                        return (
                            <g key={`${edge.source}-${edge.target}`}>
                                <line
                                    x1={source.x}
                                    y1={source.y}
                                    x2={target.x}
                                    y2={target.y}
                                    stroke={color}
                                    strokeWidth={isHovered ? 2.5 : 1}
                                    strokeOpacity={isHovered ? 1 : 0.5}
                                />
                                <title>{edge.relationType}</title>
                            </g>
                        );
                    })}
                </svg>
                {positionedNodes.map(node => (
                    <div
                        key={node.id}
                        className="absolute"
                        style={{
                            left: `${(node.x / VIRTUAL_WIDTH) * 100}%`,
                            top: `${(node.y / VIRTUAL_HEIGHT) * 100}%`,
                            transform: 'translate(-50%, -50%)',
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
                        <RelationsNodeCard
                            node={node}
                            isCurrent={node.id === currentNodeId}
                        />
                    </div>
                ))}
            </div>

            {/* Zoom controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={handleZoomIn}
                    title="Збільшити"
                >
                    <Icon icon="material-symbols:add" />
                </Button>
                <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={handleZoomOut}
                    title="Зменшити"
                >
                    <Icon icon="material-symbols:remove" />
                </Button>
                <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={handleReset}
                    title="Скинути"
                >
                    <Icon icon="material-symbols:fit-screen" />
                </Button>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-secondary/80 text-secondary-foreground text-xs font-mono z-10 pointer-events-none">
                {Math.round(zoom * 100)}%
            </div>
        </div>
    );
};
