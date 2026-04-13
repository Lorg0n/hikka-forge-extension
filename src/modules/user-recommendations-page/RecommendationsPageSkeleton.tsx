import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export const RecommendationsPageSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            {/* Header Skeleton */}
            <div className="relative flex items-center justify-between gap-4 rounded-lg border p-4 bg-secondary/20">
                <div className="flex flex-1 items-center gap-4">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-md animate-pulse bg-secondary/20" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-48 rounded-md animate-pulse bg-secondary/20" />
                        <Skeleton className="h-4 w-36 rounded-md animate-pulse bg-secondary/20" />
                    </div>
                </div>
                <Skeleton className="h-5 w-5 rounded animate-pulse bg-secondary/20" />
            </div>

            {/* Grid Skeleton */}
            <section className="flex flex-col gap-8">
                <Skeleton className="h-7 w-48 rounded-md animate-pulse bg-secondary/20" />

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <AspectRatio ratio={2 / 3}>
                                <Skeleton className="h-full w-full rounded-lg animate-pulse bg-secondary/20" />
                            </AspectRatio>
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-3/4 animate-pulse bg-secondary/20" />
                                <Skeleton className="h-4 w-full animate-pulse bg-secondary/20" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};