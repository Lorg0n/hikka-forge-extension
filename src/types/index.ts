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

export interface ApiErrorResponse {
    error: string;
}