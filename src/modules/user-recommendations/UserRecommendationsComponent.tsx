import React from 'react';
import { useUserRecommendations } from '@/hooks/useUserRecommendations';
import { useAuth } from '@/contexts/ModuleAuthContext';
import SimilarAnimeCard from '@/components/ui/anime/similar-anime-card';
import { UserRecommendationsHeader } from './UserRecommendationsHeader';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import NotFound from '@/components/ui/not-found';

const UserRecommendationsComponent: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    
    // Only fetch if authenticated
    const { data, loading: dataLoading, error } = useUserRecommendations({ 
        initialSize: 8 // Adjust grid size as needed
    });

    const isLoading = authLoading || (isAuthenticated && dataLoading);

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col gap-8 mb-8">
                <UserRecommendationsHeader />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <AspectRatio ratio={2 / 3}>
                                <div className="w-full h-full bg-secondary/20 rounded-lg animate-pulse"></div>
                            </AspectRatio>
                            <div className="flex flex-col gap-2 mt-1">
                                <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse"></div>
                                <div className="h-4 w-full bg-secondary/20 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. Unauthenticated State
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col gap-8 mb-8">
                <UserRecommendationsHeader />
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">Потрібна авторизація</h3>
                    <p className="text-muted-foreground mb-4">
                        Будь ласка, увійдіть у розширення Hikka Forge, щоб отримати персональні рекомендації.
                    </p>
                    {/* The login is handled in the popup, so we just inform the user */}
                    <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded inline-block">
                        Відкрийте іконку розширення в браузері та натисніть "Увійти"
                    </div>
                </div>
            </div>
        );
    }

    // 3. Error or Empty State
    if (error || !data?.content || data.content.length === 0) {
        return (
            <div className="flex flex-col gap-8 mb-8">
                <UserRecommendationsHeader />
                <NotFound
                    title="Рекомендацій не знайдено"
                    description={error || 'Спробуйте оцінити більше тайтлів, щоб ми могли підібрати щось для вас.'}
                />
            </div>
        );
    }

    // 4. Success State
    return (
        <div className="flex flex-col gap-8 mb-8">
            <UserRecommendationsHeader />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.content.map((item) => (
                    // We can reuse SimilarAnimeCard as it expects similar structure
                    // Casting might be needed if RecommendationItem differs slightly from SimilarAnimeItem
                    <SimilarAnimeCard 
                        key={item.slug} 
                        anime={{
                            slug: item.slug,
                            title: item.title,
                            imageUrl: item.imageUrl,
                            similarityScore: item.similarityScore,
                            year: item.year,
                            score: item.score
                        }} 
                    />
                ))}
            </div>
        </div>
    );
};

export default UserRecommendationsComponent;