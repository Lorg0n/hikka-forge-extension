import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    media?: ReactNode;
    titleHref?: string;
    titleSuffix?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export const PageHeader = ({
    title,
    description,
    media,
    titleHref,
    titleSuffix,
    action,
    className,
}: PageHeaderProps) => {
    const titleElement = titleHref ? (
        <a
            href={titleHref}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 text-left text-foreground hover:text-foreground hover:underline"
        >
            <h4 className="line-clamp-1 font-bold text-base">{title}</h4>
        </a>
    ) : (
        <h4 className="line-clamp-1 font-bold text-base">{title}</h4>
    );

    return (
        <div
            className={cn(
                'relative flex flex-col gap-4 rounded-lg border border-border/60 bg-card/80 p-4 backdrop-blur-sm',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    {media}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                            {titleElement}
                            {titleSuffix}
                        </div>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>
                {action}
            </div>
        </div>
    );
};
