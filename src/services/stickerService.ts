import { API_BACKEND_BASE } from "@/constants";
import { AuthService } from "@/services/authService";

export type StickerStatus = "published" | "hidden";
export type StickerAssetType = "static" | "animated";

export interface StickerCategory {
	slug: string;
	title: string;
	description: string | null;
}

export interface StickerPack {
	slug: string;
	title: string;
	description: string | null;
	status: StickerStatus;
	categories: StickerCategory[];
	createdAt?: string;
	updatedAt?: string;
}

export interface StickerItem {
	slug: string;
	title: string;
	description: string | null;
	alt: string | null;
	type: StickerAssetType;
	contentType: string;
	format: string;
	width: number;
	height: number;
	widthUnits: number;
	size: number;
	url: string;
	packSlug: string;
	categories: StickerCategory[];
	usageCount: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface Page<T> {
	content: T[];
	totalElements: number;
	totalPages: number;
	currentPage: number;
	last: boolean;
}

export interface CreatePackRequest {
	slug?: string;
	title: string;
	description?: string;
	categorySlugs?: string[];
}

export interface UpdatePackRequest {
	slug?: string;
	title: string;
	description?: string;
	categorySlugs?: string[];
}

export interface CreateCategoryRequest {
	slug?: string;
	title: string;
	description?: string;
}

export interface UploadStickerOptions {
	file: File;
	title: string;
	itemSlug?: string;
	description?: string;
	alt?: string;
	categorySlugs?: string[];
	widthUnits: number;
}

export interface UpdateStickerItemRequest {
	slug?: string;
	title?: string;
	description?: string;
	alt?: string;
	packSlug?: string;
	categorySlugs?: string[];
	widthUnits?: number;
}

const MAX_STICKER_SOURCE_PIXELS = 4_000_000;

const isWebp = (file: File) =>
	file.type.toLowerCase() === "image/webp" || file.name.toLowerCase().endsWith(".webp");

/** Converts WebP before it reaches the backend, which intentionally has no WebP codec. */
export async function prepareStickerFile(file: File): Promise<File> {
	if (!isWebp(file)) return file;

	const image = await createImageBitmap(file);
	try {
		const pixels = image.width * image.height;
		const scale = pixels > MAX_STICKER_SOURCE_PIXELS
			? Math.sqrt(MAX_STICKER_SOURCE_PIXELS / pixels)
			: 1;
		const width = Math.max(1, Math.round(image.width * scale));
		const height = Math.max(1, Math.round(image.height * scale));
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
		const blob = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Не вдалося конвертувати WebP у PNG.")), "image/png"),
		);
		return new File([blob], file.name.replace(/\.webp$/i, "") + ".png", { type: "image/png" });
	} finally {
		image.close();
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const token = await AuthService.getToken();
	const response = await fetch(`${API_BACKEND_BASE}${path}`, {
		...init,
		headers: {
			accept: "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...init?.headers,
		},
	});

	if (!response.ok) {
		let message = `HTTP ${response.status}`;
		try {
			const body = (await response.json()) as { message?: string; error?: string };
			message = body.message || body.error || message;
		} catch {
			// Keep the status-based error when the response is not JSON.
		}
		throw new Error(message);
	}

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}

function params(values: Record<string, string | number | undefined>): string {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(values)) {
		if (value !== undefined) query.set(key, String(value));
	}
	return query.toString();
}

async function collectPages<T>(load: (page: number) => Promise<Page<T>>): Promise<T[]> {
	const result: T[] = [];
	let page = 0;
	while (true) {
		const response = await load(page);
		result.push(...response.content);
		if (response.last || response.content.length === 0) return result;
		page += 1;
	}
}

export const StickerService = {
	listCategories: () => request<StickerCategory[]>("/categories"),
	listPacks: (page = 0, size = 100) =>
		request<Page<StickerPack>>(`/packs?${params({ page, size, sort: "title,asc" })}`),
	listPackItems: (packSlug: string, page = 0, size = 100) =>
		request<Page<StickerItem>>(
			`/packs/${encodeURIComponent(packSlug)}/items?${params({ page, size, sort: "title,asc" })}`,
		),
	listAllPacks: () => collectPages((page) => StickerService.listPacks(page)),
	listAllItems: async (packs: StickerPack[]) => {
		const pages = await Promise.all(
			packs.map((pack) => collectPages((page) => StickerService.listPackItems(pack.slug, page))),
		);
		return pages.flat();
	},
	search: (query: string, page = 0, size = 100) =>
		request<Page<StickerItem>>(`/search?${params({ q: query, page, size, sort: "usageCount,desc" })}`),
	incrementUsage: (slug: string) =>
		request<void>(`/items/${encodeURIComponent(slug)}/usage`, { method: "POST" }),
	listAdminPacks: (page = 0, size = 100) =>
		request<Page<StickerPack>>(`/admin/packs?${params({ page, size, sort: "title,asc" })}`),
	listAdminPackItems: (packSlug: string, page = 0, size = 100) =>
		request<Page<StickerItem>>(
			`/admin/packs/${encodeURIComponent(packSlug)}/items?${params({ page, size, sort: "title,asc" })}`,
		),
	createPack: (body: CreatePackRequest) =>
		request<StickerPack>("/admin/packs", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	updatePack: (slug: string, body: UpdatePackRequest) =>
		request<StickerPack>(`/admin/packs/${encodeURIComponent(slug)}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	createCategory: (body: CreateCategoryRequest) =>
		request<StickerCategory>("/admin/categories", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	updateCategory: (slug: string, body: CreateCategoryRequest) =>
		request<StickerCategory>(`/admin/categories/${encodeURIComponent(slug)}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	deleteCategory: (slug: string) =>
		request<void>(`/admin/categories/${encodeURIComponent(slug)}`, { method: "DELETE" }),
	uploadItem: async (packSlug: string, options: UploadStickerOptions) => {
		const form = new FormData();
		form.append("file", await prepareStickerFile(options.file));
		form.append("title", options.title);
		if (options.itemSlug) form.append("itemSlug", options.itemSlug);
		if (options.description) form.append("description", options.description);
		if (options.alt) form.append("alt", options.alt);
		form.append("widthUnits", String(options.widthUnits));
		for (const category of options.categorySlugs ?? []) {
			form.append("categorySlugs", category);
		}
		return request<StickerItem>(`/admin/packs/${encodeURIComponent(packSlug)}/items`, {
			method: "POST",
			body: form,
		});
	},
	updateItem: (slug: string, body: UpdateStickerItemRequest) =>
		request<StickerItem>(`/admin/items/${encodeURIComponent(slug)}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	replaceItemFile: async (slug: string, file: File, widthUnits: number) => {
		const form = new FormData();
		form.append("file", file);
		form.append("widthUnits", String(widthUnits));
		return request<StickerItem>(`/admin/items/${encodeURIComponent(slug)}/file`, {
			method: "PUT",
			body: form,
		});
	},
	hidePack: (slug: string) =>
		request<void>(`/admin/packs/${encodeURIComponent(slug)}`, { method: "DELETE" }),
	hideItem: (slug: string) =>
		request<void>(`/admin/items/${encodeURIComponent(slug)}`, { method: "DELETE" }),
};
