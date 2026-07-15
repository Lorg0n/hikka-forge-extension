import { useState, useEffect, useCallback } from 'react';
import { UserRecommendationsApiResponse, RecommendationContentType } from '@/types';
import { fetchUserRecommendations } from '@/services/userService';
import { AuthService } from '@/services/authService';

interface UseUserRecommendationsProps {
    initialPage?: number;
    initialSize?: number;
    contentType?: RecommendationContentType;
}

interface UseUserRecommendationsReturn {
    data: UserRecommendationsApiResponse | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    contentType: RecommendationContentType;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    setContentType: (contentType: RecommendationContentType) => void;
    refresh: () => void;
}

export const useUserRecommendations = ({
    initialPage = 0,
    initialSize = 10,
    contentType: initialContentType = 'anime',
}: UseUserRecommendationsProps = {}): UseUserRecommendationsReturn => {
    const [data, setData] = useState<UserRecommendationsApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialSize);
    const [contentType, setContentTypeState] = useState<RecommendationContentType>(initialContentType);

    const loadRecommendations = useCallback(async (pageToLoad: number, sizeToLoad: number, type: RecommendationContentType) => {
        setLoading(true);
        setError(null);

        try {
            const token = await AuthService.getToken();

            if (!token) {
                throw new Error("Authorization required");
            }

            const result = await fetchUserRecommendations({
                page: pageToLoad,
                size: sizeToLoad,
                contentType: type,
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
        loadRecommendations(currentPage, pageSize, contentType);
    }, [loadRecommendations, currentPage, pageSize, contentType]);

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

    const setContentType = (newContentType: RecommendationContentType) => {
        setContentTypeState(newContentType);
        setCurrentPage(0);
    };

    const refresh = () => {
        loadRecommendations(currentPage, pageSize, contentType);
    };

    return {
        data,
        loading,
        error,
        currentPage,
        pageSize,
        contentType,
        setPage,
        setSize,
        setContentType,
        refresh
    };
};