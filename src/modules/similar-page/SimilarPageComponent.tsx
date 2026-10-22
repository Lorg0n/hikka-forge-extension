import React, { useMemo } from 'react';
import NotFound from '@/components/ui/not-found';
import { useSimilarContent } from '@/hooks/useSimilarContent';
import { ModulePage } from '@/components/ui/module-page';
import { ModulePagination } from '@/components/ui/module-pagination';
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
        setPage,
    } = useSimilarContent({
        contentType,
        slug,
        initialPage: 0,
        initialSize: 24,
    });

    if (!route) {
        return (
            <ModulePage stateKey="invalid">
                <NotFound title="Помилка" description="Не вдалося визначити тип контенту." />
            </ModulePage>
        );
    }

    const contentLabel = contentType === 'anime' ? 'аніме' : 'манґу';

    if (loading && (!data || !details)) {
        return (
            <ModulePage stateKey="loading">
                <SimilarPageSkeleton />
            </ModulePage>
        );
    }

    if (error || !data || !details) {
        return (
            <ModulePage stateKey="error">
                <div className="mt-12 flex flex-col gap-12">
                    <NotFound
                        title={`Не вдалося завантажити ${contentLabel}`}
                        description={error || 'Спробуйте оновити сторінку'}
                    />
                </div>
            </ModulePage>
        );
    }

    return (
        <ModulePage stateKey="content">
            <div className="flex flex-col gap-12">
                    <SimilarPageHeader
                        details={details}
                        slug={slug}
                        contentType={contentType}
                    />
                    <SimilarPageGrid
                        items={data.content}
                        contentType={contentType}
                    />

                    <ModulePagination
                        page={currentPage}
                        totalPages={Math.min(data.totalPages, MAX_SIMILAR_PAGES)}
                        onPageChange={setPage}
                    />
            </div>
        </ModulePage>
    );
};

export default SimilarPageComponent;
