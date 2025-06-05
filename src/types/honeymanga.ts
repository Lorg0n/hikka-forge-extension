export interface HoneyMangaDto {
    id: string;
    posterId: string;
    title: string;
}

export interface HoneyMangaResponseDto {
    data: HoneyMangaDto[];
}

export interface CompleteHoneyMangaDto {
    id: string;
    posterId: string;
    title: string;
    description?: string; 
    type: string;
    authors?: string[];
    artists?: string[]; 
    genresAndTags?: string[]; 
    titleStatus?: string; 
}

export interface HoneyMangaChapterDto {
    id: string;
    volume: number;
    chapterNum: number;
    subChapterNum: number;
    mangaId: string;
    lastUpdated: string; // Date string (e.g., "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    isMonetized: boolean;
}

export interface HoneyMangaChapterResponseDto {
    data: HoneyMangaChapterDto[];
}

export interface HoneyMangaChapterPagesDto {
    id: string;
    resourceIds: { [pageNumber: string]: string }; 
}