export const CONTENT_TYPE_URL = {
    "anime": "anime",
    "manga": "manga",
    "novel": "novel",
    "collection": "collections",
    "article": "articles",
    "character": "characters",
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

export const RELEASE_STATUS = {
    "discontinued": "Припинено",
    "ongoing": "Онґоїнґ",
    "finished": "Завершено",
    "announced": "Анонс",
    "paused": "Призупинено",
} as const;

export const ANIME_MEDIA_TYPE = {
    "special": "Спешл",
    "movie": "Фільм",
    "ova": "OVA",
    "ona": "ONA",
    "tv": "TV Серіал",
    "music": "Музика",
} as const;

export const MANGA_MEDIA_TYPE = {
    "one_shot": "Ваншот",
    "doujin": "Доджінші",
    "manhua": "Маньхва",
    "manhwa": "Манхва",
    "manga": "Манґа",
} as const;

export const NOVEL_MEDIA_TYPE = {
    "light_novel": "Ранобе",
    "novel": "Вебновела",
} as const;

export const MEDIA_TYPE = {
    ...ANIME_MEDIA_TYPE,
    ...MANGA_MEDIA_TYPE,
    ...NOVEL_MEDIA_TYPE,
} as const;

const getLocalizedLabel = (
    value: string | null | undefined,
    labels: Record<string, string>,
): string | undefined => {
    if (!value) return undefined;
    return labels[value.trim().toLowerCase()] ?? value;
};

export const getReleaseStatusLabel = (status: string | null | undefined) =>
    getLocalizedLabel(status, RELEASE_STATUS);

export const getMediaTypeLabel = (mediaType: string | null | undefined) =>
    getLocalizedLabel(mediaType, MEDIA_TYPE);

export const getContentTypeLabel = (contentType: string | null | undefined) =>
    getLocalizedLabel(contentType, CONTENT_TYPE);

export const MODULE_CATEGORIES = {
    "recommendations": "Рекомендації",
    "content": "Контент",
    "appearance": "Оформлення",
    "other": "Інше"
} as const;

export const HIKKA_BASE = "https://dev.hikka.io" as const;
export const HIKKA_API_BASE = "https://api.hikka.io" as const;
export const API_BACKEND_BASE = "https://hikka-forge.lorgon.dev" as const;

export const GITHUB_REPO = "https://github.com/Lorg0n/hikka-forge-extension" as const;
export const POLICY_PAGE = "https://dev.hikka.io/articles/privacy-policy-for-hikka-forge-7c73e8" as const;
