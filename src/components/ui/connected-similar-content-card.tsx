import React from 'react';
import { SimilarContentItem, SimilarContentType } from '@/types';
import { useSimilarityFeedback } from '@/hooks/useSimilarityFeedback';
import { FeedbackContainer } from '@/components/ui/feedback/feedback-container';
import { SimilarContentCard } from './similar-content-card';

interface ConnectedSimilarContentCardProps {
    item: SimilarContentItem;
    contentType: SimilarContentType;
    contextSlug: string;
    onFeedbackSuccess?: () => void;
}

export const ConnectedSimilarContentCard: React.FC<ConnectedSimilarContentCardProps> = ({
    item,
    contentType,
    contextSlug,
    onFeedbackSuccess,
}) => {
    const { submitFeedback } = useSimilarityFeedback();

    const handleSubmit = (positive: boolean) => submitFeedback({
        targetSlug: item.slug,
        contextSlug,
        positive,
    });

    return (
        <FeedbackContainer
            onSubmit={handleSubmit}
            onRemove={onFeedbackSuccess}
            className="h-full"
        >
            <SimilarContentCard item={item} contentType={contentType} />
        </FeedbackContainer>
    );
};
