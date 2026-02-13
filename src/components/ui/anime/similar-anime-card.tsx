import React, { useState } from 'react'; 
import { SimilarAnimeItem } from '@/types';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface SimilarAnimeCardProps {
    anime: SimilarAnimeItem;
    className?: string;
}

const getSimilarityText = (distance: number): string => {
    if (distance >= 0.9) return "Дуже схоже";
    if (distance >= 0.65) return "Схоже";
    if (distance >= 0.5) return "Слабо схоже";
    return "Мало спільного";
};

export const SimilarAnimeCard: React.FC<SimilarAnimeCardProps> = ({ anime, className }) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={cn("flex flex-col gap-2 group", className)}>
            <Link href={`/anime/${anime.slug}`} className="block">
                <AspectRatio ratio={2 / 3} className="bg-secondary/20 rounded-lg overflow-hidden">
                    <Image
                        src={anime.imageUrl}
                        alt={anime.title}
                        width={200}
                        height={300}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-300",
                            "group-hover:scale-105",
                            isLoading ? 'opacity-0' : 'opacity-100'
                        )}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </AspectRatio>
            </Link>
            <div>
                <p className="mb-1 truncate text-xs text-muted-foreground">
                    {getSimilarityText(anime.similarityScore)}
                </p>
                <Link href={`/anime/${anime.slug}`} className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
                    {anime.title}
                </Link>
            </div>
        </div>
    );
};