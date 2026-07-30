import { logger } from "@/utils/logger";
import { SimilarMangaApiResponse, ApiErrorResponse, ForgeMangaDetails } from '@/types';

import { API_BACKEND_BASE, MAX_SIMILAR_PAGES } from '@/constants';

interface FetchSimilarMangaParams {
    slug: string;
    page?: number;
    size?: number;
}

export const fetchSimilarManga = async ({
    slug,
    page,
    size,
}: FetchSimilarMangaParams): Promise<SimilarMangaApiResponse> => {
    const url = new URL(`${API_BACKEND_BASE}/manga/${slug}/similar`);

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

    return response.json() as Promise<SimilarMangaApiResponse>;
};

interface FetchForgeMangaDetailsParams {
    slug: string;
}

export const fetchForgeMangaDetails = async ({
    slug,
}: FetchForgeMangaDetailsParams): Promise<ForgeMangaDetails> => {
    const url = new URL(`${API_BACKEND_BASE}/manga/${slug}`);

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

    return response.json() as Promise<ForgeMangaDetails>;
};
