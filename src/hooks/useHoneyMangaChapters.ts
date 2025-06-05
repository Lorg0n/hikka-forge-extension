"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchHoneyMangaChapters, transformHoneyMangaChapterDtoToFrontendChapter } from "@/services/honeyMangaService";

interface UseHoneyMangaChaptersProps {
    mangaId: string | null; 
    enabled?: boolean; 
}

interface ChapterItem {
    id: string;
    volume: number;
    chapterNum: number;
    subChapterNum: number;
    mangaId: string;
    name: string;
    uploadDate: Date | null;
    url: string;
}

interface UseHoneyMangaChaptersReturn {
    data: ChapterItem[] | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useHoneyMangaChapters = ({
    mangaId,
    enabled = true,
}: UseHoneyMangaChaptersProps): UseHoneyMangaChaptersReturn => {
    const [data, setData] = useState<ChapterItem[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadChapters = useCallback(async (id: string | null) => {
        if (!enabled || !id) {
            setData(null);
            setLoading(false);
            setError(null); 
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchHoneyMangaChapters(id);
            const transformedChapters = result.map(transformHoneyMangaChapterDtoToFrontendChapter);
            setData(transformedChapters);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "An unknown error occurred"
            );
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [enabled]); 

    useEffect(() => {
        loadChapters(mangaId);
    }, [loadChapters, mangaId]);

    const refresh = useCallback(() => {
        loadChapters(mangaId);
    }, [loadChapters, mangaId]);

    return { data, loading, error, refresh };
};