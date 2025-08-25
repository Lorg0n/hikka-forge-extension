import { CONTENT_TYPE_URL } from "@/constants";

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
    contentType: keyof typeof CONTENT_TYPE_URL;
}


export interface UserCommentsApiResponse {
    content: CommentItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    last: boolean;
}

export interface SimilarAnimeItem {
    slug: string;
    title: string;
    imageUrl: string;
    year: number;
    score: number;
    similarityScore: number;
}

export interface SimilarAnimeApiResponse {
    content: SimilarAnimeItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    last: boolean;
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

export interface AlchemyElementItem {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
}
export interface PagedAlchemyElementsApiResponse {
    content: AlchemyElementItem[];
}

// From: /alchemy/combine/*
export interface AnimeCombinationResultItem {
  slug: string;
  titleEn: string;
  titleNative: string;
  imageUrl: string | null;
}

// From: hikka.io/anime search
export interface HikkaSearchItem {
    slug: string;
    title_en: string | null;
    title_ua: string | null;
    title_ja: string | null;
    image: string | null;
}
export interface HikkaSearchApiResponse {
    list: HikkaSearchItem[];
}

export type ItemType = 'alchemy_element' | 'anime';

interface BaseItem {
  type: ItemType;
  uniqueId: string;
  name: string;
  imageUrl: string | null;
}

export interface AlchemyItem extends BaseItem {
  type: 'alchemy_element';
  id: number;
}

export interface AnimeItem extends BaseItem {
  type: 'anime';
  slug: string;
}

// A union of all possible draggable items
export type DraggableItem = AlchemyItem | AnimeItem;

export type WorkspaceItem = DraggableItem & {
  instanceId: string;
  position: { x: number; y: number };
};

export interface CombinationTarget {
    id: string;
    isValid: boolean;
}