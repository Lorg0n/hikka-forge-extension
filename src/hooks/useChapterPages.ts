"use client";

import { useState, useEffect } from "react";
import { fetchHoneyMangaPages, getHoneyMangaImageUrl } from "@/services/honeyMangaService";

export interface ChapterPagesHookReturn {
    pages: string[] | null;
    loading: boolean;
    error: string | null;
}

interface UseChapterPagesProps {
    sourceId: string | null;
    chapterId: string | null;
}

export const useChapterPages = ({ sourceId, chapterId }: UseChapterPagesProps): ChapterPagesHookReturn => {
    const [pages, setPages] = useState<string[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPages = async () => {
            if (!sourceId || !chapterId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setPages(null);

            try {
                let fetchedPages: string[] = [];

                switch (sourceId) {
                    case "honeymanga": {
                        const honeyMangaData = await fetchHoneyMangaPages(chapterId);
                        fetchedPages = Object.entries(honeyMangaData.resourceIds)
                            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
                            .map(([, imageId]) => getHoneyMangaImageUrl(imageId));
                        break;
                    }
                    // FUTURE: case "some-other-source": { ... }
                    default:
                        throw new Error(`Unknown or unsupported source: "${sourceId}"`);
                }

                setPages(fetchedPages);

            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred while fetching pages.");
            } finally {
                setLoading(false);
            }
        };

        fetchPages();
    }, [sourceId, chapterId]);

    return { pages, loading, error };
};