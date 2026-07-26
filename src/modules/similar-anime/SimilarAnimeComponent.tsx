import React, { useState } from 'react';
import { useSimilarAnime } from '@/hooks/useSimilarAnime';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import NotFound from '@/components/ui/not-found';
import { ConnectedSimilarAnimeCard } from '@/components/ui/anime/connected-similar-anime-card';
import { SimilarAnimeHeader } from './SimilarAnimeHeader';
import { ModuleListTransition, ModuleTransition } from '@/components/ui/module-transition';

const SimilarAnimeComponent: React.FC = () => {
    const slug = typeof window !== 'undefined' ? window.location.pathname.split('/anime/')[1] : '';
    const { data, loading, error, refresh } = useSimilarAnime({ slug, initialSize: 5 });
    const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
    
    const similarAnimeList = data?.content?.filter(item => !hiddenItems.has(item.slug)) || [];

    const handleFeedbackSuccess = (itemSlug: string) => {
        // Optionally refresh data after feedback
        refresh();
    };

    if (loading) {
        return (
            <ModuleTransition stateKey="loading">
            <div className="flex flex-col gap-8">
                <SimilarAnimeHeader />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
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
            </ModuleTransition>
        );
    }

    if (error || similarAnimeList.length === 0) {
        return (
            <ModuleTransition stateKey={error ? "error" : "empty"}>
            <div className="flex flex-col gap-8">
                <SimilarAnimeHeader />
                <NotFound
                    title="Схожих аніме не знайдено"
                    description={error ? 'Не вдалося завантажити схожі аніме.' : 'На жаль, ми не змогли підібрати схожі тайтли.'}
                />
            </div>
            </ModuleTransition>
        );
    }

    return (
        <ModuleTransition stateKey="content">
        <div className="flex flex-col gap-8">
            <SimilarAnimeHeader />
            <ModuleListTransition className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
                {similarAnimeList.map((anime) => (
                    <ConnectedSimilarAnimeCard 
                        key={anime.slug} 
                        anime={anime}
                        contextSlug={slug}
                        onFeedbackSuccess={() => handleFeedbackSuccess(anime.slug)}
                    />
                ))}
            </ModuleListTransition>
        </div>
        </ModuleTransition>
    );
};

export default SimilarAnimeComponent;
