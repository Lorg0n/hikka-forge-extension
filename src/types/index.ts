export interface ApiErrorResponse {
    error: string;
}

export interface CommentItem {
    text: string;
    source_type: string;
    source_slug: string;
    vote_score: number;
    total_replies: number;
}

export interface UserCommentsApiResponse {
    comments: CommentItem[];
    author_username: string;
    author_reference: string;
    author_avatar: string; // URL
    vote_score: number;
    total_replies: number;
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