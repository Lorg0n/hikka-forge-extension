import { useState, useCallback } from 'react';
import { FeedbackService, RecommendationFeedbackParams } from '@/services/feedbackService';
import { AuthService } from '@/services/authService';

interface UseRecommendationFeedbackReturn {
    loading: boolean;
    error: string | null;
    submitFeedback: (params: Omit<RecommendationFeedbackParams, 'token'>) => Promise<boolean>;
    reset: () => void;
}

/**
 * Hook for submitting recommendation feedback
 * 
 * @example
 * const { submitFeedback, loading, error } = useRecommendationFeedback();
 * 
 * const handleNotInterested = async () => {
 *   const success = await submitFeedback({
 *     targetSlug: 'one-piece',
 *     isPositive: false
 *   });
 *   
 *   if (success) {
 *     // Hide the recommendation
 *   }
 * };
 */
export const useRecommendationFeedback = (): UseRecommendationFeedbackReturn => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const submitFeedback = useCallback(async (
        params: Omit<RecommendationFeedbackParams, 'token'>
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const token = await AuthService.getToken();
            
            if (!token) {
                throw new Error('Authentication required');
            }

            await FeedbackService.rateRecommendation(
                {
                    targetSlug: params.targetSlug,
                    isPositive: params.isPositive
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