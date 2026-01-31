import { fetchForgeAnimeDetails } from '@/services/animeService';
import { ForgeAnimeDetails } from '@/types';
import { useState, useEffect, useCallback } from 'react';

interface UseForgeAnimeDetailsProps {
    slug: string;
}

interface UseForgeAnimeDetailsReturn {
    data: ForgeAnimeDetails | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useForgeAnimeDetails = ({
    slug,
}: UseForgeAnimeDetailsProps): UseForgeAnimeDetailsReturn => {
    const [data, setData] = useState<ForgeAnimeDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadAnimeDetails = useCallback(async () => {
        if (!slug) {
            setError("Slug is required to fetch anime details.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchForgeAnimeDetails({ slug });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadAnimeDetails();
    }, [loadAnimeDetails]);

    const refresh = () => {
        loadAnimeDetails();
    };

    return { data, loading, error, refresh };
};