import React from 'react';
import { IconLinkButton } from '@/components/ui/icon-link-button';
import { PageHeader } from '@/components/ui/page-header';
import { FranchiseContentType, GraphNode } from '@/types';

interface RelationsPageHeaderProps {
    currentNode?: GraphNode | null;
    slug: string;
    contentType: FranchiseContentType;
}

const contentTypeLabel: Record<FranchiseContentType, string> = {
    anime: 'Аніме',
    manga: 'Манґа',
};

export const RelationsPageHeader: React.FC<RelationsPageHeaderProps> = ({
    currentNode,
    slug,
    contentType,
}) => {
    const title = currentNode?.title || 'Пов\'язане';
    const imageUrl = currentNode?.imageUrl;
    const backHref = `/${contentType}/${slug}`;

    return (
        <PageHeader
            title={title}
            description={`${contentTypeLabel[contentType]} • Всі зв'язані тайтли одним графом`}
            titleHref={backHref}
            media={
                <div className="relative w-12 shrink-0 overflow-hidden rounded-md bg-muted aspect-[0.7]">
                    {imageUrl && (
                        <img src={imageUrl} alt={title} className="size-full object-cover" />
                    )}
                </div>
            }
            titleSuffix={
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    Пов&apos;язане
                </span>
            }
            action={
                <IconLinkButton
                    href={backHref}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Повернутися до тайтлу"
                    newTab
                />
            }
        />
    );
};
