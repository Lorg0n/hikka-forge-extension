import { fetchForgeMangaDetails } from '@/services/mangaService';
import { ForgeMangaDetails } from '@/types';
import { useState, useEffect, useCallback } from 'react';

interface UseForgeMangaDetailsProps {
    slug: string;
}

interface UseForgeMangaDetailsReturn {
    data: ForgeMangaDetails | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useForgeMangaDetails = ({
    slug,
}: UseForgeMangaDetailsProps): UseForgeMangaDetailsReturn => {
    const [data, setData] = useState<ForgeMangaDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadMangaDetails = useCallback(async () => {
        if (!slug) {
            setError("Slug is required to fetch manga details.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchForgeMangaDetails({ slug });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadMangaDetails();
    }, [loadMangaDetails]);

    const refresh = () => {
        loadMangaDetails();
    };

    return { data, loading, error, refresh };
};
