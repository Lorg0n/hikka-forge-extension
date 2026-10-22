import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
    title: ReactNode;
    href?: string;
    action?: ReactNode;
    className?: string;
    titleClassName?: string;
}

/**
 * Shared heading for module content sections.
 *
 * It mirrors the host site's linked-section heading: a large, accessible hit
 * area, an affordance arrow, and an optional trailing control.
 */
export function SectionHeader({
    title,
    href,
    action,
    className,
    titleClassName,
}: SectionHeaderProps) {
    const headingContent = href ? (
        <a
            href={href}
            className="group/header-title -mx-1.5 -my-1.5 inline-flex min-h-10 min-w-0 items-center gap-1 rounded-md px-1.5 py-1.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            <span className="min-w-0 underline-offset-4 group-hover/header-title:underline">
                {title}
            </span>
            <ChevronRight
                aria-hidden="true"
                className="size-[1em] shrink-0 text-muted-foreground transition-transform group-hover/header-title:translate-x-0.5 group-hover/header-title:text-foreground"
            />
        </a>
    ) : (
        <span>{title}</span>
    );

    return (
        <div className={cn('flex min-h-8 items-center justify-between gap-3', className)}>
            <div className="flex min-w-0 items-center">
                <h2
                    className={cn(
                        'flex min-w-0 text-lg leading-7 font-bold',
                        titleClassName,
                    )}
                >
                    {headingContent}
                </h2>
            </div>
            {action}
        </div>
    );
}
