import React from 'react';
import { IconLinkButton } from '@/components/ui/icon-link-button';
import { PageHeader } from '@/components/ui/page-header';
import { ForgeAnimeDetails } from '@/types';

interface SimilarPageHeaderProps {
    details: ForgeAnimeDetails;
    slug: string;
}

export const SimilarPageHeader: React.FC<SimilarPageHeaderProps> = ({ details, slug }) => {
    return (
        <PageHeader
            title={details.titleUa || details.titleEn}
            description="Аніме"
            titleHref={`/anime/${slug}`}
            media={
                <div className="relative w-12 shrink-0 overflow-hidden rounded-md bg-muted aspect-[0.7]">
                    <img
                        src={details.imageUrl}
                        alt={details.titleUa || details.titleEn}
                        className="size-full object-cover"
                    />
                </div>
            }
            action={
                <IconLinkButton
                    href={`/anime/${slug}`}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Відкрити сторінку аніме"
                    newTab
                />
            }
        />
    );
};
