import { API_BACKEND_BASE } from "@/constants";
import { AuthService } from "@/services/authService";

export type AlchemySourceType = "element" | "anime" | "manga";
export type AlchemyResultType = "anime" | "manga" | "any";
export const ALCHEMY_VECTOR_SIZE = 256;

export interface AlchemyElement {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export interface AlchemyIngredient {
  type: AlchemySourceType;
  slug?: string;
  id?: number;
  weight: number;
}

export interface AlchemyResult {
  contentType: "anime" | "manga";
  slug: string;
  title: string;
  imageUrl: string | null;
  year: number | null;
  mediaType: string | null;
  similarity: number;
}

export interface AlchemyCatalogItem {
  type: "anime" | "manga";
  slug: string;
  titleEn: string | null;
  titleNative: string | null;
  imageUrl: string | null;
  year: number | null;
  mediaType: string | null;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  currentPage: number;
  totalPages: number;
  last: boolean;
}

export interface AdminAlchemyElement extends AlchemyElement {
  embedding: number[];
}

interface ElementPayload {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  embedding: number[];
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  if (init?.body) headers.set("content-type", "application/json");
  const token = await AuthService.getToken();
  if (!token) throw new Error("Потрібен вхід до акаунта.");
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BACKEND_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      message = body.message || body.error || message;
    } catch {
      /* response has no JSON error body */
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const AlchemyService = {
  listElements: (page = 0, size = 50) =>
    request<PagedResponse<AlchemyElement>>(
      `/alchemy/elements?page=${page}&size=${size}&sort=name,asc`,
    ),
  query: (
    ingredients: AlchemyIngredient[],
    resultType: AlchemyResultType = "any",
  ) =>
    request<PagedResponse<AlchemyResult>>("/alchemy/query?page=0&size=20", {
      method: "POST",
      body: JSON.stringify({ ingredients, resultType }),
    }),
  searchCatalog: async (query: string) => {
    const body = JSON.stringify({ q: query });
    const options = { method: "POST", body };
    const [anime, manga] = await Promise.all([
      request<PagedResponse<Omit<AlchemyCatalogItem, "type">>>(
        "/anime/search?page=0&size=6",
        options,
      ),
      request<PagedResponse<Omit<AlchemyCatalogItem, "type">>>(
        "/manga/search?page=0&size=6",
        options,
      ),
    ]);
    return [
      ...anime.content.map((item) => ({ ...item, type: "anime" as const })),
      ...manga.content.map((item) => ({ ...item, type: "manga" as const })),
    ];
  },
  getAdminElement: (id: number) =>
    request<AdminAlchemyElement>(`/admin/alchemy/elements/${id}`),
  createElement: (payload: ElementPayload) =>
    request<AdminAlchemyElement>(
      "/admin/alchemy/elements",
      { method: "POST", body: JSON.stringify(payload) },
    ),
  updateElement: (id: number, payload: ElementPayload) =>
    request<AdminAlchemyElement>(
      `/admin/alchemy/elements/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
    ),
  deleteElement: (id: number) =>
    request<void>(`/admin/alchemy/elements/${id}`, { method: "DELETE" }),
  getEmbedding: (type: AlchemySourceType, idOrSlug: number | string) => {
    const path =
      type === "element"
        ? `/admin/alchemy/elements/${idOrSlug}`
        : `/${type}/${idOrSlug}/embedding`;
    return request<AdminAlchemyElement | number[]>(path).then(
      (value) => {
        const embedding = Array.isArray(value) ? value : value.embedding;
        if (
          embedding.length !== ALCHEMY_VECTOR_SIZE ||
          !embedding.every(Number.isFinite)
        ) {
          throw new Error(
            `Backend returned an invalid ${ALCHEMY_VECTOR_SIZE}-dimensional embedding.`,
          );
        }
        return embedding;
      },
    );
  },
};
