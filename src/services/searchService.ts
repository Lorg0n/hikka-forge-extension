import { HIKKA_API_BASE, ApiErrorResponse } from '@/constants/index';
import { HikkaSearchApiResponse } from '@/types';

export const searchAnime = async (query: string): Promise<HikkaSearchApiResponse> => {
    const url = new URL(`${HIKKA_API_BASE}/anime`);
    url.searchParams.append('page', '1');
    url.searchParams.append('size', '18');

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            sort: ["scored_by:desc"]
        })
    });
    
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData: ApiErrorResponse = await response.json();
            if (errorData?.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            console.error("Failed to parse search error response:", e);
        }
        throw new Error(errorMessage);
    }
    
    return response.json();
};