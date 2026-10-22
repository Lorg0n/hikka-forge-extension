import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: ReactNode;
    context?: ReactNode;
    contextHref?: string;
    description?: ReactNode;
    media?: ReactNode;
    titleSuffix?: ReactNode;
    action?: ReactNode;
    tabs?: ReactNode;
    className?: string;
}

export const PageHeader = ({
    title,
    context,
    contextHref,
    description,
    media,
    titleSuffix,
    action,
    tabs,
    className,
}: PageHeaderProps) => {
    const contextElement = contextHref ? (
        <a
            href={contextHref}
            className="flex max-w-full items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
            <span className="truncate">{context}</span>
            <ChevronRight aria-hidden="true" className="size-[1em] shrink-0" />
        </a>
    ) : (
        context && (
            <p className="truncate text-sm font-medium text-muted-foreground">
                {context}
            </p>
        )
    );

    return (
        <div className={cn('flex w-full flex-col', className)}>
            <section
                data-slot="block-surface"
                className={cn(
                    'surface relative isolate -mx-4 flex min-w-0 flex-col gap-4 overflow-clip rounded-none border border-x-0 border-border p-4 backdrop-blur will-change-transform sm:mx-0 sm:rounded-lg sm:border-x',
                    tabs && 'rounded-b-none sm:rounded-b-none',
                )}
            >
                <div className="flex min-h-8 items-center gap-4">
                    {media && (
                        <div className="group relative flex w-11 shrink-0 flex-col gap-2 md:w-14">
                            {media}
                        </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                        {contextElement}
                        <div className="flex min-w-0 items-center gap-2">
                            <h1 className="min-w-0 break-words text-2xl leading-8 font-bold">
                                {title}
                            </h1>
                            {titleSuffix}
                        </div>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {action}
                </div>
            </section>
            {tabs && (
                <section
                    data-slot="block-surface"
                    className="surface relative isolate -mx-4 flex min-w-0 flex-col gap-4 overflow-clip rounded-none rounded-t-none border border-x-0 border-t-0 border-border px-4 py-3 backdrop-blur will-change-transform sm:mx-0 sm:rounded-lg sm:rounded-t-none sm:border-x md:sticky md:top-16 md:z-40"
                >
                    {tabs}
                </section>
            )}
        </div>
    );
};
