import React, { useMemo } from 'react';
import { GraphEdge, GraphNode } from '@/types';
import { cn } from '@/lib/utils';
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

const relationTypeLabels: Record<string, string> = {
    SEQUEL: 'Продовження',
    PREQUEL: 'Приквел',
    ALTERNATIVE: 'Альтернатива',
    SPIN_OFF: 'Спін-оф',
    PARENT: 'Основний',
    CHARACTER: 'Персонаж',
    SIDE_STORY: 'Побічна історія',
    SOURCE: 'Джерело',
    SUMMARY: 'Підсумок',
    OTHER: 'Інше',
    ADAPTATION: 'Адаптація',
};

export const RelationsGraph: React.FC<RelationsGraphProps> = ({
    nodes,
    edges,
    currentNodeId,
    className,
}) => {
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
        <section className={cn('flex min-w-0 flex-col gap-5', className)}>
            {relationTypes.length > 0 && (
                <div className="surface flex flex-col gap-4 rounded-xl border border-border/70 p-4 sm:p-5">
                    <div className="flex items-end justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="font-display text-2xl font-bold tracking-normal">
                                Зв&apos;язки
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {nodes.length} тайтл{nodes.length === 1 ? '' : 'ів'} у франшизі
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground">Легенда типів зв&apos;язків</span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-border/50 bg-background/35 p-3">
                        {relationTypes.map(type => (
                            <div
                                key={type}
                                className="flex items-center gap-2 text-sm"
                            >
                                <span
                                    className="inline-block size-3 rounded-full shadow-sm shrink-0"
                                    style={{ backgroundColor: relationTypeColors[type] || '#6b7280' }}
                                />
                                <span className="text-muted-foreground">
                                    {relationTypeLabels[type] || type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div
                className="surface relative min-h-0 w-full overflow-hidden rounded-xl shadow-2xl shadow-black/10"
            >
                <div
                    className="relative w-full overflow-hidden rounded-lg border border-border/50"
                    style={{ height: 'min(78vh, 900px)', minHeight: 620 }}
                >
                    <RelationsGraphContent
                        nodes={nodes}
                        edges={edges}
                        currentNodeId={currentNodeId}
                    />
                </div>
            </div>
        </section>
    );
};
