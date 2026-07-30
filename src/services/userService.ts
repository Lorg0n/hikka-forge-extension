import { logger } from "@/utils/logger";
import { UserCommentsApiResponse, ApiErrorResponse, UserRecommendationsApiResponse, RecommendationContentType } from '@/types';
import { API_BACKEND_BASE, HIKKA_API_BASE } from '@/constants';

interface FetchUserCommentsParams {
    username: string;
    page?: number;
    size?: number;
    sort?: string;
}

export const fetchUserComments = async ({
    username,
    page,
    size,
    sort,
}: FetchUserCommentsParams): Promise<UserCommentsApiResponse> => {
    const url = new URL(`${API_BACKEND_BASE}/users/${username}/comments`);

    if (page !== undefined) {
        url.searchParams.append('page', page.toString());
    }
    if (size !== undefined) {
        url.searchParams.append('size', size.toString());
    }
    if (sort) {
        url.searchParams.append('sort', sort);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData: ApiErrorResponse = await response.json();
            if (errorData && errorData.message) {
                errorMessage = `${errorData.error}: ${errorData.message}`;
            } else if (errorData && errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            logger.error("Failed to parse error response body:", e);
        }
        throw new Error(errorMessage);
    }

    return response.json() as Promise<UserCommentsApiResponse>;
};

interface HikkaUserProfileResponse {
    reference?: string;
}

/** Returns Hikka's stable profile reference for a username. */
export const fetchUserProfileReference = async (username: string): Promise<string> => {
    const response = await fetch(
        `${HIKKA_API_BASE}/user/${encodeURIComponent(username)}`,
        { headers: { accept: 'application/json' } },
    );

    if (!response.ok) {
        throw new Error(`User lookup failed: ${response.status}`);
    }

    const user = await response.json() as HikkaUserProfileResponse;
    if (!user.reference) {
        throw new Error('User reference was not returned');
    }

    return user.reference;
};

interface FetchUserRecommendationsParams {
    page?: number;
    size?: number;
    contentType?: RecommendationContentType;
    token: string; // Auth token is required
}

export const fetchUserRecommendations = async ({
    page,
    size,
    contentType = 'anime',
    token,
}: FetchUserRecommendationsParams): Promise<UserRecommendationsApiResponse> => {
    const url = new URL(`${API_BACKEND_BASE}/users/me/recommendations/${contentType}`);

    if (page !== undefined) {
        url.searchParams.append('page', page.toString());
    }
    if (size !== undefined) {
        url.searchParams.append('size', size.toString());
    }

    const headers: HeadersInit = {
        'accept': '*/*'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
        headers: headers
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData: ApiErrorResponse = await response.json();
            if (errorData && errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            logger.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
    }

    return response.json() as Promise<UserRecommendationsApiResponse>;
};
