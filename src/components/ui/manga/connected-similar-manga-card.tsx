import React from 'react';
import { SimilarMangaItem } from '@/types';
import { useSimilarityFeedback } from '@/hooks/useSimilarityFeedback';
import { FeedbackContainer } from '@/components/ui/feedback/feedback-container';
import { SimilarMangaCard } from './similar-manga-card';

interface ConnectedSimilarMangaCardProps {
    manga: SimilarMangaItem;
    contextSlug: string;
    onFeedbackSuccess?: () => void;
}

export const ConnectedSimilarMangaCard: React.FC<ConnectedSimilarMangaCardProps> = ({
    manga,
    contextSlug,
    onFeedbackSuccess
}) => {
    const { submitFeedback } = useSimilarityFeedback();

    const handleSubmit = (positive: boolean) => {
        return submitFeedback({
            targetSlug: manga.slug,
            contextSlug: contextSlug,
            positive
        });
    };

    return (
        <FeedbackContainer 
            onSubmit={handleSubmit} 
            onRemove={onFeedbackSuccess}
            className="h-full"
        >
            <SimilarMangaCard manga={manga} />
        </FeedbackContainer>
    );
};
