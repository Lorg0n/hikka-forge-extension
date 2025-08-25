import { API_BACKEND_BASE, ApiErrorResponse } from '@/constants/index';
import { PagedAlchemyElementsApiResponse, AnimeCombinationResultItem, DraggableItem, AlchemyItem, AnimeItem } from '@/types';

const handleApiError = async (response: Response): Promise<never> => {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
        const errorData: ApiErrorResponse = await response.json();
        if (errorData?.error) {
            errorMessage = errorData.error;
        }
    } catch (e) {
        console.error("Failed to parse error response:", e);
    }
    throw new Error(errorMessage);
};

export const fetchAlchemyElements = async (): Promise<PagedAlchemyElementsApiResponse> => {
    // Fetch a large number of elements to simulate getting all of them
    const url = new URL(`${API_BACKEND_BASE}/alchemy/elements`);
    url.searchParams.append('size', '200');

    const response = await fetch(url.toString());
    if (!response.ok) {
        return handleApiError(response);
    }
    return response.json();
};

export const combineItems = async (item1: DraggableItem, item2: DraggableItem): Promise<AnimeCombinationResultItem> => {
    let url: URL;

    if (item1.type === 'anime' && item2.type === 'anime') {
        url = new URL(`${API_BACKEND_BASE}/alchemy/combine/anime-plus-anime`);
        url.searchParams.append('slug1', (item1 as AnimeItem).slug);
        url.searchParams.append('slug2', (item2 as AnimeItem).slug);
    } else {
        const animeItem = (item1.type === 'anime' ? item1 : item2) as AnimeItem;
        const elementItem = (item1.type === 'alchemy_element' ? item1 : item2) as AlchemyItem;
        url = new URL(`${API_BACKEND_BASE}/alchemy/combine/element-plus-anime`);
        url.searchParams.append('elementId', elementItem.id.toString());
        url.searchParams.append('animeSlug', animeItem.slug);
    }

    const response = await fetch(url.toString(), { method: 'POST' });
    if (!response.ok) {
        return handleApiError(response);
    }
    return response.json();
};