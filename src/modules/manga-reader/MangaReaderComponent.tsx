import { ScrollArea } from "@/components/ui/scroll-area";
import { SelectableItemList } from "@/components/ui/selectable-Item-list";
import { useMangaInfo } from "@/hooks/useMangaInfo";
import React, { useCallback, useState } from "react";

const MangaReaderComponent: React.FC = () => {
	const mangaSlug = window.location.pathname.split("/manga/")[1];
	if (mangaSlug == null || mangaSlug == "") return null;

	const { data, error } = useMangaInfo({ slug: mangaSlug });
	if (error) return null;

	const [currentSelectedChapter, setCurrentSelectedChapter] = useState<
		string | null
	>(null);

	const mangaSources =
		data?.external.filter((externalSource) => externalSource.type === "read") ||
		[];

	const handleChapterSelection = useCallback((selectedId: string) => {
		setCurrentSelectedChapter(selectedId);
	}, []);

	const textCounts: { [key: string]: number } = {};
	mangaSources.forEach((source) => {
		textCounts[source.text] = (textCounts[source.text] || 0) + 1;
	});

	const currentTextIndexes: { [key: string]: number } = {};

	const selectableItems = mangaSources.map((source) => {
		let label = source.text;
		if (textCounts[source.text] > 1) {
			currentTextIndexes[source.text] =
				(currentTextIndexes[source.text] || 0) + 1;
			label = `${source.text} #${currentTextIndexes[source.text]}`;
		}
		return {
			id: source.url,
			label: label,
		};
	});

	return (
		<div className="flex flex-col gap-8">
			<SelectableItemList
				items={selectableItems}
				onSelect={handleChapterSelection}
			/>
			<ScrollArea className="relative flex flex-col gap-4 rounded-lg border border-border bg-secondary/20 p-4">
				Hello World
			</ScrollArea>
		</div>
	);
};

export default MangaReaderComponent;
