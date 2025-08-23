export interface ApiErrorResponse {
    timestamp?: string;
    status?: number;
    error: string;
    message?: string;
    path?: string;
    details?: any; 
}

export interface CommentItem {
    text: string;
    voteScore: number;
    totalReplies: number;
    createdAt: string; 
    authorUsername: string;
    authorAvatarUrl: string;
    contentSlug: string;
    contentTitle: string;
    contentImageUrl: string | null;
    contentType: string;
}


export interface UserCommentsApiResponse {
    content: CommentItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    last: boolean;
}

export interface SimilarAnimeItem {
    description: string;
    title: string;
    genres: string[];
    malId: number;
    mediaType: string;
    slug: string;
    poster: string;
    distance: number;
}

export interface SortInfo {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
}

export interface Pageable {
    pageNumber: number;
    pageSize: number;
    sort: SortInfo;
    offset: number;
    paged: boolean;
    unpaged: boolean;
}

export interface SimilarAnimeApiResponse {
    content: SimilarAnimeItem[];
    pageable: Pageable;
    last: boolean;
    totalElements: number;
    totalPages: number;
    first: boolean;
    size: number;
    number: number;
    sort: SortInfo;
    numberOfElements: number;
    empty: boolean;
}