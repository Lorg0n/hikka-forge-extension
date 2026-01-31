import { useState, useEffect, useCallback } from 'react';
import { UserCommentsApiResponse } from '@/types';
import { fetchUserComments } from '@/services/userService';

interface UseUserCommentsProps {
    username: string;
    initialPage?: number;
    initialSize?: number;
    initialSort?: string; 
}

interface UseUserCommentsReturn {
    data: UserCommentsApiResponse | null;
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    sort: string;
    setPage: (page: number) => void;
    setSize: (size: number) => void;
    setSort: (sort: string) => void;
    refresh: () => void;
}


export const useUserComments = ({
    username,
    initialPage = 0,
    initialSize = 10,
    initialSort = 'hikkaCreated,desc',
}: UseUserCommentsProps): UseUserCommentsReturn => {
    const [data, setData] = useState<UserCommentsApiResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialSize);
    const [sort, setSort] = useState<string>(initialSort);

    const loadComments = useCallback(async (pageToLoad: number, sizeToLoad: number, sortOrder: string) => {
        if (!username) {
            setError("Username is required to fetch comments.");
            setLoading(false);
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await fetchUserComments({ username, page: pageToLoad, size: sizeToLoad, sort: sortOrder });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        loadComments(currentPage, pageSize, sort);
    }, [loadComments, currentPage, pageSize, sort]);

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

    const handleSetSort = (newSort: string) => {
        setSort(newSort);
        setCurrentPage(0);
    };

    const refresh = () => {
        loadComments(currentPage, pageSize, sort);
    };

    return { data, loading, error, currentPage, pageSize, sort, setPage, setSize, setSort: handleSetSort, refresh };
};