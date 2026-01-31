import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const UserCommentsPageSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            {/* Header Skeleton */}
            <div className="relative flex items-center justify-between gap-4 rounded-lg border p-4 bg-secondary/20">
                <div className="flex flex-1 items-center gap-4">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-md animate-pulse bg-secondary/20" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-1/4 rounded-md animate-pulse bg-secondary/20" />
                        <Skeleton className="h-4 w-24 rounded-md animate-pulse bg-secondary/20" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-lg animate-pulse bg-secondary/20" />
            </div>

            {/* List Skeleton */}
            <section className="flex flex-col gap-8">
                <Skeleton className="h-7 w-48 rounded-md animate-pulse bg-secondary/20" />

                <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="flex flex-col w-full md:w-full bg-background-secondary p-4 isolate gap-6 overflow-hidden rounded-lg">
                            <div className="flex flex-col gap-2 w-full">
                                <div className="w-full h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                                <div className="w-5/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                                <div className="w-4/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                                <div className="w-4/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                                <div className="w-4/6 h-3 animate-pulse bg-secondary/20 rounded-lg"></div>
                            </div>
                            <div className="w-20 h-3 animate-pulse bg-secondary/20 rounded-lg mt-auto"></div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
};