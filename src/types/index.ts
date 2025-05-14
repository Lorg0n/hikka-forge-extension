export interface CommentItem {
    text: string;
    source: string;
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