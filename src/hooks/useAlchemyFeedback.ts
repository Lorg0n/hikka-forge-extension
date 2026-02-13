import { useState, useCallback } from 'react';
import { FeedbackService, AlchemyFeedbackParams } from '@/services/feedbackService';
import { AuthService } from '@/services/authService';

interface UseAlchemyFeedbackReturn {
    loading: boolean;
    error: string | null;
    submitFeedback: (params: Omit<AlchemyFeedbackParams, 'token'>) => Promise<boolean>;
    reset: () => void;
}

/**
 * Hook for submitting alchemy (vector arithmetic) feedback
 * 
 * @example
 * // Element + Anime combination
 * const { submitFeedback, loading, error } = useAlchemyFeedback();
 * 
 * const handleElementAnime = async () => {
 *   const success = await submitFeedback({
 *     targetSlug: 'fairy-tail',
 *     contextSlug: 'naruto',
 *     alchemyElementId: 10, // Fire element
 *     isPositive: true
 *   });
 * };
 * 
 * @example
 * // Anime + Anime combination
 * const handleAnimeAnime = async () => {
 *   const success = await submitFeedback({
 *     targetSlug: 'overlord',
 *     contextSlug: 'sword-art-online',
 *     isPositive: true
 *     // No alchemyElementId for Anime+Anime
 *   });
 * };
 */
export const useAlchemyFeedback = (): UseAlchemyFeedbackReturn => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const submitFeedback = useCallback(async (
        params: Omit<AlchemyFeedbackParams, 'token'>
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const token = await AuthService.getToken();
            
            if (!token) {
                throw new Error('Authentication required');
            }

            await FeedbackService.rateAlchemy(
                {
                    targetSlug: params.targetSlug,
                    contextSlug: params.contextSlug,
                    isPositive: params.isPositive,
                    alchemyElementId: params.alchemyElementId
                },
                token
            );

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    return {
        loading,
        error,
        submitFeedback,
        reset
    };
};