import { useState, useEffect, useCallback } from 'react';
import { WeeklyTopAnimeApiResponse } from '@/types';
import { fetchWeeklyTopAnime } from '@/services/animeService';

interface UseWeeklyTopAnimeProps {
    startDate: string;
    endDate: string;
    initialPage?: number;
    initialSize?: number;
}

interface UseWeeklyTopAnimeReturn {
    data: WeeklyTopAnimeApiResponse | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    refresh: () => void;
}

export const useWeeklyTopAnime = ({
    startDate,
    endDate,
    initialPage = 0,
    initialSize = 20,
}: UseWeeklyTopAnimeProps): UseWeeklyTopAnimeReturn => {
    const [data, setData] = useState<WeeklyTopAnimeApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialSize);

    const loadTopAnime = useCallback(async (
        start: string, 
        end: string, 
        pageToLoad: number, 
        sizeToLoad: number
    ) => {
        if (!start || !end) {
            setError("Start date and end date are required.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchWeeklyTopAnime({ 
                startDate: start, 
                endDate: end, 
                page: pageToLoad, 
                size: sizeToLoad 
            });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTopAnime(startDate, endDate, currentPage, pageSize);
    }, [loadTopAnime, startDate, endDate, currentPage, pageSize]);

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
        loadTopAnime(startDate, endDate, currentPage, pageSize);
    };

    return { 
        data, 
        loading, 
        error, 
        currentPage, 
        pageSize, 
        setPage, 
        setSize, 
        refresh 
    };
};