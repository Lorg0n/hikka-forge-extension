import React from 'react';
import { SimilarMangaCard } from '@/components/ui/manga/similar-manga-card';
import { SimilarMangaItem } from '@/types';

interface SimilarMangaPageGridProps {
    items: SimilarMangaItem[];
    totalElements: number;
}

export const SimilarMangaPageGrid: React.FC<SimilarMangaPageGridProps> = ({ items, totalElements }) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-start gap-2">
                <h3 className="font-bold text-lg">Можливо схоже ({totalElements})</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((manga) => (
                    <SimilarMangaCard key={manga.slug} manga={manga} />
                ))}
            </div>
        </section>
    );
};
