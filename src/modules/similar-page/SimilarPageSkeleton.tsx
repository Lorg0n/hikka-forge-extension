import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export const SimilarPageSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            {/* Header Skeleton */}
            <div className="relative flex flex-col gap-4 rounded-lg border border-slate-200 p-4 bg-slate-100/50 backdrop-blur-sm dark:border-border dark:bg-secondary/20">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="w-12 shrink-0">
                            <AspectRatio ratio={0.7}>
                                <Skeleton className="h-full w-full rounded-md animate-pulse bg-secondary/20" />
                            </AspectRatio>
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-5 w-1/3 rounded-md animate-pulse bg-secondary/20" />
                            <Skeleton className="h-4 w-16 rounded-md animate-pulse bg-secondary/20" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <section className="flex flex-col gap-8">
                <div className="flex items-start gap-2">
                    <Skeleton className="h-7 w-48 rounded-md animate-pulse bg-secondary/20" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <AspectRatio ratio={2 / 3}>
                                <Skeleton className="h-full w-full rounded-lg animate-pulse bg-secondary/20" />
                            </AspectRatio>
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-1/2 animate-pulse bg-secondary/20" />
                                <Skeleton className="h-4 w-full animate-pulse bg-secondary/20" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};