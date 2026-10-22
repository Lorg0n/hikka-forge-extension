import React from 'react';
import { ConnectedRecommendationCard } from '@/components/ui/anime/connected-recommendation-card';
import { RecommendationItem, RecommendationContentType } from '@/types';

interface RecommendationsPageGridProps {
    items: RecommendationItem[];
    contentType: RecommendationContentType;
    onFeedbackSuccess: (slug: string) => void;
}

export const RecommendationsPageGrid: React.FC<
    RecommendationsPageGridProps
> = ({ items, contentType, onFeedbackSuccess }) => {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {items.map((anime) => (
                <ConnectedRecommendationCard
                    key={anime.slug}
                    anime={anime}
                    contentType={contentType}
                    variant="page"
                    onFeedbackSuccess={() => onFeedbackSuccess(anime.slug)}
                />
            ))}
        </div>
    );
};
