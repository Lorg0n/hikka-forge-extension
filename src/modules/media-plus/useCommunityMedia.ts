import { useEffect, useState } from 'react';
import { fetchAnimeCommunityMedia } from '@/services/animeService';
import { fetchMangaCommunityMedia } from '@/services/mangaService';
import type { CommunityMediaItem } from '@/types';
import type { MediaPlusRoute } from './mediaPlusRoute';

interface CommunityMediaOptions { page?: number; size?: number; }

export function useCommunityMedia(route: MediaPlusRoute | null, { page = 0, size = 3 }: CommunityMediaOptions = {}) {
    const [items, setItems] = useState<CommunityMediaItem[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!route) {
            setItems([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        const request = route.contentType === 'anime'
            ? fetchAnimeCommunityMedia({ slug: route.slug, page, size })
            : fetchMangaCommunityMedia({ slug: route.slug, page, size });
        void request.then((response) => {
            if (!cancelled) {
                setItems(response.content);
                setTotalPages(response.totalPages);
            }
        }).catch((cause: unknown) => {
            if (!cancelled) setError(cause instanceof Error ? cause.message : 'Не вдалося завантажити медіа.');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [page, route, size]);

    return { items, loading, error, totalPages };
}
