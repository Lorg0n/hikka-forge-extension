import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

type PageHeaderSkeletonMedia = 'poster' | 'avatar';

interface PageHeaderSkeletonProps {
    media?: PageHeaderSkeletonMedia;
    context?: boolean;
    description?: boolean;
    action?: boolean;
    tabs?: boolean;
}

/** Matches the layout and surfaces of PageHeader while its page data loads. */
export function PageHeaderSkeleton({
    media,
    context = false,
    description = false,
    action = false,
    tabs = false,
}: PageHeaderSkeletonProps) {
    return (
        <div className="flex w-full flex-col">
            <section
                data-slot="block-surface"
                className={cn(
                    'surface relative isolate -mx-4 flex min-w-0 flex-col gap-4 overflow-clip rounded-none border border-x-0 border-border p-4 backdrop-blur will-change-transform sm:mx-0 sm:rounded-lg sm:border-x',
                    tabs && 'rounded-b-none sm:rounded-b-none',
                )}
            >
                <div className="flex min-h-8 items-center gap-4">
                    {media && (
                        <div
                            className={cn(
                                'w-11 shrink-0 md:w-14',
                                media === 'poster' && 'aspect-[0.7]',
                                media === 'avatar' && 'aspect-square',
                            )}
                        >
                            <Skeleton className="size-full rounded-(--base-radius)" />
                        </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                        {context && <Skeleton className="h-4 w-28" />}
                        <Skeleton className="h-8 w-48 max-w-full" />
                        {description && <Skeleton className="h-4 w-64 max-w-full" />}
                    </div>
                    {action && <Skeleton className="size-8 shrink-0" />}
                </div>
            </section>
            {tabs && (
                <section
                    data-slot="block-surface"
                    className="surface relative isolate -mx-4 flex min-w-0 flex-col gap-4 overflow-clip rounded-none rounded-t-none border border-x-0 border-t-0 border-border px-4 py-3 backdrop-blur will-change-transform sm:mx-0 sm:rounded-lg sm:rounded-t-none sm:border-x md:sticky md:top-16 md:z-40"
                >
                    <div className="no-scrollbar -mr-4 flex gap-2 overflow-x-auto pr-4">
                        <Skeleton className="h-8 w-18 shrink-0" />
                        <Skeleton className="h-8 w-18 shrink-0" />
                    </div>
                </section>
            )}
        </div>
    );
}
