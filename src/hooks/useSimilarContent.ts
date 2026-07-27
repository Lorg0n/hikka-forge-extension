import { useCallback, useEffect, useState } from 'react';
import {
    ForgeContentDetails,
    SimilarContentApiResponse,
    SimilarContentType,
} from '@/types';
import { fetchForgeAnimeDetails, fetchSimilarAnime } from '@/services/animeService';
import { fetchForgeMangaDetails, fetchSimilarManga } from '@/services/mangaService';

interface UseSimilarContentProps {
    contentType: SimilarContentType;
    slug: string;
    initialPage?: number;
    initialSize?: number;
}

interface UseSimilarContentReturn {
    data: SimilarContentApiResponse | null;
    details: ForgeContentDetails | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    refresh: () => void;
}

export const useSimilarContent = ({
    contentType,
    slug,
    initialPage = 0,
    initialSize = 10,
}: UseSimilarContentProps): UseSimilarContentReturn => {
    const [data, setData] = useState<SimilarContentApiResponse | null>(null);
    const [details, setDetails] = useState<ForgeContentDetails | null>(null);
    const [similarLoading, setSimilarLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(true);
    const [similarError, setSimilarError] = useState<string | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialSize);

    const loadSimilar = useCallback(async (pageToLoad: number, sizeToLoad: number) => {
        if (!slug) {
            setSimilarError(`Slug is required to fetch similar ${contentType}.`);
            setSimilarLoading(false);
            setData(null);
            return;
        }

        setSimilarLoading(true);
        setSimilarError(null);

        try {
            const result = contentType === 'anime'
                ? await fetchSimilarAnime({ slug, page: pageToLoad, size: sizeToLoad })
                : await fetchSimilarManga({ slug, page: pageToLoad, size: sizeToLoad });
            setData(result);
        } catch (err) {
            setSimilarError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setSimilarLoading(false);
        }
    }, [contentType, slug]);

    const loadDetails = useCallback(async () => {
        if (!slug) {
            setDetailsError(`Slug is required to fetch ${contentType} details.`);
            setDetailsLoading(false);
            setDetails(null);
            return;
        }

        setDetailsLoading(true);
        setDetailsError(null);

        try {
            const result = contentType === 'anime'
                ? await fetchForgeAnimeDetails({ slug })
                : await fetchForgeMangaDetails({ slug });
            setDetails(result);
        } catch (err) {
            setDetailsError(err instanceof Error ? err.message : 'An unknown error occurred');
            setDetails(null);
        } finally {
            setDetailsLoading(false);
        }
    }, [contentType, slug]);

    useEffect(() => {
        setCurrentPage(initialPage);
    }, [contentType, initialPage, slug]);

    useEffect(() => {
        loadSimilar(currentPage, pageSize);
    }, [currentPage, loadSimilar, pageSize]);

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    const setPage = (newPage: number) => {
        if (newPage >= 0) setCurrentPage(newPage);
    };

    const setSize = (newSize: number) => {
        if (newSize > 0) {
            setPageSize(newSize);
            setCurrentPage(initialPage);
        }
    };

    return {
        data,
        details,
        loading: similarLoading || detailsLoading,
        error: similarError || detailsError,
        currentPage,
        pageSize,
        setPage,
        setSize,
        refresh: () => {
            loadSimilar(currentPage, pageSize);
            loadDetails();
        },
    };
};
