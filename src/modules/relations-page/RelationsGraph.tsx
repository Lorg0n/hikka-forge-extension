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

        // Inject compiled Tailwind CSS
        const styleEl = document.createElement('style');
        styleEl.textContent = shadowStyles;
        shadow.appendChild(styleEl);

        // Sync theme variables from the page to the shadow host
        // (inline style overrides any :root rule in the shadow CSS)
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

        // Mount point
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
            // Clean up host inline vars
            THEME_VARS.forEach(v => host.style.removeProperty(v));
        };
    }, [nodes, edges, currentNodeId]);

    const relationTypes = useMemo(
        () => Array.from(new Set(edges.map(e => e.relationType))),
        [edges]
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
            <div className="flex flex-wrap gap-2">
                {relationTypes.map(type => (
                    <div
                        key={type}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                        <span
                            className="inline-block size-2 rounded-full"
                            style={{ backgroundColor: relationTypeColors[type] || '#6b7280' }}
                        />
                        {type}
                    </div>
                ))}
            </div>
            <div
                ref={hostRef}
                style={{ height: 800 }}
                className="relative w-full border rounded-lg bg-secondary/10 overflow-hidden"
            />
        </div>
    );
};
