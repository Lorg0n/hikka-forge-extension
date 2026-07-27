import React from 'react';
import { IconLinkButton } from '@/components/ui/icon-link-button';
import { PageHeader } from '@/components/ui/page-header';
import { ForgeContentDetails, SimilarContentType } from '@/types';

interface SimilarPageHeaderProps {
    details: ForgeContentDetails;
    slug: string;
    contentType: SimilarContentType;
}

export const SimilarPageHeader: React.FC<SimilarPageHeaderProps> = ({ details, slug, contentType }) => {
    const contentLabel = contentType === 'anime' ? 'Аніме' : 'Манґа';
    const contentPath = `/${contentType}/${slug}`;
    const title = details.titleUa || details.titleEn;

    return (
        <PageHeader
            title={title}
            description={contentLabel}
            titleHref={contentPath}
            media={
                <div className="relative w-12 shrink-0 overflow-hidden rounded-md bg-muted aspect-[0.7]">
                    <img
                        src={details.imageUrl}
                        alt={title}
                        className="size-full object-cover"
                    />
                </div>
            }
            action={
                <IconLinkButton
                    href={contentPath}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label={`Відкрити сторінку: ${contentLabel.toLowerCase()}`}
                />
            }
        />
    );
};
