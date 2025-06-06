"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@iconify/react";

interface MangaViewerProps {
	pages: string[];
	currentChapterName: string;
	onNextChapter: () => void;
	onPrevChapter: () => void;
	isNextChapterDisabled: boolean;
	isPrevChapterDisabled: boolean;
}

export const MangaViewer: React.FC<MangaViewerProps> = ({
	pages,
	currentChapterName,
	onNextChapter,
	onPrevChapter,
	isNextChapterDisabled,
	isPrevChapterDisabled,
}) => {
	const [isWebtoonMode, setIsWebtoonMode] = useState(false);
	const [currentPage, setCurrentPage] = useState(0);
	const [isImageLoading, setIsImageLoading] = useState(true);

	const totalPages = pages.length;
	const scrollContainerRef = useRef<HTMLElement>(null);

	useEffect(() => {
		setCurrentPage(0);
		setIsImageLoading(true);
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = 0;
		}
	}, [pages]);

	const goToNextPage = useCallback(() => {
		if (currentPage < totalPages - 1) {
			setCurrentPage((p) => p + 1);
		} else {
			onNextChapter();
		}
	}, [currentPage, totalPages, onNextChapter]);

	const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 0));

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isWebtoonMode) {
				if (e.key === "ArrowRight") goToNextPage();
				if (e.key === "ArrowLeft") goToPrevPage();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isWebtoonMode, goToNextPage, goToPrevPage]);

	useEffect(() => setIsImageLoading(true), [currentPage]);

	return (
		<TooltipProvider delayDuration={100}>
			<div className="flex h-screen w-full flex-col ">
				<header className="flex w-full items-center justify-between border-b p-2 backdrop-blur-sm z-20">
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" onClick={() => window.close()}>
							<Icon icon="material-symbols:close" />
						</Button>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant={isWebtoonMode ? "secondary" : "outline"}
									size="icon"
									onClick={() => setIsWebtoonMode((prev) => !prev)}
								>
									<Icon
										icon="material-symbols:view-day-outline"
										className="h-5 w-5"
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Toggle Webtoon Mode (Vertical Scroll)</p>
							</TooltipContent>
						</Tooltip>
					</div>

					<div className="flex flex-col items-center text-center">
						<span className="font-semibold text-sm truncate max-w-[200px] md:max-w-md">
							{currentChapterName}
						</span>
						{!isWebtoonMode && (
							<span className="text-xs ">
								{currentPage + 1} / {totalPages}
							</span>
						)}
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={onPrevChapter}
							disabled={isPrevChapterDisabled}
						>
							<Icon
								icon="material-symbols:keyboard-double-arrow-left"
								className="h-4 w-4 mr-1"
							/>{" "}
							Prev Ch.
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onNextChapter}
							disabled={isNextChapterDisabled}
						>
							Next Ch.{" "}
							<Icon
								icon="material-symbols:keyboard-double-arrow-right"
								className="h-4 w-4 ml-1"
							/>
						</Button>
					</div>
				</header>

				<main
					ref={scrollContainerRef}
					className={`flex-grow relative flex ${
						isWebtoonMode
							? "overflow-y-auto justify-center"
							: "overflow-hidden items-center justify-center"
					}`}
					onClick={!isWebtoonMode ? goToNextPage : undefined}
				>
					{isImageLoading && (
						<Icon
							icon="material-symbols:progress-activity"
							className="absolute z-10 h-10 w-10 animate-spin "
						/>
					)}

					{isWebtoonMode ? (
						<div className="flex flex-col items-center">
							{pages.map((pageUrl, index) => (
								<img
									key={`${currentChapterName}-${index}`}
									src={pageUrl}
									alt={`Page slice ${index + 1}`}
									className="block max-w-full h-auto"
									onLoad={() => index === 0 && setIsImageLoading(false)}
								/>
							))}
						</div>
					) : (
						<img
							key={pages[currentPage]}
							src={pages[currentPage]}
							alt={`Page ${currentPage + 1}`}
							onLoad={() => setIsImageLoading(false)}
							onError={() => setIsImageLoading(false)}
							className={`select-none transition-opacity duration-300 ${
								isImageLoading ? "opacity-0" : "opacity-100"
							} max-h-full max-w-full object-contain`}
						/>
					)}
				</main>
			</div>
		</TooltipProvider>
	);
};
