import React from 'react';
import { GraphNode } from '@/types';
import Link from '@/components/typography/link';
import { cn } from '@/lib/utils';

interface RelationsNodeCardProps {
    node: GraphNode;
    isCurrent?: boolean;
    className?: string;
}

const typeColors: Record<string, string> = {
    anime: '#3b82f6',
    manga: '#10b981',
    novel: '#a855f7',
};

export const RelationsNodeCard: React.FC<RelationsNodeCardProps> = ({
    node,
    isCurrent = false,
    className,
}) => {
    const color = typeColors[node.type] || '#6b7280';
    const href = `/${node.type}/${node.slug}`;

    return (
        <div className={cn('flex items-center gap-1.5 group', className)}>
            <span
                className={cn(
                    'inline-block rounded-full shrink-0',
                    isCurrent
                        ? 'size-3.5 ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'size-2.5'
                )}
                style={{ backgroundColor: color }}
            />
            <div className="flex flex-col min-w-0 leading-tight">
                <Link
                    href={href}
                    className="text-[11px] font-medium truncate hover:text-primary max-w-[110px]"
                >
                    {node.title}
                </Link>
                {(node.year > 0 || node.format) && (
                    <span className="text-[9px] text-muted-foreground truncate max-w-[110px]">
                        {[node.year > 0 ? String(node.year) : null, node.format]
                            .filter(Boolean)
                            .join(' • ')}
                    </span>
                )}
            </div>
        </div>
    );
};
