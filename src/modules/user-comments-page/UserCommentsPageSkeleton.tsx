import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const UserCommentsPageSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            {/* Header Skeleton */}
            <div className="relative flex items-center justify-between gap-4 rounded-lg border p-4 bg-secondary/20">
                <div className="flex flex-1 items-center gap-4">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-5 w-1/4 rounded-md" />
                        <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>

            {/* List Skeleton */}
            <section className="flex flex-col gap-8">
                <Skeleton className="h-7 w-48 rounded-md" />
                
                <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-4 sm:p-5">
                            {/* Content Context Skeleton */}
                            <div className="mb-4 flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
                                <Skeleton className="h-24 w-16 flex-shrink-0 rounded-md sm:h-28 sm:w-20" />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-5 w-5/6" />
                                    <Skeleton className="h-5 w-4/6" />
                                </div>
                            </div>
                            {/* Comment Text Skeleton */}
                            <div className="mb-4 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[90%]" />
                            </div>
                            {/* Meta Skeleton */}
                            <div className="flex items-center justify-between gap-3 border-t pt-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-7 w-12 rounded-full" />
                                    <Skeleton className="h-7 w-12 rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};