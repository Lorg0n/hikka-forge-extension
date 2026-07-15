import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export const RelationsPageSkeleton: React.FC = () => {
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
                            <Skeleton className="h-4 w-32 rounded-md animate-pulse bg-secondary/20" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>

            {/* Graph Skeleton */}
            <Skeleton className="h-[700px] w-full rounded-xl animate-pulse bg-secondary/20" />
        </div>
    );
};