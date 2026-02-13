import React, { useState } from 'react';
import { useUserRecommendations } from '@/hooks/useUserRecommendations';
import { useAuth } from '@/contexts/ModuleAuthContext';
import { Header, HeaderContainer, HeaderTitle } from '@/components/ui/header';
import NotFound from '@/components/ui/not-found';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import RecommendationCardWithFeedback from '@/components/ui/anime/recommendation-card-with-feedback';

const UserRecommendationsComponent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    
    const { data, loading: dataLoading, error, refresh } = useUserRecommendations({ 
        initialSize: 20
    });

    const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

    const isLoading = authLoading || (isAuthenticated && dataLoading);
    const list = data?.content?.filter(item => !hiddenItems.has(item.slug)) || [];

    const handleFeedbackSuccess = (slug: string) => {
        refresh();
    };

    if (!isAuthenticated && !authLoading) {
        return (
            <div className="relative flex flex-col gap-4 rounded-lg border border-border p-4">
                <section className="flex flex-col gap-4">
                    <Header>
                        <HeaderContainer>
                            <HeaderTitle>Персональні рекомендації</HeaderTitle>
                        </HeaderContainer>
                    </Header>
                    <div className="rounded-lg border border-dashed border-border p-8 text-center bg-secondary/10">
                        <p className="text-muted-foreground">
                            Увійдіть у розширення Hikka Forge, щоб отримати рекомендації.
                        </p>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-4 rounded-lg border border-border p-4">
            <section className="flex flex-col gap-8">
                <Header href="/recommendations">
                    <HeaderContainer>
                        <HeaderTitle>Персональні рекомендації</HeaderTitle>
                    </HeaderContainer>
                </Header>

                {((list && list.length > 0) || isLoading) && (
                     <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2 -mb-2 snap-x">
                        {isLoading &&
                            Array.from({ length: 5 }).map((_, v) => (
                                <div key={v} className="w-[140px] shrink-0 snap-start flex flex-col gap-3">
                                    <AspectRatio ratio={2 / 3}>
                                        <div className="w-full h-full bg-secondary/20 rounded-lg animate-pulse"></div>
                                    </AspectRatio>
                                    <div className="space-y-2">
                                         <div className="h-4 w-full bg-secondary/20 rounded animate-pulse"></div>
                                         <div className="h-3 w-3/4 bg-secondary/20 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        
                        {!isLoading && list && list.length > 0 &&
                            list.map((item) => (
                                <div key={item.slug} className="w-[120px] shrink-0 snap-start flex">
                                     <RecommendationCardWithFeedback 
                                        anime={item}
                                        onFeedbackSuccess={() => handleFeedbackSuccess(item.slug)}
                                     />
                                </div>
                            ))}
                    </div>
                )}

                {!isLoading && isAuthenticated && (error || list.length === 0) && (
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