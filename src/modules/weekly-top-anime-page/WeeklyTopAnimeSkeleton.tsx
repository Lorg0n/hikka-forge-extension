import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export const WeeklyTopAnimeSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            <div className="relative flex flex-col gap-4 rounded-lg border p-4 bg-secondary/20">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-6 w-48 rounded-md animate-pulse bg-secondary/20" />
                        <Skeleton className="h-4 w-64 rounded-md animate-pulse bg-secondary/20" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg animate-pulse bg-secondary/20" />
                </div>
            </div>

            <section className="flex flex-col gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <Card key={i} className="p-0 relative overflow-hidden border-border shadow-sm rounded-lg isolate">
                        <div className="absolute inset-0 -z-10 bg-background/60 backdrop-blur-xl" />

                        {/* Card Content Skeleton */}
                        <div className="relative z-10 flex flex-row p-3 sm:p-4 gap-3 sm:gap-4 items-center bg-secondary/5">
                            <div className="flex flex-col items-center justify-center w-8 sm:w-8 shrink-0 gap-2">
                                <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-secondary/20" />
                                <Skeleton className="w-8 h-3 rounded-full bg-secondary/20" />
                            </div>

                            {/* Poster Skeleton */}
                            <div className="w-12 sm:w-16 shrink-0 shadow-md">
                                <AspectRatio ratio={2 / 3}>
                                    <Skeleton className="w-full h-full rounded-md bg-secondary/20" />
                                </AspectRatio>
                            </div>

                            {/* Details Skeleton */}
                            <div className="flex flex-col flex-1 min-w-0 justify-center gap-3 py-1">
                                <Skeleton className="h-5 w-3/4 sm:w-2/3 rounded-md bg-secondary/20" />
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-3 w-12 rounded-md bg-secondary/20" />
                                    <Skeleton className="h-3 w-12 rounded-md bg-secondary/20" />
                                </div>
                            </div>

                            {/* Score Skeleton */}
                            <div className="flex flex-col items-end shrink-0 ml-1 sm:ml-2">
                                <Skeleton className="w-14 h-7 rounded-md bg-secondary/20" />
                            </div>
                            
                        </div>
                    </Card>
                ))}
            </section>
        </div>
    );
};