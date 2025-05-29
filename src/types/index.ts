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
	author_avatar: string;
	vote_score: number;
	total_replies: number;
}

export interface ApiErrorResponse {
	error: string;
}

export interface Person {
	name_ua: string;
	name_en: string;
	slug: string;
}

export interface Role {
	name_ua: string;
	name_en: string;
	slug: string;
}

export interface Magazine {
	name_en: string;
	slug: string;
}

export interface External {
	url: string;
	text: string;
	type: "general" | "read"; 
}

export interface Genre {
	name_ua: string;
	name_en: string;
	slug: string;
	type: "genre";
}

export interface Stats {
	completed: number;
	reading: number;
	on_hold: number;
	dropped: number;
	planned: number;
	score_1: number;
	score_2: number;
	score_3: number;
	score_4: number;
	score_5: number;
	score_6: number;
	score_7: number;
	score_8: number;
	score_9: number;
	score_10: number;
}

export type MangaMediaType = "manhwa" | "manga" | "manhua" | string;
export type MangaStatus =
	| "ongoing"
	| "completed"
	| "hiatus"
	| "cancelled"
	| string;

export interface MangaBaseResponse {
	data_type: "manga";
	title_original: string;
	media_type: MangaMediaType;
	title_ua: string;
	title_en: string;
	chapters: number | null;
	volumes: number | null;
	translated_ua: boolean;
	status: MangaStatus;
	image: string;
	year: number;
	scored_by: number;
	score: number;
	slug: string;
}

export interface MangaInfo extends MangaBaseResponse {
	authors: {
		person: Person;
		roles: Role[];
	}[];
	magazines: Magazine[];
	external: External[]; 
	start_date: number | null;
	end_date: number | null;
	genres: Genre[];
	stats: Stats;
	synopsis_en: string;
	synopsis_ua: string;
	updated: number;
	synonyms: string[];
	comments_count: number;
	has_franchise: boolean;
	mal_id: number | null;
	nsfw: boolean;
}
