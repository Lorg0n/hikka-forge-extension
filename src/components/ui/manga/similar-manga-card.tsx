import React, { useState } from 'react'; 
import { SimilarMangaItem } from '@/types';
import Link from '@/components/typography/link';
import Image from '@/components/ui/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface SimilarMangaCardProps {
    manga: SimilarMangaItem;
    className?: string;
}

const getSimilarityText = (distance: number): string => {
    if (distance >= 0.9) return "Дуже схоже";
    if (distance >= 0.65) return "Схоже";
    if (distance >= 0.5) return "Слабо схоже";
    return "Мало спільного";
};

export const SimilarMangaCard: React.FC<SimilarMangaCardProps> = ({ manga, className }) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={cn("flex flex-col gap-2 group", className)}>
            <Link href={`/manga/${manga.slug}`} className="block">
                <AspectRatio ratio={2 / 3} className="bg-secondary/20 rounded-lg overflow-hidden">
                    <Image
                        src={manga.imageUrl}
                        alt={manga.title}
                        width={200}
                        height={300}
                        className={cn(
                            "w-full h-full object-cover transition-all duration-300",
                            "group-hover:scale-105",
                            isLoading ? 'opacity-0' : 'opacity-100'
                        )}
                        onLoad={() => {
                            console.log('[Hikka Forge][debug] similar manga image loaded', {
                                slug: manga.slug,
                                imageUrl: manga.imageUrl,
                            });
                            setIsLoading(false);
                        }}
                        onError={() => {
                            console.log('[Hikka Forge][debug] similar manga image failed', {
                                slug: manga.slug,
                                imageUrl: manga.imageUrl,
                            });
                            setIsLoading(false);
                        }}
                    />
                </AspectRatio>
            </Link>
            <div>
                <p className="mb-1 truncate text-xs text-muted-foreground">
                    {getSimilarityText(manga.similarityScore)}
                </p>
                <Link href={`/manga/${manga.slug}`} className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
                    {manga.title}
                </Link>
            </div>
        </div>
    );
};
