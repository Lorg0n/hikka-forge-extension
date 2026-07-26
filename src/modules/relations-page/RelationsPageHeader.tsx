import React from 'react';
import Link from '@/components/typography/link';
import { IconLinkButton } from '@/components/ui/icon-link-button';
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
        <div className="relative flex flex-col gap-4 rounded-lg border border-border/60 p-4 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-4">
                    <div className="group relative flex flex-col gap-2 w-12 shrink-0">
                        <div className="relative w-full aspect-[0.7] overflow-hidden rounded-md bg-muted">
                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="w-full h-full object-cover rounded-md"
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Link href={backHref} className="hover:underline text-left">
                                <h4 className="font-bold text-base line-clamp-1">
                                    {title}
                                </h4>
                            </Link>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                                Пов&apos;язане
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {contentTypeLabel[contentType]} • Всі зв&apos;язані тайтли одним графом
                        </p>
                    </div>
                </div>

                <IconLinkButton
                    href={backHref}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Повернутися до тайтлу"
                    newTab
                />
            </div>
        </div>
    );
};
