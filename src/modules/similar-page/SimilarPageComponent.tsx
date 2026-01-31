import Link from '@/components/typography/link';
import SimilarAnimeCard from '@/components/ui/anime/similar-anime-card';
import NotFound from '@/components/ui/not-found';
import { useForgeAnimeDetails } from '@/hooks/useForgeAnimeDetails';
import { useSimilarAnime } from '@/hooks/useSimilarAnime';
import React from 'react';

const SimilarPageComponent: React.FC = () => {
    const slug = typeof window !== 'undefined' 
        ? window.location.pathname.split('/anime/')[1]?.split('#')[0] || ''
        : '';

    const { data: similarData, loading: similarLoading, error: similarError } = useSimilarAnime({
        slug,
        initialPage: 0,
        initialSize: 50,
    });

    const { data: animeDetails, loading: detailsLoading } = useForgeAnimeDetails({ slug });

    if (similarError || !animeDetails) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-7xl">
                <div className="flex flex-col gap-12">
                    <NotFound
                        title="Не вдалося завантажити схожі аніме"
                        description={similarError || 'Спробуйте оновити сторінку'}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
            <div className="flex flex-col gap-12">
                <div className="relative flex flex-col gap-4 rounded-lg border border-slate-200 p-4 bg-slate-100/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 items-center gap-4">

                            <div className="group relative flex flex-col gap-2 w-12 shrink-0">
                                <div className="relative w-full aspect-[0.7] overflow-hidden rounded-md bg-slate-300">
                                    <img 
                                            src={animeDetails.imageUrl} 
                                            alt={animeDetails.titleUa || animeDetails.titleEn}
                                            className="w-full h-full object-cover rounded-md" 
                                        />
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col">
                                <div className="flex items-center gap-4">
                                    <Link href={`/anime/${slug}`} className="hover:underline text-left">
                                        <h4 className="font-bold text-base">
                                            {animeDetails.titleUa || animeDetails.titleEn}
                                        </h4>
                                    </Link>
                                </div>
                                <p className="text-sm text-muted-foreground">Аніме</p>
                            </div>
                        </div>

                        <a href="" className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.15 13H5q-.425 0-.712-.288T4 12t.288-.712T5 11h11.15L13.3 8.15q-.3-.3-.288-.7t.288-.7q.3-.3.713-.312t.712.287L19.3 11.3q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.575 4.575q-.3.3-.712.288t-.713-.313q-.275-.3-.288-.7t.288-.7z" /></svg>
                        </a>
                    </div>
                </div>

                <section className="flex flex-col gap-8">
                    <div className="flex items-start gap-2">
                        <h3 className="font-bold text-lg">Можливо схоже ({similarData?.totalElements})</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {similarData?.content.map((anime) => (
                            <SimilarAnimeCard key={anime.slug} anime={anime} />
                        ))}
                    </div>
                </section>

            </div>
        </main>
    );
};

export default SimilarPageComponent;