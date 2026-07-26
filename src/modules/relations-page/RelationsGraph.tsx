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
        <div className={cn('flex flex-col gap-6', className)}>
            {relationTypes.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">
                            Зв&apos;язки
                            <span className="text-muted-foreground font-normal text-sm ml-2">
                                ({nodes.length} тайтл{nodes.length === 1 ? '' : 'ів'})
                            </span>
                        </h3>
                        <span className="text-xs text-muted-foreground">Легенда типів зв&apos;язків</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 rounded-lg border border-border/40 bg-secondary/10">
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
                style={{ height: 700 }}
                className="relative w-full rounded-xl bg-secondary/5 border border-border/30 overflow-hidden shadow-2xl shadow-black/5"
            >
                <RelationsGraphContent
                    nodes={nodes}
                    edges={edges}
                    currentNodeId={currentNodeId}
                />
            </div>
        </div>
    );
};
