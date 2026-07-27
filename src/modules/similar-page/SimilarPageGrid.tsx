import React from 'react';
import { SimilarAnimeCard } from '@/components/ui/anime/similar-anime-card';
import { SimilarMangaCard } from '@/components/ui/manga/similar-manga-card';
import { SimilarAnimeItem, SimilarContentItem, SimilarContentType, SimilarMangaItem } from '@/types';

interface SimilarPageGridProps {
    items: SimilarContentItem[];
    totalElements: number;
    contentType: SimilarContentType;
}

export const SimilarPageGrid: React.FC<SimilarPageGridProps> = ({ items, totalElements, contentType }) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-start gap-2">
                <h3 className="font-bold text-lg">Можливо схоже ({totalElements})</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {contentType === 'anime'
                    ? (items as SimilarAnimeItem[]).map((anime) => (
                        <SimilarAnimeCard key={anime.slug} anime={anime} />
                    ))
                    : (items as SimilarMangaItem[]).map((manga) => (
                        <SimilarMangaCard key={manga.slug} manga={manga} />
                    ))}
            </div>
        </section>
    );
};
