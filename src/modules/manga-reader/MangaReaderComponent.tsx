"use client";

import { SelectableItemList } from "@/components/ui/selectable-Item-list";
import { useMangaInfo } from "@/hooks/useMangaInfo";
import { useHoneyMangaChapters } from "@/hooks/useHoneyMangaChapters";
import React, { useCallback, useState, useEffect, useMemo } from "react";
import { ALLOWED_READING_SOURCE_NAMES, HONEYMANGA_BASE_URL } from "@/constants";
import NotFound from "@/components/ui/not-found";
import { Button } from "@/components/ui/button";

const isHoneyMangaUrl = (url: string): boolean => {
	return url.startsWith(HONEYMANGA_BASE_URL);
};

function formatUkrainianDate(date: Date): string {
	if (!(date instanceof Date) || isNaN(date.getTime())) {
		return "Invalid Date";
	}
	const options: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		year: "numeric",
	};
	let formattedDate = date.toLocaleDateString("uk-UA", options);
	formattedDate = formattedDate.replace(/./g, "").trim();
	return `${formattedDate}`;
}

const getHoneyMangaIdFromUrl = (url: string): string | null => {
	if (isHoneyMangaUrl(url)) {
		const parts = url.split("/");
		return parts[parts.length - 1] || null;
	}
	return null;
};

const MangaReaderComponent: React.FC = () => {
	const mangaSlug = useMemo(() => {
		const pathParts = window.location.pathname.split("/manga/");
		return pathParts.length > 1 ? pathParts[1] : "";
	}, []);

	const {
		data: mangaInfo,
		loading: mangaLoading,
		error: mangaError,
	} = useMangaInfo({ slug: mangaSlug });

	const [currentSelectedSource, setCurrentSelectedSource] = useState<
		string | null
	>(null);

	const honeyMangaId = useMemo(() => {
		if (currentSelectedSource && isHoneyMangaUrl(currentSelectedSource)) {
			return getHoneyMangaIdFromUrl(currentSelectedSource);
		}
		return null;
	}, [currentSelectedSource]);

	const {
		data: honeyMangaChapters,
		loading: chaptersLoading,
		error: chaptersError,
	} = useHoneyMangaChapters({
		mangaId: honeyMangaId,
		enabled: !!honeyMangaId,
	});

	const mangaSources = useMemo(
		() => mangaInfo?.external.filter((source) => source.type === "read") || [],
		[mangaInfo]
	);

	useEffect(() => {
		if (mangaSources.length > 0 && currentSelectedSource === null) {
			setCurrentSelectedSource(mangaSources[0].url);
		}
	}, [mangaSources, currentSelectedSource]);

	const handleSourceSelection = useCallback((selectedId: string) => {
		setCurrentSelectedSource(selectedId);
	}, []);

	const selectableItems = useMemo(() => {
		const filteredMangaSources = mangaSources.filter((source) =>
			ALLOWED_READING_SOURCE_NAMES.includes(source.text)
		);
		const textCounts: { [key: string]: number } = {};
		filteredMangaSources.forEach((source) => {
			textCounts[source.text] = (textCounts[source.text] || 0) + 1;
		});
		const currentTextIndexes: { [key: string]: number } = {};
		return filteredMangaSources.map((source) => {
			let label = source.text;
			if (textCounts[source.text] > 1) {
				currentTextIndexes[source.text] =
					(currentTextIndexes[source.text] || 0) + 1;
				label = `${source.text} #${currentTextIndexes[source.text]}`;
			}
			return { id: source.url, label: label };
		});
	}, [mangaSources]);

	const openReaderWithParams = useCallback(
		(chapterId: string, mangaId: string) => {
			if (typeof chrome !== "undefined" && chrome.runtime) {
				chrome.runtime.sendMessage({
					type: "OPEN_EXTENSION_PAGE",
					pagePath: "src/pages/manga-reader/manga-reader.html",
					params: {
						sourceId: "honeymanga",
						chapterId: chapterId,
						mangaId: mangaId,
					},
				});
			}
		},
		[]
	);

	if (mangaLoading || (!!honeyMangaId && chaptersLoading)) {
		return <div className="flex flex-col gap-8">Loading...</div>;
	}

	if (!mangaSlug) {
		return (
			<NotFound
				title="Manga not found"
				description="Could not determine manga from URL."
			/>
		);
	}

	if (mangaError || chaptersError) {
		return (
			<NotFound
				title="Error"
				description={
					mangaError || chaptersError || "An unknown error occurred."
				}
			/>
		);
	}

	if (mangaSources.length === 0) {
		return (
			<NotFound
				title="Джерело манги не знайдено"
				description="Можливо, зовнішні джерела для читання ще не додані або оновлюються."
			/>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			<SelectableItemList
				items={selectableItems}
				onSelect={handleSourceSelection}
			/>
			<div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-4 max-h-64 overflow-y-auto">
				{honeyMangaChapters && honeyMangaChapters.length > 0 ? (
					honeyMangaChapters.map((item) => (
						<Button
							key={item.id}
							variant="ghost"
							className="flex items-center justify-between w-full h-auto text-left"
							onClick={() =>
								honeyMangaId && openReaderWithParams(item.id, honeyMangaId)
							}
						>
							<div className="flex flex-col flex-grow min-w-0">
								<span className="font-bold text-foreground truncate">
									{item.name}
								</span>
								<div className="text-sm text-muted-foreground flex items-center">
									<span>
										{item.uploadDate
											? formatUkrainianDate(new Date(item.uploadDate))
											: "Дата невідома"}
									</span>
								</div>
							</div>
						</Button>
					))
				) : (
					<div className="text-sm text-gray-500 p-4">
						Немає глав для відображення або джерело не вибрано.
					</div>
				)}
			</div>
		</div>
	);
};

export default MangaReaderComponent;
