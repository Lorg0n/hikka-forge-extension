import { useCallback, useEffect, useState } from 'react';
import { SimilarContentApiResponse, SimilarContentType } from '@/types';
import { fetchSimilarAnime } from '@/services/animeService';
import { fetchSimilarManga } from '@/services/mangaService';

interface UseSimilarContentWidgetProps {
    contentType: SimilarContentType;
    slug: string;
    size?: number;
}

interface UseSimilarContentWidgetReturn {
    data: SimilarContentApiResponse | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useSimilarContentWidget = ({
    contentType,
    slug,
    size = 5,
}: UseSimilarContentWidgetProps): UseSimilarContentWidgetReturn => {
    const [data, setData] = useState<SimilarContentApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSimilar = useCallback(async () => {
        if (!slug) {
            setError(`Slug is required to fetch similar ${contentType}.`);
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = contentType === 'anime'
                ? await fetchSimilarAnime({ slug, page: 0, size })
                : await fetchSimilarManga({ slug, page: 0, size });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [contentType, size, slug]);

    useEffect(() => {
        loadSimilar();
    }, [loadSimilar]);

    return { data, loading, error, refresh: loadSimilar };
};
