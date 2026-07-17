import React from 'react'; 
import NotFound from '@/components/ui/not-found';
import { useForgeMangaDetails } from '@/hooks/useForgeMangaDetails';
import { useSimilarManga } from '@/hooks/useSimilarManga';
import { SimilarMangaPageHeader } from './SimilarMangaPageHeader';
import { SimilarMangaPageGrid } from './SimilarMangaPageGrid';
import { SimilarMangaPageSkeleton } from './SimilarMangaPageSkeleton';
import { Pagination } from '@/components/ui/pagination';

const SimilarMangaPageComponent: React.FC = () => {
    const slug = typeof window !== 'undefined'
        ? window.location.pathname.split('/manga/')[1]?.split('#')[0] || ''
        : '';

    const { 
        data: similarData, 
        loading: similarLoading, 
        error: similarError,
        currentPage,
        setPage
    } = useSimilarManga({
        slug,
        initialPage: 0,
        initialSize: 24,
    });

    const { data: mangaDetails, loading: detailsLoading } = useForgeMangaDetails({ slug });

    const isLoading = similarLoading || detailsLoading;

    if (isLoading && !similarData) {
        return (
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                <SimilarMangaPageSkeleton />
            </main>
        );
    }

    if ((similarError || !mangaDetails || !similarData) && !isLoading) {
         return (
             <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                 <div className="flex flex-col gap-12 mt-12">
                    <NotFound
                        title="Не вдалося завантажити схожу манґу"
                        description={similarError || 'Спробуйте оновити сторінку'}
                    />
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
            <div className="flex flex-col gap-12">
                <SimilarMangaPageHeader 
                    details={mangaDetails!} 
                    slug={slug} 
                />
                <SimilarMangaPageGrid 
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

export default SimilarMangaPageComponent;
