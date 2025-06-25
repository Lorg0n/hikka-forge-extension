import React, { useState } from 'react'; 
import { SimilarAnimeItem } from '@/types';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface SimilarAnimeCardProps {
    anime: SimilarAnimeItem;
}

const getSimilarityText = (distance: number): string => {
    if (distance <= 0.3) {
        return "Дуже схоже";
    }
    if (distance <= 0.4) {
        return "Схоже";
    }
    if (distance <= 0.5) {
        return "Слабо схоже";
    }
    return "Мало спільного";
};

const SimilarAnimeCard: React.FC<SimilarAnimeCardProps> = ({ anime }) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="flex flex-col gap-2">
            <Link href={`/anime/${anime.slug}`}>
                <AspectRatio ratio={2 / 3} className="bg-secondary/20 rounded-lg">
                    <Image
                        src={anime.poster}
                        alt={anime.title}
                        width={200}
                        height={300}
                        className={`
                            w-full h-full object-cover rounded-lg
                            transition-opacity duration-300 ease-in-out
                            ${isLoading ? 'opacity-0' : 'opacity-100'}
                        `}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </AspectRatio>
            </Link>
            <div>
                <p className="mb-1 truncate text-xs text-muted-foreground">
                    {getSimilarityText(anime.distance)}
                </p>
                <p className="text-sm font-medium line-clamp-2">{anime.title}</p>
            </div>
        </div>
    );
};

export default SimilarAnimeCard;