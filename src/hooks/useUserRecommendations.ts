import { useState, useEffect, useCallback } from 'react';
import { UserRecommendationsApiResponse } from '@/types';
import { fetchUserRecommendations } from '@/services/userService';
import { AuthService } from '@/services/authService';

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

export const useUserRecommendations = ({
    initialPage = 0,
    initialSize = 10, // Default to 10 or whatever fits your grid
}: UseUserRecommendationsProps = {}): UseUserRecommendationsReturn => {
    const [data, setData] = useState<UserRecommendationsApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialSize);

    const loadRecommendations = useCallback(async (pageToLoad: number, sizeToLoad: number) => {
        setLoading(true);
        setError(null);

        try {
            // Get token asynchronously from Chrome storage via AuthService
            const token = await AuthService.getToken();

            if (!token) {
                throw new Error("Authorization required");
            }

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