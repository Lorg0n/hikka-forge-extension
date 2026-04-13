import React, { useState } from 'react';
import { useUserRecommendations } from '@/hooks/useUserRecommendations';
import { useAuth } from '@/contexts/ModuleAuthContext';
import { Header, HeaderContainer, HeaderTitle, HeaderNavButton } from '@/components/ui/header';
import NotFound from '@/components/ui/not-found';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ConnectedRecommendationCard } from '@/components/ui/anime/connected-recommendation-card';

const UserRecommendationsComponent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const { data, loading: dataLoading, error, refresh } = useUserRecommendations({
        initialSize: 20
    });

    const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

    const isLoading = authLoading || (isAuthenticated && dataLoading);

    const list = data?.content?.filter(item => !hiddenItems.has(item.slug)) || [];

    const handleFeedbackSuccess = (_slug: string) => {
        refresh();
    };

    if (!authLoading && !isAuthenticated) {
        return null;
    }

    return (
        <div className="border-border relative flex-col gap-4 rounded-lg border p-4 isolate will-change-transform bg-secondary/20 items-center backdrop-blur-xl">
            <section className="flex flex-col gap-2">
                <Header href="#recommendations">
                    <HeaderContainer>
                        <HeaderTitle>
                            <h4>Персональні рекомендації</h4>
                        </HeaderTitle>
                    </HeaderContainer>
                    <HeaderNavButton />
                </Header>

                {isLoading && (
                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2 -mb-2 snap-x">
                        {Array.from({ length: 6 }).map((_, v) => (
                            <div key={v} className="w-[120px] shrink-0 snap-start flex flex-col gap-2">
                                <div className="relative w-full pb-[150%]">
                                    <div className="absolute inset-0 bg-secondary/20 rounded-lg animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <div className="h-3 w-full bg-secondary/20 rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && list.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mb-2 snap-x">
                        {list.map((item) => (
                            <div key={item.slug} className="w-[120px] shrink-0 snap-start flex">
                                <ConnectedRecommendationCard
                                    anime={item}
                                    onFeedbackSuccess={() => handleFeedbackSuccess(item.slug)}
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
    );
};

export default UserRecommendationsComponent;