import React from 'react';
import { useUserRecommendations } from '@/hooks/useUserRecommendations';
import { useAuth } from '@/contexts/ModuleAuthContext';
import SimilarAnimeCard from '@/components/ui/anime/similar-anime-card';
import Block from '@/components/ui/block';
import Stack from '@/components/ui/stack';
import { Header, HeaderContainer, HeaderNavButton, HeaderTitle } from '@/components/ui/header';
import NotFound from '@/components/ui/not-found';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const UserRecommendationsComponent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    
    const { data, loading: dataLoading, error } = useUserRecommendations({ 
        initialSize: 8 // Matching Stack size
    });

    const isLoading = authLoading || (isAuthenticated && dataLoading);
    const list = data?.content || [];

    // 1. Unauthenticated State
    if (!isAuthenticated && !authLoading) {
        return (
            <Block>
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
            </Block>
        );
    }

    // 2. Loading & Content State
    return (
        <Block>
            <Header href="/recommendations">
                <HeaderContainer>
                    <HeaderTitle>Персональні рекомендації</HeaderTitle>
                </HeaderContainer>
                {/* Only show nav arrow if we have data */}
                {list.length > 0 && <HeaderNavButton />}
            </Header>

            {((list && list.length > 0) || isLoading) && (
                <Stack size={8} className="snap-x">
                    {isLoading &&
                        Array.from({ length: 8 }).map((_, v) => (
                             <div key={v} className="flex flex-col gap-2 min-w-[140px] snap-start">
                                <AspectRatio ratio={2 / 3}>
                                    <div className="w-full h-full bg-secondary/20 rounded-lg animate-pulse"></div>
                                </AspectRatio>
                                <div className="flex flex-col gap-2 mt-1">
                                    <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse"></div>
                                    <div className="h-4 w-full bg-secondary/20 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    
                    {!isLoading && list && list.length > 0 &&
                        list.map((item) => (
                            <div key={item.slug} className="min-w-[140px] snap-start">
                                <SimilarAnimeCard 
                                    anime={{
                                        slug: item.slug,
                                        title: item.title,
                                        imageUrl: item.imageUrl,
                                        similarityScore: item.similarityScore,
                                        year: item.year,
                                        score: item.score
                                    }} 
                                />
                            </div>
                        ))}
                </Stack>
            )}

            {!isLoading && isAuthenticated && (error || list.length === 0) && (
                <NotFound
                    title="Рекомендацій не знайдено"
                    description={error || "Спробуйте оцінити більше тайтлів, щоб ми могли підібрати щось для вас"}
                />
            )}
        </Block>
    );
};

export default UserRecommendationsComponent;