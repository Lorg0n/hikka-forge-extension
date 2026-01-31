import React, { useEffect } from 'react';
import NotFound from '@/components/ui/not-found';
import { useForgeAnimeDetails } from '@/hooks/useForgeAnimeDetails';
import { useSimilarAnime } from '@/hooks/useSimilarAnime';
import { SimilarPageHeader } from './SimilarPageHeader';
import { SimilarPageGrid } from './SimilarPageGrid';
import { SimilarPageSkeleton } from './SimilarPageSkeleton';
import { Pagination } from '@/components/ui/pagination';

const SimilarPageComponent: React.FC = () => {
    const slug = typeof window !== 'undefined'
        ? window.location.pathname.split('/anime/')[1]?.split('#')[0] || ''
        : '';

    const {
        data: similarData,
        loading: similarLoading,
        error: similarError,
        currentPage,
        setPage
    } = useSimilarAnime({
        slug,
        initialPage: 0,
        initialSize: 24,
    });

    const { data: animeDetails, loading: detailsLoading } = useForgeAnimeDetails({ slug });

    const isLoading = similarLoading || detailsLoading;

    useEffect(() => {
        if (!similarLoading && similarData) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage, similarLoading]);

    if (isLoading) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                <SimilarPageSkeleton />
            </main>
        );
    }

    if ((similarError || !animeDetails || !similarData) && !isLoading) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                <div className="flex flex-col gap-12 mt-12">
                    <NotFound
                        title="Не вдалося завантажити схожі аніме"
                        description={similarError || 'Спробуйте оновити сторінку'}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
            <div className="flex flex-col gap-12">
                <SimilarPageHeader
                    details={animeDetails!}
                    slug={slug}
                />

                <SimilarPageGrid
                    items={similarData!.content}
                    totalElements={similarData!.totalElements}
                />

                {similarData && similarData.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage + 1}
                            totalPages={similarData.totalPages}
                            onPageChange={(page) => setPage(page - 1)}
                        />
                    </div>
                )}
            </div>
        </main>
    );
};

export default SimilarPageComponent;