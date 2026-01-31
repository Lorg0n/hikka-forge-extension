import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const UserCommentsPageSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-12">
            {/* Header Skeleton */}
            <div className="relative flex flex-col gap-4 rounded-lg border border-slate-200 p-4 bg-slate-100/50 backdrop-blur-sm dark:border-border dark:bg-secondary/20">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="w-12 shrink-0">
                            <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-5 w-1/4 rounded-md" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <section className="flex flex-col gap-8">
                <div className="flex items-start gap-2">
                    <Skeleton className="h-7 w-48 rounded-md" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-4 p-4 rounded-lg border bg-card">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </div>
                            <div className="flex justify-between items-center mt-auto pt-4">
                                <Skeleton className="h-3 w-1/3" />
                                <Skeleton className="h-6 w-10 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};