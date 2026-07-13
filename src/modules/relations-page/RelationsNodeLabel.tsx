import React from 'react';
import { GraphNode } from '@/types';
import Link from '@/components/typography/link';

interface RelationsNodeLabelProps {
    node: GraphNode;
    isCurrent?: boolean;
}

export const RelationsNodeLabel: React.FC<RelationsNodeLabelProps> = ({
    node,
    isCurrent = false,
}) => {
    const href = `/${node.type}/${node.slug}`;

    return (
        <div
            className="flex flex-col leading-tight px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-sm pointer-events-auto"
        >
            <Link
                href={href}
                className="text-foreground text-[11px] font-medium whitespace-nowrap max-w-[140px] truncate"
            >
                {node.title}
            </Link>
            {(node.year > 0 || node.format) && (
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {[node.year > 0 ? String(node.year) : null, node.format]
                        .filter(Boolean)
                        .join(' • ')}
                </span>
            )}
            {isCurrent && (
                <span className="text-[9px] text-primary font-medium">
                    Поточне
                </span>
            )}
        </div>
    );
};
