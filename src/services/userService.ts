import { UserCommentsApiResponse, ApiErrorResponse } from '@/types';
import { API_BACKEND_BASE } from '@/constants';

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
            console.error("Failed to parse error response body:", e);
        }
        throw new Error(errorMessage);
    }

    return response.json() as Promise<UserCommentsApiResponse>;
};