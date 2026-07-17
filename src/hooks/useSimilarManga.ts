import { useState, useEffect, useCallback } from 'react';
import { SimilarMangaApiResponse } from '@/types';
import { fetchSimilarManga } from '@/services/mangaService';

interface UseSimilarMangaProps {
    slug: string;
    initialPage?: number;
    initialSize?: number;
}

interface UseSimilarMangaReturn {
    data: SimilarMangaApiResponse | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    refresh: () => void;
}

export const useSimilarManga = ({
    slug,
    initialPage = 0,
    initialSize = 10,
}: UseSimilarMangaProps): UseSimilarMangaReturn => {
    const [data, setData] = useState<SimilarMangaApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialSize);

    const loadSimilar = useCallback(async (pageToLoad: number, sizeToLoad: number) => {
        if (!slug) {
            setError("Slug is required to fetch similar manga.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchSimilarManga({ slug, page: pageToLoad, size: sizeToLoad });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadSimilar(currentPage, pageSize);
    }, [loadSimilar, currentPage, pageSize]);

    const setPage = (newPage: number) => {
        if (newPage >= 0) {
            setCurrentPage(newPage);
        }
    };

    const setSize = (newSize: number) => {
        if (newSize > 0) {
            setPageSize(newSize);
            setCurrentPage(0);
        }
    };

    const refresh = () => {
        loadSimilar(currentPage, pageSize);
    };

    return { data, loading, error, currentPage, pageSize, setPage, setSize, refresh };
};
