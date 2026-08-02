import { logger } from "@/utils/logger";
import { SimilarAnimeApiResponse, ApiErrorResponse, ForgeAnimeDetails, WeeklyTopAnimeApiResponse, FranchiseGraphResponse, FranchiseContentType } from '@/types';

import { API_BACKEND_BASE, MAX_SIMILAR_PAGES } from '@/constants';

interface FetchSimilarAnimeParams {
    slug: string;
    page?: number;
    size?: number;
}

export const fetchSimilarAnime = async ({
    slug,
    page,
    size,
}: FetchSimilarAnimeParams): Promise<SimilarAnimeApiResponse> => {
    const url = new URL(`${API_BACKEND_BASE}/anime/${slug}/similar`);

    if (page !== undefined) {
        const boundedPage = Math.min(Math.max(page, 0), MAX_SIMILAR_PAGES - 1);
        url.searchParams.append('page', boundedPage.toString());
    }
    if (size !== undefined) {
        url.searchParams.append('size', size.toString());
    }

    const response = await fetch(url.toString());

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

    return response.json() as Promise<SimilarAnimeApiResponse>;
};

interface FetchForgeAnimeDetailsParams {
    slug: string;
}

export const fetchForgeAnimeDetails = async ({
    slug,
}: FetchForgeAnimeDetailsParams): Promise<ForgeAnimeDetails> => {
    const url = new URL(`${API_BACKEND_BASE}/anime/${slug}`);

    const response = await fetch(url.toString());

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

    return response.json() as Promise<ForgeAnimeDetails>;
};

interface FetchWeeklyTopAnimeParams {
    startDate: string; // Format: YYYY-MM-DD
    endDate: string;   // Format: YYYY-MM-DD
    page?: number;
    size?: number;
}

export const fetchWeeklyTopAnime = async ({
    startDate,
    endDate,
    page,
    size,
}: FetchWeeklyTopAnimeParams): Promise<WeeklyTopAnimeApiResponse> => {
    const url = new URL(`${API_BACKEND_BASE}/anime/rankings/hot`);

    url.searchParams.append('startDate', startDate);
    url.searchParams.append('endDate', endDate);

    if (page !== undefined) {
        url.searchParams.append('page', page.toString());
    }
    if (size !== undefined) {
        url.searchParams.append('size', size.toString());
    }

    const response = await fetch(url.toString(), {
        headers: {
            'accept': '*/*'
        }
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

    return response.json() as Promise<WeeklyTopAnimeApiResponse>;
};

interface FetchFranchiseGraphParams {
    contentType: FranchiseContentType;
    slug: string;
}

export class FranchiseGraphRequestError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message);
        this.name = 'FranchiseGraphRequestError';
    }
}

export const fetchFranchiseGraph = async ({
    contentType,
    slug,
}: FetchFranchiseGraphParams): Promise<FranchiseGraphResponse> => {
    const url = new URL(`${API_BACKEND_BASE}/${contentType}/${slug}/franchise`);

    const response = await fetch(url.toString(), {
        headers: {
            accept: 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new FranchiseGraphRequestError('Пов’язаний контент відсутній.', 404);
        }
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData: ApiErrorResponse = await response.json();
            if (errorData && errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            logger.error('Failed to parse error response:', e);
        }
        throw new FranchiseGraphRequestError(errorMessage, response.status);
    }

    return response.json() as Promise<FranchiseGraphResponse>;
};
