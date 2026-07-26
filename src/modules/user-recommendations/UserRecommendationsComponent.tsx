import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useUserRecommendations } from '@/hooks/useUserRecommendations';
import { useAuth } from '@/contexts/ModuleAuthContext';
import { Header, HeaderContainer, HeaderTitle, HeaderNavButton } from '@/components/ui/header';
import NotFound from '@/components/ui/not-found';
import { ConnectedRecommendationCard } from '@/components/ui/anime/connected-recommendation-card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { RecommendationContentType } from '@/types';
import { ModuleTransition } from '@/components/ui/module-transition';

const CONTENT_TYPE_OPTIONS: { value: RecommendationContentType; label: string }[] = [
    { value: 'anime', label: 'Аніме' },
    { value: 'manga', label: 'Манґа' },
];

const CAROUSEL_CLASS =
    'relative -mx-4 -my-4 flex gap-4 overflow-x-auto px-4 py-4 no-scrollbar';

const CAROUSEL_ITEM_CLASS =
    'w-[calc((100%-2rem)/3)] min-w-24 shrink-0 sm:w-[calc((100%-3rem)/4)] md:w-[calc((100%-4rem)/5)]';

const RecommendationCardSkeleton: React.FC = () => (
    <div className="group relative flex w-full flex-col gap-2">
        <div className="relative w-full overflow-hidden rounded-md bg-muted" style={{ paddingBottom: '142.85714285714286%' }}>
            <div className="absolute inset-0 animate-pulse bg-secondary/30" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
            <div className="h-3 w-16 animate-pulse rounded bg-secondary/30" />
            <div className="h-4 w-full animate-pulse rounded bg-secondary/30" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-secondary/30" />
        </div>
    </div>
);

const UserRecommendationsComponent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const {
        data,
        loading: dataLoading,
        error,
        contentType,
        setContentType,
        refresh,
    } = useUserRecommendations({
        initialSize: 20,
    });

    const isLoading = authLoading || (isAuthenticated && dataLoading);

    const list = data?.content || [];
    const carouselRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        carousel.scrollLeft = 0;
        const frame = requestAnimationFrame(() => {
            carousel.scrollLeft = 0;
        });

        return () => cancelAnimationFrame(frame);
    }, [contentType, isLoading, list.length]);

    useEffect(() => {
        console.log('[Hikka Forge][debug] personal recommendations render', {
            authLoading,
            isAuthenticated,
            dataLoading,
            error,
            itemCount: list.length,
            contentType,
        });
    }, [authLoading, isAuthenticated, dataLoading, error, list.length, contentType]);

    useEffect(() => {
        console.log('[Hikka Forge][debug] personal recommendations mounted');
        return () => console.log('[Hikka Forge][debug] personal recommendations unmounted');
    }, []);

    const handleFeedbackSuccess = () => {
        refresh();
    };

    if (!authLoading && !isAuthenticated) {
        return null;
    }

    return (
        <ModuleTransition
            stateKey={isLoading ? "loading" : error ? "error" : list.length ? "content" : "empty"}
            animateStateChanges={false}
        >
        <div
            id="recommendations"
            className="relative isolate flex flex-col gap-4 rounded-lg border border-border p-4 will-change-transform surface"
        >
            <section className="flex min-w-0 flex-col gap-5">
                <Header href="#recommendations">
                    <HeaderContainer>
                        <HeaderTitle variant="h4">
                            Персональні рекомендації
                        </HeaderTitle>
                    </HeaderContainer>
                    <HeaderNavButton />
                </Header>

                <SegmentedControl
                    options={CONTENT_TYPE_OPTIONS}
                    value={contentType}
                    onValueChange={setContentType}
                />

                {isLoading && (
                    <div ref={carouselRef} className={CAROUSEL_CLASS}>
                        {Array.from({ length: 6 }).map((_, v) => (
                            <div key={v} className={CAROUSEL_ITEM_CLASS}>
                                <RecommendationCardSkeleton />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && list.length > 0 && (
                    <div ref={carouselRef} className={CAROUSEL_CLASS}>
                        {list.map((item) => (
                            <div key={item.slug} className={CAROUSEL_ITEM_CLASS}>
                                <ConnectedRecommendationCard
                                    anime={item}
                                    contentType={contentType}
                                    onFeedbackSuccess={handleFeedbackSuccess}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && (error || list.length === 0) && (
                    <NotFound
                        title="Рекомендацій не знайдено"
                        description={error || "Спробуйте оцінити більше тайтлів, щоб ми могли підібрати щось для вас"}
                    />
                )}
            </section>
        </div>
        </ModuleTransition>
    );
};

export default UserRecommendationsComponent;
