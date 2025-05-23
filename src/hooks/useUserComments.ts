import { useState, useEffect, useCallback } from 'react';
import { UserCommentsApiResponse } from '@/types';
import { fetchUserComments } from '@/services/userService';

interface UseUserCommentsProps {
    username: string;
    initialPage?: number;
    initialSize?: number;
}

interface UseUserCommentsReturn {
    data: UserCommentsApiResponse | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    refresh: () => void;
}

export const useUserComments = ({
    username,
    initialPage = 0, 
    initialSize = 10,
}: UseUserCommentsProps): UseUserCommentsReturn => {
    const [data, setData] = useState<UserCommentsApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialSize);

    const loadComments = useCallback(async (pageToLoad: number, sizeToLoad: number) => {
        if (!username) {
            setError("Username is required to fetch comments.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchUserComments({ username, page: pageToLoad, size: sizeToLoad });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null); 
        } finally {
            setLoading(false);
        }
    }, [username]); 

    useEffect(() => {
        loadComments(currentPage, pageSize);
    }, [loadComments, currentPage, pageSize]); 

    const setPage = (newPage: number) => {
        if (newPage > 0) { 
            setCurrentPage(newPage);
        }
    };

    const setSize = (newSize: number) => {
        if (newSize > 0) { 
            setPageSize(newSize);
            setCurrentPage(1); 
        }
    };

    const refresh = () => {
        loadComments(currentPage, pageSize);
    };

    return { data, loading, error, currentPage, pageSize, setPage, setSize, refresh };
};