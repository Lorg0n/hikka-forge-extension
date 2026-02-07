import { useState, useEffect, useCallback } from 'react';
import { UserRecommendationsApiResponse } from '@/types';
import { fetchUserRecommendations } from '@/services/userService';

interface UseUserRecommendationsProps {
    initialPage?: number;
    initialSize?: number;
}

interface UseUserRecommendationsReturn {
    data: UserRecommendationsApiResponse | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    refresh: () => void;
}

// Helper to get token from Hikka's local storage
const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    // Common keys, adjust if Hikka uses a specific key like 'auth-storage' or just 'token'
    return localStorage.getItem('access_token') || 
           localStorage.getItem('token') || 
           localStorage.getItem('auth_token');
};

export const useUserRecommendations = ({
    initialPage = 0,
    initialSize = 20,
}: UseUserRecommendationsProps = {}): UseUserRecommendationsReturn => {
    const [data, setData] = useState<UserRecommendationsApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialSize);

    const loadRecommendations = useCallback(async (pageToLoad: number, sizeToLoad: number) => {
        const token = getToken();

        if (!token) {
            setError("Authorization token not found. Please log in.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchUserRecommendations({ 
                page: pageToLoad, 
                size: sizeToLoad,
                token: token
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
        loadRecommendations(currentPage, pageSize);
    }, [loadRecommendations, currentPage, pageSize]);

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
        loadRecommendations(currentPage, pageSize);
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