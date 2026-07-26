import React from 'react';
import { IconLinkButton } from '@/components/ui/icon-link-button';
import { PageHeader } from '@/components/ui/page-header';
import { ForgeMangaDetails } from '@/types';

interface SimilarMangaPageHeaderProps {
    details: ForgeMangaDetails;
    slug: string;
}

export const SimilarMangaPageHeader: React.FC<SimilarMangaPageHeaderProps> = ({ details, slug }) => {
    return (
        <PageHeader
            title={details.titleUa || details.titleEn}
            description="Манґа"
            titleHref={`/manga/${slug}`}
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
                    href={`/manga/${slug}`}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Відкрити сторінку манґи"
                    newTab
                />
            }
        />
    );
};
