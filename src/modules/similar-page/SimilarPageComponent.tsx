import React, { useMemo } from 'react';
import NotFound from '@/components/ui/not-found';
import { useSimilarContent } from '@/hooks/useSimilarContent';
import { Pagination } from '@/components/ui/pagination';
import { ModulePageTransition } from '@/components/ui/module-page-transition';
import { SimilarContentType } from '@/types';
import { SimilarPageHeader } from './SimilarPageHeader';
import { SimilarPageGrid } from './SimilarPageGrid';
import { SimilarPageSkeleton } from './SimilarPageSkeleton';
import { MAX_SIMILAR_PAGES } from '@/constants';

interface SimilarContentRoute {
    contentType: SimilarContentType;
    slug: string;
}

const parseRoute = (): SimilarContentRoute | null => {
    if (typeof window === 'undefined') return null;

    const segments = window.location.pathname.split('/').filter(Boolean);
    const contentType = segments[0];

    if (contentType !== 'anime' && contentType !== 'manga') return null;

    return {
        contentType,
        slug: segments.slice(1).join('/'),
    };
};

const SimilarPageComponent: React.FC = () => {
    const route = useMemo(parseRoute, []);
    const contentType = route?.contentType ?? 'anime';
    const slug = route?.slug ?? '';

    const {
        data,
        details,
        loading,
        error,
        currentPage,
        pageSize,
        setPage,
    } = useSimilarContent({
        contentType,
        slug,
        initialPage: 0,
        initialSize: 24,
    });

    if (!route) {
        return (
            <ModulePageTransition stateKey="invalid">
                <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                    <NotFound title="Помилка" description="Не вдалося визначити тип контенту." />
                </main>
            </ModulePageTransition>
        );
    }

    const contentLabel = contentType === 'anime' ? 'аніме' : 'манґу';

    if (loading && (!data || !details)) {
        return (
            <ModulePageTransition stateKey="loading">
                <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                    <SimilarPageSkeleton />
                </main>
            </ModulePageTransition>
        );
    }

    if (error || !data || !details) {
        return (
            <ModulePageTransition stateKey="error">
                <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
                    <div className="flex flex-col gap-12 mt-12">
                        <NotFound
                            title={`Не вдалося завантажити ${contentLabel}`}
                            description={error || 'Спробуйте оновити сторінку'}
                        />
                    </div>
                </main>
            </ModulePageTransition>
        );
    }

    return (
        <ModulePageTransition stateKey="content">
            <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl mb-16">
                <div className="flex flex-col gap-12">
                    <SimilarPageHeader
                        details={details}
                        slug={slug}
                        contentType={contentType}
                    />
                    <SimilarPageGrid
                        items={data.content}
                        totalElements={Math.min(
                            data.totalElements,
                            MAX_SIMILAR_PAGES * pageSize,
                        )}
                        contentType={contentType}
                    />

                    {Math.min(data.totalPages, MAX_SIMILAR_PAGES) > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage + 1}
                                totalPages={Math.min(data.totalPages, MAX_SIMILAR_PAGES)}
                                onPageChange={(page) => setPage(page - 1)}
                            />
                        </div>
                    )}
                </div>
            </main>
        </ModulePageTransition>
    );
};

export default SimilarPageComponent;
