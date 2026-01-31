import React from 'react';
import SimilarAnimeCard from '@/components/ui/anime/similar-anime-card';
import { SimilarAnimeItem } from '@/types';

interface SimilarPageGridProps {
    items: SimilarAnimeItem[];
    totalElements: number;
}

export const SimilarPageGrid: React.FC<SimilarPageGridProps> = ({ items, totalElements }) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-start gap-2">
                <h3 className="font-bold text-lg">Можливо схоже ({totalElements})</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((anime) => (
                    <SimilarAnimeCard key={anime.slug} anime={anime} />
                ))}
            </div>
        </section>
    );
};