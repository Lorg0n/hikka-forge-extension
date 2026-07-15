import React from 'react';
import { GraphNode } from '@/types';
import Link from '@/components/typography/link';
import { cn } from '@/lib/utils';

interface RelationsNodeLabelProps {
    node: GraphNode;
    isCurrent?: boolean;
    isHighlighted?: boolean;
}

export const RelationsNodeLabel: React.FC<RelationsNodeLabelProps> = ({
    node,
    isCurrent = false,
    isHighlighted = false,
}) => {
    const href = `/${node.type}/${node.slug}`;

    return (
        <div
            className={cn(
                "flex flex-col leading-tight px-2.5 py-1.5 rounded-lg transition-colors",
                isCurrent
                    ? "bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10"
                    : isHighlighted
                    ? "bg-secondary/90 border-primary/30"
                    : "bg-secondary/70 border-border/30"
            )}
        >
            <Link
                href={href}
                className={cn(
                    "text-[11px] font-medium whitespace-nowrap max-w-[150px] truncate",
                    isCurrent ? "text-amber-500 font-semibold" : "text-foreground/90"
                )}
            >
                {node.title}
            </Link>
            {(node.year > 0 || node.format) && (
                <span className={cn(
                    "text-[9px] whitespace-nowrap",
                    isCurrent ? "text-amber-400/80" : "text-muted-foreground"
                )}>
                    {[node.year > 0 ? String(node.year) : null, node.format]
                        .filter(Boolean)
                        .join(' • ')}
                </span>
            )}
            {isCurrent && (
                <span className="text-[9px] text-amber-500 font-medium mt-0.5">
                    Поточне
                </span>
            )}
        </div>
    );
};
