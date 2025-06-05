"use client";

import { useState, useEffect, useCallback } from "react";
import { CompleteHoneyMangaDto } from "@/types/honeymanga";
import { fetchHoneyMangaDetails } from "@/services/honeyMangaService";

interface UseHoneyMangaDetailsProps {
    mangaId: string;
}

interface UseHoneyMangaDetailsReturn {
    data: CompleteHoneyMangaDto | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useHoneyMangaDetails = ({
    mangaId,
}: UseHoneyMangaDetailsProps): UseHoneyMangaDetailsReturn => {
    const [data, setData] = useState<CompleteHoneyMangaDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadMangaDetails = useCallback(async (id: string) => {
        if (!id) {
            setError("Manga ID is required to fetch details.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchHoneyMangaDetails(id);
            setData(result);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "An unknown error occurred"
            );
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMangaDetails(mangaId);
    }, [loadMangaDetails, mangaId]);

    const refresh = useCallback(() => {
        loadMangaDetails(mangaId);
    }, [loadMangaDetails, mangaId]);

    return { data, loading, error, refresh };
};