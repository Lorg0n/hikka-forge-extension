import { useState, useCallback } from 'react';
import { AuthService } from '@/services/authService';
import { AuthCallbackResponse } from '@/types';

interface UseHikkaCallbackReturn {
    data: AuthCallbackResponse | null;
    loading: boolean;
    error: string | null;
    executeCallback: (reference: string) => Promise<void>;
    reset: () => void;
}

/**
 * Hook for handling Hikka authentication callback
 * 
 * @example
 * const { data, loading, error, executeCallback } = useHikkaCallback();
 * 
 * const handleAuth = async () => {
 *   await executeCallback('123');
 *   if (data) {
 *     // Use data.secret as the auth token
 *     // data.expires contains the expiration timestamp
 *   }
 * };
 */
export const useHikkaCallback = (): UseHikkaCallbackReturn => {
    const [data, setData] = useState<AuthCallbackResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const executeCallback = useCallback(async (reference: string) => {
        if (!reference) {
            setError('Reference is required');
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await AuthService.hikkaCallback(reference);
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { 
        data, 
        loading, 
        error, 
        executeCallback,
        reset 
    };
};