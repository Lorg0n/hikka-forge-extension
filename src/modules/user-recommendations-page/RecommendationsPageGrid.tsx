import React from 'react';
import { ConnectedRecommendationCard } from '@/components/ui/anime/connected-recommendation-card';
import { RecommendationItem } from '@/types';

interface RecommendationsPageGridProps {
    items: RecommendationItem[];
    totalElements: number;
    onFeedbackSuccess: (slug: string) => void;
}

export const RecommendationsPageGrid: React.FC<RecommendationsPageGridProps> = ({
    items,
    totalElements,
    onFeedbackSuccess,
}) => {
    return (
        <section className="flex flex-col gap-8">
            <div className="flex items-start gap-2">
                <h3 className="font-bold text-lg">Рекомендації ({totalElements})</h3>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {items.map((anime) => (
                    <ConnectedRecommendationCard
                        key={anime.slug}
                        anime={anime}
                        variant="page"
                        onFeedbackSuccess={() => onFeedbackSuccess(anime.slug)}
                    />
                ))}
            </div>
        </section>
    );
};