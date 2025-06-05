export const CONTENT_TYPE_URL = {
    "anime": "anime",
    "manga": "manga",
    "novel": "novel",
    "collection": "collection",
    "article": "article",
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
export const API_HIKKA_BASE = "https://api.hikka.io" as const;
export const API_BACKEND_BASE = "https://hikka-forge.lorgon.org" as const;

export const ALLOWED_READING_SOURCE_NAMES: string[] = ["Honey Manga"];

export const HONEYMANGA_BASE_URL = "https://honey-manga.com.ua" as const;
export const API_HONEYMANGA_DATA_BASE = "https://data.api.honey-manga.com.ua" as const;
export const API_HONEYMANGA_SEARCH_BASE = "https://search.api.honey-manga.com.ua" as const;
export const HONEYMANGA_IMAGE_STORAGE_URL = "https://hmvolumestorage.b-cdn.net/public-resources" as const;
export const HONEYMANGA_DEFAULT_PAGE_SIZE = 30 as const;
