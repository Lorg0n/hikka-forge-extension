export interface CommentItem {
    text: string;
    source_type: string;
    source_slug: string;
}

export interface UserCommentsApiResponse {
    comments: CommentItem[];
    author_username: string;
    author_reference: string; // UUID
    author_avatar: string; // URL
}

export interface ApiErrorResponse {
    error: string;
}