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
                        relationTypes={relationTypes}
                    />
                </div>
            </div>
        </section>
    );
};
