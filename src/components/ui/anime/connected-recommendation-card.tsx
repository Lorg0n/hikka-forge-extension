import React from 'react';
import { RecommendationItem } from '@/types';
import { useRecommendationFeedback } from '@/hooks/useRecommendationFeedback';
import { FeedbackContainer } from '@/components/ui/feedback/feedback-container';
import RecommendationCard from './recommendation-card';

interface ConnectedRecommendationCardProps {
    anime: RecommendationItem;
    onFeedbackSuccess?: () => void;
}

export const ConnectedRecommendationCard: React.FC<ConnectedRecommendationCardProps> = ({
    anime,
    onFeedbackSuccess
}) => {
    const { submitFeedback } = useRecommendationFeedback();

    const handleSubmit = (positive: boolean) => {
        return submitFeedback({
            targetSlug: anime.slug,
            positive
        });
    };

    return (
        <FeedbackContainer 
            onSubmit={handleSubmit} 
            onRemove={onFeedbackSuccess}
            className="h-full"
        >
            <RecommendationCard anime={anime} />
        </FeedbackContainer>
    );
};