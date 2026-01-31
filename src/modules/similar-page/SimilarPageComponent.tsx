import React from 'react';
import NotFound from '@/components/ui/not-found';
import { useForgeAnimeDetails } from '@/hooks/useForgeAnimeDetails';
import { useSimilarAnime } from '@/hooks/useSimilarAnime';
import { SimilarPageHeader } from './SimilarPageHeader';
import { SimilarPageGrid } from './SimilarPageGrid';
import { SimilarPageSkeleton } from './SimilarPageSkeleton';

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

    const isLoading = similarLoading || detailsLoading;

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
            {isLoading ? (
                <SimilarPageSkeleton />
            ) : (similarError || !animeDetails || !similarData) ? (
                 <div className="flex flex-col gap-12 mt-12">
                    <NotFound
                        title="Не вдалося завантажити схожі аніме"
                        description={similarError || 'Спробуйте оновити сторінку'}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-12">
                    <SimilarPageHeader 
                        details={animeDetails} 
                        slug={slug} 
                    />
                    
                    <SimilarPageGrid 
                        items={similarData.content} 
                        totalElements={similarData.totalElements} 
                    />
                </div>
            )}
        </main>
    );
};

export default SimilarPageComponent;