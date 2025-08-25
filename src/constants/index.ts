export const CONTENT_TYPE_URL = {
    "anime": "anime",
    "manga": "manga",
    "novel": "novel",
    "collection": "collection",
    "article": "articles",
    "edit": "edit"
} as const;

export const CONTENT_TYPE = {
    "anime": "Аніме",
    "character": "Персонаж",
    "person": "Автор",
    "edit": "Правка",
    "comment": "Коментар",
    "collection": "Колекція",
    "manga": "Манґа",
    "novel": "Ранобе",
    "user": "Користувач",
    "article": "Стаття"
} as const;

export const HIKKA_BASE = "https://hikka.io" as const;
export const API_BACKEND_BASE = "https://hikka-forge.lorgon.org" as const;
export const HIKKA_API_BASE = 'https://api.hikka.io';

export interface ApiErrorResponse {
    timestamp?: string;
    status?: number;
    error: string;
    message?: string;
    path?: string;
    details?: any; 
}