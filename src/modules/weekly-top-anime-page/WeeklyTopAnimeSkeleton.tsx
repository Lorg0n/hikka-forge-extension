import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const WeeklyTopAnimeSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            {/* Header Skeleton */}
            <div className="relative flex flex-col gap-4 rounded-lg border p-4 bg-secondary/20">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-6 w-48 rounded-md animate-pulse bg-secondary/20" />
                        <Skeleton className="h-4 w-64 rounded-md animate-pulse bg-secondary/20" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg animate-pulse bg-secondary/20" />
                </div>
            </div>

            {/* List Skeleton */}
            <section className="flex flex-col gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="relative w-full h-16 rounded-lg overflow-hidden border border-border/50 bg-secondary/10">
                        <div className="flex items-center justify-between h-full px-4 gap-4 w-full">
                            <Skeleton className="w-8 h-8 rounded bg-secondary/30" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-1/2 bg-secondary/30" />
                            </div>
                            <Skeleton className="w-16 h-8 rounded bg-secondary/30" />
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};