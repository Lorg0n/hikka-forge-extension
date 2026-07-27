import React, { useEffect, useMemo, useState } from 'react';
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
                <div className="flex flex-col gap-8">
                    <SimilarContentHeader />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
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
                </div>
            </ModuleTransition>
        );
    }

    if (error || items.length === 0) {
        const contentLabel = contentType === 'anime' ? 'аніме' : 'манґи';
        return (
            <ModuleTransition stateKey={error ? 'error' : 'empty'} animateStateChanges={false}>
                <div className="flex flex-col gap-8">
                    <SimilarContentHeader />
                    <NotFound
                        title={`Схожого ${contentLabel} не знайдено`}
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
            <div className="flex flex-col gap-8">
                <SimilarContentHeader />
                <ModuleListTransition
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4"
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
            </div>
        </ModuleTransition>
    );
};

export default SimilarContentComponent;
