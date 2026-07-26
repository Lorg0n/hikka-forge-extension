import React from 'react';
import Link from '@/components/typography/link';
import { IconLinkButton } from '@/components/ui/icon-link-button';
import { ForgeMangaDetails } from '@/types';

interface SimilarMangaPageHeaderProps {
    details: ForgeMangaDetails;
    slug: string;
}

export const SimilarMangaPageHeader: React.FC<SimilarMangaPageHeaderProps> = ({ details, slug }) => {
    return (
        <div className="relative flex flex-col gap-4 rounded-lg border border-border/60 p-4 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-4">
                    <div className="group relative flex flex-col gap-2 w-12 shrink-0">
                        <div className="relative w-full aspect-[0.7] overflow-hidden rounded-md bg-muted">
                            <img
                                src={details.imageUrl}
                                alt={details.titleUa || details.titleEn}
                                className="w-full h-full object-cover rounded-md"
                            />
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col">
                        <div className="flex items-center gap-4">
                            <Link href={`/manga/${slug}`} className="hover:underline text-left">
                                <h4 className="font-bold text-base line-clamp-1">
                                    {details.titleUa || details.titleEn}
                                </h4>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">Манґа</p>
                    </div>
                </div>

                <IconLinkButton
                    href={`/manga/${slug}`}
                    icon="material-symbols:arrow-right-alt-rounded"
                    label="Відкрити сторінку манґи"
                    newTab
                />
            </div>
        </div>
    );
};
