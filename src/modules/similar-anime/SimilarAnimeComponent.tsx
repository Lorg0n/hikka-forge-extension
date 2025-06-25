import React from 'react';
import { useSimilarAnime } from '@/hooks/useSimilarAnime';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import NotFound from '@/components/ui/not-found';
import SimilarAnimeCard from '@/components/ui/anime/similar-anime-card';

interface SimilarAnimeComponentProps {
    slug: string;
}

const SimilarAnimeComponent: React.FC<SimilarAnimeComponentProps> = () => {
    const slug = window.location.pathname.split('/anime/')[1];
    const { data, loading, error } = useSimilarAnime({ slug });
    const croppedAnime = data?.content.slice(0, 5) || [];

    if (loading) {
        return (
            <div className="flex flex-col gap-8">
                <h3 className="font-display text-lg font-bold">Схоже</h3>
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
        );
    }

    if (error || croppedAnime.length === 0) {
        return (
            <div className="flex flex-col gap-8">
                <h3 className="font-display text-lg font-bold">Схоже</h3>
                <NotFound
                    title="Схожих аніме не знайдено"
                    description="На жаль, ми не змогли підібрати схожі тайтли. Можливо, варто спробувати пізніше."
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <h3 className="font-display text-lg font-bold">Схоже</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
                {croppedAnime.map((anime) => (
                    <SimilarAnimeCard key={anime.slug} anime={anime} />
                ))}
            </div>
        </div>
    );
};

export default SimilarAnimeComponent;