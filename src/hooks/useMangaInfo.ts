"use client";

import { useState, useEffect, useCallback } from "react";
import { MangaInfo } from "@/types";
import { fetchMangaInfo } from "@/services/mangaService";

interface UseMangaInfoProps {
	slug: string;
}

interface UseMangaInfoReturn {
	data: MangaInfo | null;
	loading: boolean;
	error: string | null;
	refresh: () => void;
}

export const useMangaInfo = ({
	slug,
}: UseMangaInfoProps): UseMangaInfoReturn => {
	const [data, setData] = useState<MangaInfo | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const loadManga = useCallback(async (mangaSlug: string) => {
		if (!mangaSlug) {
			setError("Manga slug is required to fetch info.");
			setLoading(false);
			setData(null);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const result = await fetchMangaInfo({ slug: mangaSlug });
			setData(result);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An unknown error occurred"
			);
			setData(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadManga(slug);
	}, [loadManga, slug]);

	const refresh = useCallback(() => {
		loadManga(slug);
	}, [loadManga, slug]);

	return { data, loading, error, refresh };
};
