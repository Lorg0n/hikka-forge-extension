import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { GraphEdge, GraphNode } from '@/types';
import { cn } from '@/lib/utils';
// @ts-ignore - Vite ?inline import
import shadowStyles from '@/index.css?inline';
import { RelationsGraphContent } from './RelationsGraphContent';

interface RelationsGraphProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    currentNodeId?: string;
    className?: string;
}

const relationTypeColors: Record<string, string> = {
    SEQUEL: '#4ade80',
    PREQUEL: '#60a5fa',
    ALTERNATIVE: '#c084fc',
    SPIN_OFF: '#fbbf24',
    PARENT: '#f87171',
    CHARACTER: '#22d3ee',
    SIDE_STORY: '#2dd4bf',
    SOURCE: '#a3e635',
    SUMMARY: '#facc15',
    OTHER: '#9ca3af',
    ADAPTATION: '#f472b6',
};

const THEME_VARS = [
    '--foreground',
    '--muted-foreground',
    '--primary',
    '--primary-foreground',
    '--background',
    '--border',
    '--secondary',
    '--secondary-foreground',
    '--card',
    '--card-foreground',
    '--muted',
];

export const RelationsGraph: React.FC<RelationsGraphProps> = ({
    nodes,
    edges,
    currentNodeId,
    className,
}) => {
    const hostRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const host = hostRef.current;
        if (!host || nodes.length === 0) return;

        const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
        while (shadow.firstChild) {
            shadow.removeChild(shadow.firstChild);
        }

        const styleEl = document.createElement('style');
        styleEl.textContent = shadowStyles;
        shadow.appendChild(styleEl);

        const applyTheme = () => {
            const pageStyle = getComputedStyle(document.documentElement);
            THEME_VARS.forEach(v => {
                const value = pageStyle.getPropertyValue(v).trim();
                if (value) {
                    host.style.setProperty(v, value);
                }
            });
        };
        applyTheme();
        const themeObserver = new MutationObserver(applyTheme);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });

        const mount = document.createElement('div');
        mount.style.width = '100%';
        mount.style.height = '100%';
        mount.style.position = 'relative';
        shadow.appendChild(mount);

        const root: Root = createRoot(mount);
        root.render(
            <RelationsGraphContent
                nodes={nodes}
                edges={edges}
                currentNodeId={currentNodeId}
            />
        );

        return () => {
            root.unmount();
            themeObserver.disconnect();
            THEME_VARS.forEach(v => host.style.removeProperty(v));
        };
    }, [nodes, edges, currentNodeId]);

    const relationTypes = useMemo(
        () => Array.from(new Set(edges.map(e => e.relationType))),
        [edges]
    );

    const currentNode = useMemo(() =>
        nodes.find(n => n.id === currentNodeId),
        [nodes, currentNodeId]
    );

    if (nodes.length === 0) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center h-[400px] text-muted-foreground',
                    className
                )}
            >
                Немає даних для відображення
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col gap-4', className)}>
            <div className="flex items-center gap-4 flex-wrap">
                {currentNode && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                        <img
                            src={currentNode.imageUrl}
                            alt={currentNode.title}
                            className="w-8 h-10 object-cover rounded"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Цей тайтл</span>
                            <span className="text-sm font-medium">{currentNode.title}</span>
                        </div>
                    </div>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {relationTypes.map(type => (
                        <div
                            key={type}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                            <span
                                className="inline-block size-2.5 rounded-full shadow-sm"
                                style={{ backgroundColor: relationTypeColors[type] || '#6b7280' }}
                            />
                            {type}
                        </div>
                    ))}
                </div>
            </div>
            <div
                ref={hostRef}
                style={{ height: 700 }}
                className="relative w-full rounded-xl bg-secondary/5 border border-border/30 overflow-hidden shadow-2xl shadow-black/5"
            />
        </div>
    );
};