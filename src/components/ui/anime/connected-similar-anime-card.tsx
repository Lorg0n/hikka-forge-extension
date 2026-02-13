import React from 'react';
import { SimilarAnimeItem } from '@/types';
import { useSimilarityFeedback } from '@/hooks/useSimilarityFeedback';
import { FeedbackContainer } from '@/components/ui/feedback/feedback-container';
import { SimilarAnimeCard } from './similar-anime-card';

interface ConnectedSimilarAnimeCardProps {
    anime: SimilarAnimeItem;
    contextSlug: string;
    onFeedbackSuccess?: () => void;
}

export const ConnectedSimilarAnimeCard: React.FC<ConnectedSimilarAnimeCardProps> = ({
    anime,
    contextSlug,
    onFeedbackSuccess
}) => {
    const { submitFeedback } = useSimilarityFeedback();

    const handleSubmit = (positive: boolean) => {
        return submitFeedback({
            targetSlug: anime.slug,
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
            <SimilarAnimeCard anime={anime} />
        </FeedbackContainer>
    );
};