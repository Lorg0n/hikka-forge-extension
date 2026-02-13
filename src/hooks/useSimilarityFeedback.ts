import { useState, useCallback } from 'react';
import { FeedbackService, SimilarityFeedbackParams } from '@/services/feedbackService';
import { AuthService } from '@/services/authService';

interface UseSimilarityFeedbackReturn {
    loading: boolean;
    error: string | null;
    submitFeedback: (params: Omit<SimilarityFeedbackParams, 'token'>) => Promise<boolean>;
    reset: () => void;
}

/**
 * Hook for submitting similarity feedback
 * 
 * @example
 * const { submitFeedback, loading, error } = useSimilarityFeedback();
 * 
 * const handleLike = async () => {
 *   const success = await submitFeedback({
 *     targetSlug: 'bleach',
 *     contextSlug: 'naruto',
 *     isPositive: true
 *   });
 *   
 *   if (success) {
 *     // Show success message
 *   }
 * };
 */
export const useSimilarityFeedback = (): UseSimilarityFeedbackReturn => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const submitFeedback = useCallback(async (
        params: Omit<SimilarityFeedbackParams, 'token'>
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            const token = await AuthService.getToken();
            
            if (!token) {
                throw new Error('Authentication required');
            }

            await FeedbackService.rateSimilarity(
                {
                    targetSlug: params.targetSlug,
                    contextSlug: params.contextSlug,
                    positive: params.positive
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