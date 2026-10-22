import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ForgeContentDetails, SimilarContentType } from '@/types';

interface SimilarPageHeaderProps {
    details: ForgeContentDetails;
    slug: string;
    contentType: SimilarContentType;
}

export const SimilarPageHeader: React.FC<SimilarPageHeaderProps> = ({
    details,
    slug,
    contentType,
}) => {
    const contentPath = `/${contentType}/${slug}`;
    const title = details.titleUa || details.titleEn;
    const pageTitle = contentType === 'anime' ? 'Схожі аніме' : 'Схожа манґа';

    return (
        <PageHeader
            title={pageTitle}
            context={title}
            contextHref={contentPath}
            media={
                <div className="relative w-full overflow-hidden rounded-(--base-radius) bg-muted aspect-[0.7]">
                    <img
                        src={details.imageUrl}
                        alt={title}
                        className="size-full object-cover"
                    />
                </div>
            }
        />
    );
};
