import React from 'react';
import { RecommendationItem, RecommendationContentType } from '@/types';
import { useRecommendationFeedback } from '@/hooks/useRecommendationFeedback';
import { FeedbackContainer } from '@/components/ui/feedback/feedback-container';
import RecommendationCard from './recommendation-card';

interface ConnectedRecommendationCardProps {
    anime: RecommendationItem;
    contentType?: RecommendationContentType;
    onFeedbackSuccess?: () => void;
    variant?: 'widget' | 'page';
}

export const ConnectedRecommendationCard: React.FC<ConnectedRecommendationCardProps> = ({
    anime,
    contentType = 'anime',
    onFeedbackSuccess,
    variant = 'widget',
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
            <RecommendationCard anime={anime} contentType={contentType} variant={variant} />
        </FeedbackContainer>
    );
};