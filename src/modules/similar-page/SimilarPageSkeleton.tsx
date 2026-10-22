import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PageHeaderSkeleton } from '@/components/ui/page-header-skeleton';

export const SimilarPageSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            <PageHeaderSkeleton media="poster" context />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <AspectRatio ratio={2 / 3}>
                            <Skeleton className="h-full w-full rounded-lg" />
                        </AspectRatio>
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
