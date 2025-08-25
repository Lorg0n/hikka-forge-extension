import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { searchAnime } from '@/services/searchService';
import { AnimeItem, HikkaSearchItem } from '@/types';

// Mapper function to convert search result to our internal type
const mapSearchItemToAnimeItem = (item: HikkaSearchItem): AnimeItem => ({
    type: 'anime',
    slug: item.slug,
    uniqueId: `anime-${item.slug}`,
    name: item.title_en || item.title_ua || item.title_ja || 'Unknown',
    imageUrl: item.image,
});

export const useAnimeSearch = (delay = 500) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<AnimeItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, delay);

    useEffect(() => {
        if (debouncedSearchTerm.trim() === '') {
            setResults([]);
            return;
        }

        let isCancelled = false;
        const performSearch = async () => {
            setIsSearching(true);
            try {
                const response = await searchAnime(debouncedSearchTerm);
                if (!isCancelled) {
                    setResults(response.list.map(mapSearchItemToAnimeItem));
                }
            } catch (error) {
                console.error("Anime search failed:", error);
                if (!isCancelled) {
                    setResults([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsSearching(false);
                }
            }
        };

        performSearch();

        return () => {
            isCancelled = true;
        };
    }, [debouncedSearchTerm]);

    return { searchTerm, setSearchTerm, results, isSearching };
};