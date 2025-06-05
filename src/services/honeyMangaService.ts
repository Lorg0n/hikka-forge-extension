import {
    HoneyMangaDto,
    HoneyMangaResponseDto,
    CompleteHoneyMangaDto,
    HoneyMangaChapterDto,
    HoneyMangaChapterResponseDto,
    HoneyMangaChapterPagesDto
} from "@/types/honeymanga";
import { ApiErrorResponse } from "@/types"; 
import {
    API_HONEYMANGA_DATA_BASE,
    API_HONEYMANGA_SEARCH_BASE,
    HONEYMANGA_IMAGE_STORAGE_URL,
    HONEYMANGA_DEFAULT_PAGE_SIZE,
    HONEYMANGA_BASE_URL 
} from "@/constants";

const JSON_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": HONEYMANGA_BASE_URL,
    "Referer": HONEYMANGA_BASE_URL,
};

async function handleHoneyMangaResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData: ApiErrorResponse = await response.json();
            if (errorData?.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            console.error("Failed to parse HoneyManga error response:", e);
            errorMessage = `Failed to fetch data. Status: ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
}

export const fetchPopularHoneyManga = async (page: number): Promise<HoneyMangaResponseDto> => {
    const body = {
        page: page,
        pageSize: HONEYMANGA_DEFAULT_PAGE_SIZE,
        sort: {
            sortBy: "likes",
            sortOrder: "DESC"
        }
    };
    const response = await fetch(`${API_HONEYMANGA_DATA_BASE}/v2/manga/cursor-list`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });
    return handleHoneyMangaResponse<HoneyMangaResponseDto>(response);
};

export const fetchLatestHoneyManga = async (page: number): Promise<HoneyMangaResponseDto> => {
    const body = {
        page: page,
        pageSize: HONEYMANGA_DEFAULT_PAGE_SIZE,
        sort: {
            sortBy: "lastUpdated",
            sortOrder: "DESC"
        }
    };
    const response = await fetch(`${API_HONEYMANGA_DATA_BASE}/v2/manga/cursor-list`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });
    return handleHoneyMangaResponse<HoneyMangaResponseDto>(response);
};

export const searchHoneyManga = async (query: string): Promise<HoneyMangaDto[]> => {
    if (query.length < 3) {
        throw new Error("Запит має містити щонайменше 3 символи / The query must contain at least 3 characters");
    }
    const url = new URL(`${API_HONEYMANGA_SEARCH_BASE}/v2/manga/pattern`);
    url.searchParams.append("query", query);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: JSON_HEADERS,
    });
    return handleHoneyMangaResponse<HoneyMangaDto[]>(response);
};

export const fetchHoneyMangaDetails = async (mangaId: string): Promise<CompleteHoneyMangaDto> => {
    const response = await fetch(`${API_HONEYMANGA_DATA_BASE}/manga/${mangaId}`, {
        method: "GET",
        headers: JSON_HEADERS,
    });
    return handleHoneyMangaResponse<CompleteHoneyMangaDto>(response);
};

export const fetchHoneyMangaChapters = async (mangaId: string): Promise<HoneyMangaChapterDto[]> => {
    const body = {
        mangaId: mangaId,
        sortOrder: "DESC",
        page: 1,
        pageSize: 10000, 
    };
    const response = await fetch(`${API_HONEYMANGA_DATA_BASE}/v2/chapter/cursor-list`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
    });
    const result = await handleHoneyMangaResponse<HoneyMangaChapterResponseDto>(response);
    return result.data.filter(chapter => !chapter.isMonetized);
};

/**
 * Fetches pages for a specific chapter from HoneyManga.
 * @param chapterId The ID of the chapter.
 * @returns Promise<HoneyMangaChapterPagesDto>
 */
export const fetchHoneyMangaPages = async (chapterId: string): Promise<HoneyMangaChapterPagesDto> => {
    const response = await fetch(`${API_HONEYMANGA_DATA_BASE}/chapter/frames/${chapterId}`, {
        method: "GET",
        headers: JSON_HEADERS,
    });
    return handleHoneyMangaResponse<HoneyMangaChapterPagesDto>(response);
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC' // Assuming the 'Z' in 'yyyy-MM-dd'T'HH:mm:ss.SSS'Z' implies UTC
});

export const parseHoneyMangaDate = (dateString: string): Date | null => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return null; // Invalid date
        }
        return date;
    } catch (e) {
        console.error("Failed to parse HoneyManga date string:", dateString, e);
        return null;
    }
};

/**
 * Helper to construct the full image URL for HoneyManga posters/pages.
 * @param imageId The ID of the image from the API.
 * @returns The full URL to the image.
 */
export const getHoneyMangaImageUrl = (imageId: string): string => {
    return `${HONEYMANGA_IMAGE_STORAGE_URL}/${imageId}`;
};

/**
 * Helper to construct the full URL for a manga book on HoneyManga website.
 * @param mangaId The ID of the manga.
 * @returns The full URL to the manga book page.
 */
export const getHoneyMangaBookUrl = (mangaId: string): string => {
    return `${HONEYMANGA_BASE_URL}/book/${mangaId}`;
};

export const getHoneyMangaReadUrl = (chapterId: string, mangaId: string): string => {
    return `${HONEYMANGA_BASE_URL}/read/${chapterId}/${mangaId}`;
};

export const transformHoneyMangaDtoToFrontendManga = (mangaDto: HoneyMangaDto) => ({
    id: mangaDto.id,
    title: mangaDto.title,
    thumbnailUrl: getHoneyMangaImageUrl(mangaDto.posterId),
    url: getHoneyMangaBookUrl(mangaDto.id),
});

export const transformHoneyMangaChapterDtoToFrontendChapter = (chapterDto: HoneyMangaChapterDto) => {
    const suffix = chapterDto.subChapterNum === 0 ? "" : `.${chapterDto.subChapterNum}`;
    return {
        id: chapterDto.id,
        volume: chapterDto.volume,
        chapterNum: chapterDto.chapterNum,
        subChapterNum: chapterDto.subChapterNum,
        mangaId: chapterDto.mangaId,
        name: `Vol. ${chapterDto.volume} Ch. ${chapterDto.chapterNum}${suffix}`,
        uploadDate: parseHoneyMangaDate(chapterDto.lastUpdated),
        url: getHoneyMangaReadUrl(chapterDto.id, chapterDto.mangaId),
    };
};