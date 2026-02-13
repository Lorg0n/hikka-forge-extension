import { API_BACKEND_BASE } from '@/constants';
import { ApiErrorResponse } from '@/types';

export interface SimilarityFeedbackParams {
    targetSlug: string;
    contextSlug: string;
    isPositive: boolean;
}

export interface RecommendationFeedbackParams {
    targetSlug: string;
    isPositive: boolean;
}

export interface AlchemyFeedbackParams {
    targetSlug: string;
    isPositive: boolean;
    contextSlug: string;
    alchemyElementId?: number;
}

export interface FeedbackResponse {
    success: boolean;
    message?: string;
}

export class FeedbackService {
    private static async makeAuthenticatedRequest(
        endpoint: string,
        body: any,
        token: string
    ): Promise<FeedbackResponse> {
        try {
            const response = await fetch(`${API_BACKEND_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData: ApiErrorResponse = await response.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    console.error("Failed to parse error response:", e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message || 'Feedback submitted successfully'
            };
        } catch (error) {
            console.error(`Feedback service error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Rate similarity between two anime (used in "Similar Anime" blocks)
     * @param params - Similarity feedback parameters
     * @param token - Authentication token
     */
    static async rateSimilarity(
        params: SimilarityFeedbackParams,
        token: string
    ): Promise<FeedbackResponse> {
        return this.makeAuthenticatedRequest('/feedback/similarity', params, token);
    }

    /**
     * Rate a personal recommendation (used in recommendation feeds)
     * @param params - Recommendation feedback parameters
     * @param token - Authentication token
     */
    static async rateRecommendation(
        params: RecommendationFeedbackParams,
        token: string
    ): Promise<FeedbackResponse> {
        return this.makeAuthenticatedRequest('/feedback/recommendation', params, token);
    }

    /**
     * Rate an alchemy result (used in vector arithmetic combinations)
     * @param params - Alchemy feedback parameters
     * @param token - Authentication token
     */
    static async rateAlchemy(
        params: AlchemyFeedbackParams,
        token: string
    ): Promise<FeedbackResponse> {
        return this.makeAuthenticatedRequest('/feedback/alchemy', params, token);
    }
}