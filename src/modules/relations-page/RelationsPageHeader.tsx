import React from 'react';
import { Header, HeaderContainer, HeaderNavButton, HeaderTitle } from '@/components/ui/header';
import { FranchiseContentType, GraphNode } from '@/types';

interface RelationsPageHeaderProps {
    currentNode?: GraphNode | null;
    slug: string;
    contentType: FranchiseContentType;
    nodeCount: number;
}

const contentTypeLabel: Record<FranchiseContentType, string> = {
    anime: 'Аніме',
    manga: 'Манґа',
};

export const RelationsPageHeader: React.FC<RelationsPageHeaderProps> = ({
    currentNode,
    slug,
    contentType,
    nodeCount,
}) => {
    const title = currentNode?.title || 'Тайтл';
    const imageUrl = currentNode?.imageUrl;
    const backHref = `/${contentType}/${slug}`;

    return (
        <div className="flex flex-col gap-6">
            <section className="surface rounded-xl border border-border/70 p-4 sm:p-5">
                <Header href={backHref} className="w-full">
                    <HeaderContainer className="min-w-0 gap-3 sm:gap-4">
                        <div className="relative w-12 shrink-0 overflow-hidden rounded-md bg-muted aspect-[0.7] sm:w-14">
                            {imageUrl && (
                                <img src={imageUrl} alt={title} className="size-full object-cover" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <HeaderTitle
                                variant="h4"
                                className="min-w-0 [&>a]:min-w-0 [&>a>h4]:truncate"
                            >
                                {title}
                            </HeaderTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {contentTypeLabel[contentType]}
                            </p>
                        </div>
                    </HeaderContainer>
                    <HeaderNavButton />
                </Header>
            </section>
        </div>
    );
};
