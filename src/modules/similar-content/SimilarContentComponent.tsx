import React, { useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '@/utils/logger';
import { SimilarContentType } from '@/types';
import { useSimilarContentWidget } from '@/hooks/useSimilarContentWidget';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import NotFound from '@/components/ui/not-found';
import { ModuleListTransition, ModuleTransition } from '@/components/ui/module-transition';
import { ConnectedSimilarContentCard } from '@/components/ui/connected-similar-content-card';
import { SimilarContentHeader } from './SimilarContentHeader';

interface SimilarContentRoute {
    contentType: SimilarContentType;
    slug: string;
}

const contentGridClassName = 'no-scrollbar grid w-full min-w-0 grid-flow-col auto-cols-[max(6rem,calc((100%_-_4rem)/5))] gap-4 overflow-x-auto overscroll-x-contain pb-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-5 md:overflow-visible md:pb-0';

interface EdgeFades {
    left: boolean;
    right: boolean;
}

const useHorizontalEdgeFades = (itemCount: number, loading: boolean) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [edgeFades, setEdgeFades] = useState<EdgeFades>({ left: false, right: false });

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const updateEdgeFades = () => {
            const gridBounds = grid.getBoundingClientRect();
            const tolerance = 1;
            const children = Array.from(grid.children);
            const next = {
                left: children.some((child) => child.getBoundingClientRect().left < gridBounds.left - tolerance),
                right: children.some((child) => child.getBoundingClientRect().right > gridBounds.right + tolerance),
            };

            setEdgeFades((current) => (
                current.left === next.left && current.right === next.right ? current : next
            ));
        };

        updateEdgeFades();
        const frame = requestAnimationFrame(updateEdgeFades);
        const resizeObserver = new ResizeObserver(updateEdgeFades);
        resizeObserver.observe(grid);
        grid.addEventListener('scroll', updateEdgeFades, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            grid.removeEventListener('scroll', updateEdgeFades);
        };
    }, [itemCount, loading]);

    return { gridRef, edgeFades };
};

const HorizontalEdgeFades: React.FC<EdgeFades> = ({ left, right }) => (
    <>
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background/85 via-background/40 to-transparent transition-opacity duration-300 ease-out md:hidden ${left ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background/85 via-background/40 to-transparent transition-opacity duration-300 ease-out md:hidden ${right ? 'opacity-100' : 'opacity-0'}`}
        />
    </>
);

const parseRoute = (): SimilarContentRoute | null => {
    if (typeof window === 'undefined') return null;

    const segments = window.location.pathname.split('/').filter(Boolean);
    const contentType = segments[0];
    if (contentType !== 'anime' && contentType !== 'manga') return null;

    return {
        contentType,
        slug: segments.slice(1).join('/'),
    };
};

const SimilarContentComponent: React.FC = () => {
    const route = useMemo(parseRoute, []);
    const contentType = route?.contentType ?? 'anime';
    const slug = route?.slug ?? '';
    const { data, loading, error, refresh } = useSimilarContentWidget({
        contentType,
        slug,
        size: 5,
    });
    const [hiddenItems] = useState<Set<string>>(new Set());
    const items = data?.content.filter((item) => !hiddenItems.has(item.slug)) ?? [];
    const { gridRef, edgeFades } = useHorizontalEdgeFades(loading ? 5 : items.length, loading);

    useEffect(() => {
        if (!route) return;
        logger.log('[Hikka Forge][debug] similar content render', {
            loading,
            error,
            itemCount: items.length,
            contentType,
            slug,
        });
    }, [contentType, error, items.length, loading, route, slug]);

    if (!route) return null;

    if (loading) {
        return (
            <ModuleTransition stateKey="loading" animateStateChanges={false}>
                <div className="flex min-w-0 flex-col gap-8">
                    <SimilarContentHeader />
                    <div className="relative -mx-4 min-w-0 md:mx-0">
                        <div ref={gridRef} className={`${contentGridClassName} px-4 md:px-0`}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="flex flex-col gap-2">
                                    <AspectRatio ratio={2 / 3}>
                                        <div className="w-full h-full bg-secondary/20 rounded-lg animate-pulse" />
                                    </AspectRatio>
                                    <div className="flex flex-col gap-2 mt-1">
                                        <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse" />
                                        <div className="h-4 w-full bg-secondary/20 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <HorizontalEdgeFades {...edgeFades} />
                    </div>
                </div>
            </ModuleTransition>
        );
    }

    if (error || items.length === 0) {
        const emptyTitle = contentType === 'anime'
            ? 'Схожого аніме не знайдено'
            : 'Схожої манґи не знайдено';
        return (
            <ModuleTransition stateKey={error ? 'error' : 'empty'} animateStateChanges={false}>
                <div className="flex flex-col gap-8">
                    <SimilarContentHeader />
                    <NotFound
                        title={emptyTitle}
                        description={error
                            ? 'Не вдалося завантажити схожий контент.'
                            : 'На жаль, ми не змогли підібрати схожі тайтли.'}
                    />
                </div>
            </ModuleTransition>
        );
    }

    return (
        <ModuleTransition stateKey="content" animateStateChanges={false}>
            <div className="flex min-w-0 flex-col gap-8">
                <SimilarContentHeader />
                <div className="relative -mx-4 min-w-0 md:mx-0">
                    <ModuleListTransition
                        ref={gridRef}
                        className={`${contentGridClassName} px-4 md:px-0`}
                        animateOnMount={false}
                    >
                        {items.map((item) => (
                            <ConnectedSimilarContentCard
                                key={item.slug}
                                item={item}
                                contentType={contentType}
                                contextSlug={slug}
                                onFeedbackSuccess={refresh}
                            />
                        ))}
                    </ModuleListTransition>
                    <HorizontalEdgeFades {...edgeFades} />
                </div>
            </div>
        </ModuleTransition>
    );
};

export default SimilarContentComponent;
