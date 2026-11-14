import { useEffect, useState } from 'react';
import { fetchAnimeCommunityMedia } from '@/services/animeService';
import { fetchMangaCommunityMedia } from '@/services/mangaService';
import type { CommunityMediaItem } from '@/types';
import type { MediaPlusRoute } from './mediaPlusRoute';

const MEDIA_LIMIT = 3;

export function useCommunityMedia(route: MediaPlusRoute | null) {
    const [items, setItems] = useState<CommunityMediaItem[]>([]);
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
            ? fetchAnimeCommunityMedia({ slug: route.slug, page: 0, size: MEDIA_LIMIT })
            : fetchMangaCommunityMedia({ slug: route.slug, page: 0, size: MEDIA_LIMIT });
        void request.then((response) => {
            if (!cancelled) setItems(response.content.slice(0, MEDIA_LIMIT));
        }).catch((cause: unknown) => {
            if (!cancelled) setError(cause instanceof Error ? cause.message : 'Не вдалося завантажити медіа.');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [route]);

    return { items, loading, error };
}
