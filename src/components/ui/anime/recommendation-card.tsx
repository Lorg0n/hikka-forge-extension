import { logger } from "@/utils/logger";
import React, { useState } from 'react';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { RecommendationItem, RecommendationContentType } from '@/types';

interface RecommendationCardProps {
    anime: RecommendationItem;
    contentType?: RecommendationContentType;
    className?: string;
    variant?: 'widget' | 'page';
}

const getSimilarityText = (distance: number): string => {
    if (distance >= 0.9) return "Обов'язково";
    if (distance >= 0.65) return "Варто";
    if (distance >= 0.5) return "Може";
    return "Спробуй";
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({
    anime,
    contentType = 'anime',
    className,
    variant = 'widget',
}) => {
    const [isLoading, setIsLoading] = useState(true);

    const isPage = variant === 'page';
    const contentPath = contentType;

    return (
        <div
            className={cn(
                "group relative flex w-full flex-col gap-2",
                className
            )}
        >
            <div className="relative w-full overflow-hidden rounded-md bg-muted" style={{ paddingBottom: '142.85714285714286%' }}>
                <Link
                    href={`/${contentPath}/${anime.slug}`}
                    className={cn(
                        '@container absolute inset-0 flex size-full items-center justify-center bg-secondary/20',
                        isLoading && 'animate-pulse',
                    )}
                >
                        <Image
                            src={anime.imageUrl}
                            alt={anime.title}
                            width={400}
                            height={572}
                            className={cn(
                                "h-full w-full object-cover",
                                isLoading ? 'opacity-0' : 'opacity-100'
                            )}
                            onLoad={() => {
                                logger.log('[Hikka Forge][debug] recommendation image loaded', {
                                    slug: anime.slug,
                                    imageUrl: anime.imageUrl,
                                });
                                setIsLoading(false);
                            }}
                            onError={() => {
                                logger.log('[Hikka Forge][debug] recommendation image failed', {
                                    slug: anime.slug,
                                    imageUrl: anime.imageUrl,
                                });
                                setIsLoading(false);
                            }}
                        />
                </Link>
            </div>

            <div>
                <p className="mb-1 truncate text-muted-foreground text-xs">
                    {getSimilarityText(anime.similarityScore)}
                </p>

                <Link
                    href={`/${contentPath}/${anime.slug}`}
                    className={cn(
                        "font-medium leading-5 text-card-foreground hover:text-card-foreground",
                        isPage ? "text-sm line-clamp-2" : "text-sm line-clamp-2"
                    )}
                >
                    {anime.title} <span className="text-xs text-muted-foreground">({anime.year})</span>
                </Link>
            </div>
        </div>
    );
};

export default RecommendationCard;
