import React from 'react';
import { useSimilarAnime } from '@/hooks/useSimilarAnime';
import Image from '@/components/ui/image';
import Link from '@/components/typography/link';
import { AspectRatio } from '@/components/ui/aspect-ratio'; 
import NotFound from '@/components/ui/not-found'; 

interface SimilarAnimeComponentProps {
    slug: string;
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

const SimilarAnimeComponent: React.FC<SimilarAnimeComponentProps> = () => {
    const slug = window.location.pathname.split('/anime/')[1];
    const { data, loading, error } = useSimilarAnime({ slug });
    const croppedAnime = data?.content.slice(0, 5) || [];

    if (loading) {
        return (
            <div className="flex flex-col gap-8">
                <h3 className="font-display text-lg font-bold">Схоже</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <AspectRatio ratio={2 / 3}>
                                <div className="w-full h-full bg-secondary/20 rounded-lg animate-pulse"></div>
                            </AspectRatio>
                            <div className="flex flex-col gap-2 mt-1">
                                <div className="h-3 w-1/2 bg-secondary/20 rounded animate-pulse"></div>
                                <div className="h-4 w-full bg-secondary/20 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || croppedAnime.length === 0) {
        return (
            <div className="flex flex-col gap-8">
                <h3 className="font-display text-lg font-bold">Схоже</h3>
                <NotFound
                    title="Схожих аніме не знайдено"
                    description="На жаль, ми не змогли підібрати схожі тайтли. Можливо, варто спробувати пізніше."
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <h3 className="font-display text-lg font-bold">Схоже</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full gap-4">
                {croppedAnime.map((anime) => (
                    <div key={anime.slug} className="flex flex-col gap-2">
                        <Link href={`/anime/${anime.slug}`}>
                            <AspectRatio ratio={2 / 3}>
                                <Image
                                    src={anime.poster}
                                    alt={anime.title}
                                    width={200}
                                    height={300}
                                    className="w-full h-full object-cover rounded-lg"
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
                ))}
            </div>
        </div>
    );
};

export default SimilarAnimeComponent;