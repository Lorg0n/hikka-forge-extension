import React from 'react';
import Link from '@/components/typography/link';
import { ForgeAnimeDetails } from '@/types';

interface SimilarPageHeaderProps {
    details: ForgeAnimeDetails;
    slug: string;
}

export const SimilarPageHeader: React.FC<SimilarPageHeaderProps> = ({ details, slug }) => {
    return (
        <div className="relative flex flex-col gap-4 rounded-lg border border-slate-200 p-4 bg-slate-100/50 backdrop-blur-sm dark:border-border dark:bg-secondary/20">
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
                            <Link href={`/anime/${slug}`} className="hover:underline text-left">
                                <h4 className="font-bold text-base line-clamp-1">
                                    {details.titleUa || details.titleEn}
                                </h4>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">Аніме</p>
                    </div>
                </div>

                <Link 
                    href={`/anime/${slug}`}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.15 13H5q-.425 0-.712-.288T4 12t.288-.712T5 11h11.15L13.3 8.15q-.3-.3-.288-.7t.288-.7q.3-.3.713-.312t.712.287L19.3 11.3q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.575 4.575q-.3.3-.712.288t-.713-.313q-.275-.3-.288-.7t.288-.7z" /></svg>
                </Link>
            </div>
        </div>
    );
};