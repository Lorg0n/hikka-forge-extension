import { MangaInfo, ApiErrorResponse } from "@/types";
import { API_HIKKA_BASE } from "@/constants";

interface FetchMangaInfoParams {
	slug: string;
}

export const fetchMangaInfo = async ({
	slug,
}: FetchMangaInfoParams): Promise<MangaInfo> => {
	if (!slug) {
		throw new Error("Manga slug is required.");
	}

	const url = new URL(`${API_HIKKA_BASE}/manga/${slug}`);

	const response = await fetch(url.toString(), {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		let errorMessage = `HTTP error! status: ${response.status}`;
		try {
			const errorData: ApiErrorResponse = await response.json();
			if (errorData && errorData.error) {
				errorMessage = errorData.error;
			}
		} catch (e) {
			console.error("Failed to parse error response:", e);
		}
		throw new Error(errorMessage);
	}

	return response.json() as Promise<MangaInfo>;
};
