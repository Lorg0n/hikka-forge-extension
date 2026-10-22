import React from 'react';
import { ConnectedRecommendationCard } from '@/components/ui/anime/connected-recommendation-card';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SectionHeader } from '@/components/ui/section-header';
import { RecommendationItem, RecommendationContentType } from '@/types';

interface RecommendationsPageGridProps {
    items: RecommendationItem[];
    totalElements: number;
    contentType: RecommendationContentType;
    onContentTypeChange: (contentType: RecommendationContentType) => void;
    onFeedbackSuccess: (slug: string) => void;
}

const CONTENT_TYPE_OPTIONS: { value: RecommendationContentType; label: string }[] = [
    { value: 'anime', label: 'Аніме' },
    { value: 'manga', label: 'Манґа' },
];

export const RecommendationsPageGrid: React.FC<RecommendationsPageGridProps> = ({
    items,
    totalElements,
    contentType,
    onContentTypeChange,
    onFeedbackSuccess,
}) => {
    return (
        <section className="flex flex-col gap-8">
            <SectionHeader
                title={`Рекомендації (${totalElements})`}
                className="flex-wrap"
                action={<SegmentedControl
                    options={CONTENT_TYPE_OPTIONS}
                    value={contentType}
                    onValueChange={onContentTypeChange}
                />}
            />

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
        </section>
    );
};
