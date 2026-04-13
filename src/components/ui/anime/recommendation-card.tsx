import React, { useState } from 'react';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RecommendationItem } from '@/types';

interface RecommendationCardProps {
    anime: RecommendationItem;
    className?: string;
    variant?: 'widget' | 'page';
}

const getSimilarityText = (distance: number): string => {
    if (distance >= 0.9) return "Обов'язково";
    if (distance >= 0.65) return "Варто";
    if (distance >= 0.5) return "Може";
    return "Спробуй";
};

const getSimilarityVariant = (distance: number): "success" | "warning" | "secondary" => {
    if (distance >= 0.9) return "success";
    if (distance >= 0.65) return "warning";
    return "secondary";
};

const RecommendationCard: React.FC<RecommendationCardProps> = ({ anime, className, variant = 'widget' }) => {
    const [isLoading, setIsLoading] = useState(true);

    const isPage = variant === 'page';

    return (
        <div
            className={cn(
                "flex flex-col gap-2",
                isPage ? "w-full" : "w-[120px]",
                className
            )}
            style={isPage ? undefined : { minWidth: '90px', maxWidth: '90px' }}
        >
            <Link href={`/anime/${anime.slug}`} className="relative block w-full mb-3">
                <div className="relative w-full" style={{ paddingBottom: '150%' }}>
                    <div className={cn(
                        "absolute inset-0 bg-secondary/20 rounded-lg overflow-hidden",
                        isLoading && 'animate-pulse'
                    )}>
                        <Image
                            src={anime.imageUrl}
                            alt={anime.title}
                            width={isPage ? 200 : 120}
                            height={isPage ? 300 : 180}
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover rounded-lg transition-all duration-300",
                                "group-hover:scale-105",
                                isLoading ? 'opacity-0' : 'opacity-100'
                            )}
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                    </div>
                </div>
            </Link>

            <div className="flex flex-col gap-1">
                <Badge
                    variant={getSimilarityVariant(anime.similarityScore)}
                    className={cn(
                        "px-2 py-0 whitespace-nowrap w-fit text-[10px]",
                    )}
                >
                    {getSimilarityText(anime.similarityScore)}
                </Badge>

                <Link
                    href={`/anime/${anime.slug}`}
                    className={cn(
                        "font-medium leading-snug",
                        isPage ? "text-sm line-clamp-2" : "text-sm line-clamp-1"
                    )}
                >
                    {anime.title} <span className="text-xs text-muted-foreground">({anime.year})</span>
                </Link>
            </div>
        </div>
    );
};

export default RecommendationCard;