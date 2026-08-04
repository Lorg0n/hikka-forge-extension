import { API_BACKEND_BASE } from "@/constants";
import { AuthService } from "@/services/authService";

export const MEDIA_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const MEDIA_IMAGE_MAX_SIZE = 10 * 1024 * 1024;

export interface MediaImage {
  id: string;
  url: string;
  sha256: string;
  contentType: string;
  size: number;
  originalFilename: string;
  createdAt: string;
  updatedAt: string;
}

interface MediaImagePage {
  content: MediaImage[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  last: boolean;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: { parseResponse?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");

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
      /* Response has no JSON error body. */
    }
    throw new Error(message);
  }

  if (response.status === 204 || options?.parseResponse === false) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const MediaImageService = {
  list: (options: { page?: number; size?: number } = {}) => {
    const params = new URLSearchParams({
      page: String(options.page ?? 0),
      size: String(options.size ?? 100),
      sort: "createdAt,desc",
    });
    return request<MediaImagePage>(`/admin/media/images?${params.toString()}`);
  },

  upload: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<MediaImage>("/admin/media/images", {
      method: "POST",
      body,
    });
  },

  delete: (id: string) =>
    request<void>(
      `/admin/media/images/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      { parseResponse: false },
    ),
};
