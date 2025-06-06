"use client";

import React, { useMemo, useState } from "react";
import { useChapterPages } from "@/hooks/useChapterPages";
import { useHoneyMangaChapters } from "@/hooks/useHoneyMangaChapters";
import { MangaViewer } from "@/components/ui/manga/manga-viewer";
import NotFound from "@/components/ui/not-found";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

const MangaReaderPageContent: React.FC = () => {
	const urlParams = useMemo(
		() => new URLSearchParams(window.location.search),
		[]
	);
	const sourceId = urlParams.get("sourceId");
	const initialChapterId = urlParams.get("chapterId");
	const mangaId = urlParams.get("mangaId");

	const [currentChapterId, setCurrentChapterId] = useState<string | null>(
		initialChapterId
	);

	const { data: allChaptersData, loading: allChaptersLoading } =
		useHoneyMangaChapters({ mangaId, enabled: !!mangaId });

	const sortedChapters = useMemo(() => {
		return allChaptersData ? allChaptersData.slice().reverse() : null;
	}, [allChaptersData]);

	const {
		pages,
		loading: pagesLoading,
		error,
	} = useChapterPages({ sourceId, chapterId: currentChapterId });

	const {
		currentChapterIndex,
		currentChapter,
		isNextDisabled,
		isPrevDisabled,
	} = useMemo(() => {
		if (!sortedChapters || !currentChapterId) {
			return {
				currentChapterIndex: -1,
				currentChapter: null,
				isNextDisabled: true,
				isPrevDisabled: true,
			};
		}
		const index = sortedChapters.findIndex((ch) => ch.id === currentChapterId);
		return {
			currentChapterIndex: index,
			currentChapter: sortedChapters[index],
			isNextDisabled: index >= sortedChapters.length - 1,
			isPrevDisabled: index <= 0,
		};
	}, [sortedChapters, currentChapterId]);

	const handleNextChapter = () => {
		if (sortedChapters && currentChapterIndex < sortedChapters.length - 1) {
			setCurrentChapterId(sortedChapters[currentChapterIndex + 1].id);
		}
	};

	const handlePrevChapter = () => {
		if (sortedChapters && currentChapterIndex > 0) {
			setCurrentChapterId(sortedChapters[currentChapterIndex - 1].id);
		}
	};

	if (allChaptersLoading || pagesLoading) {
		return (
			<div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
				<Icon
					icon="material-symbols:progress-activity"
					className="h-8 w-8 animate-spin"
				/>
				<h1 className="text-xl font-semibold">Loading Reader...</h1>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
				<Alert variant="destructive" className="max-w-md">
					<Icon icon="material-symbols:warning-outline" className="h-4 w-4" />
					<AlertTitle>Failed to Load</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
				<Button onClick={() => window.location.reload()}>Try Again</Button>
			</div>
		);
	}

	if (pages && currentChapter) {
		return (
			<MangaViewer
				pages={pages}
				currentChapterName={currentChapter.name}
				onNextChapter={handleNextChapter}
				onPrevChapter={handlePrevChapter}
				isNextChapterDisabled={isNextDisabled}
				isPrevChapterDisabled={isPrevDisabled}
			/>
		);
	}
	return <NotFound title="Error" description="Could not load chapter data." />;
};

export default MangaReaderPageContent;
