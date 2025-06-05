"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SelectableItemList } from "@/components/ui/selectable-Item-list";
import { useMangaInfo } from "@/hooks/useMangaInfo";
import { useHoneyMangaChapters } from "@/hooks/useHoneyMangaChapters";
import React, { useCallback, useState, useEffect, useMemo } from "react"; 
import { ALLOWED_READING_SOURCE_NAMES, HONEYMANGA_BASE_URL } from "@/constants"; 
import NotFound from "@/components/ui/not-found";

const isHoneyMangaUrl = (url: string): boolean => {
    return url.startsWith(HONEYMANGA_BASE_URL);
};

const getHoneyMangaIdFromUrl = (url: string): string | null => {
    if (isHoneyMangaUrl(url)) {
        const parts = url.split('/');
        return parts[parts.length - 1] || null;
    }
    return null;
};


const MangaReaderComponent: React.FC = () => {
    const mangaSlug = useMemo(() => {
        const pathParts = window.location.pathname.split("/manga/");
        return pathParts.length > 1 ? pathParts[1] : "";
    }, []);

    if (!mangaSlug) {
        console.error("Manga slug not found in URL.");
        return null;
    }

    const { data: mangaInfo, loading: mangaLoading, error: mangaError } = useMangaInfo({ slug: mangaSlug });
    const [currentSelectedSource, setCurrentSelectedSource] = useState<string | null>(null);
    const mangaSources = useMemo(
        () => mangaInfo?.external.filter((externalSource) => externalSource.type === "read") || [],
        [mangaInfo]
    );

    useEffect(() => {
        if (mangaSources.length > 0 && currentSelectedSource === null) {
            setCurrentSelectedSource(mangaSources[0].url);
        }
    }, [mangaSources, currentSelectedSource]);


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
        refresh: refreshChapters,
    } = useHoneyMangaChapters({
        mangaId: honeyMangaId,
        enabled: !!honeyMangaId,
    });


    const handleSourceSelection = useCallback((selectedId: string) => {
        setCurrentSelectedSource(selectedId);
    }, []);


    const selectableItems = useMemo(() => {
        const filteredMangaSources = mangaSources.filter(source =>
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
            return {
                id: source.url,
                label: label,
            };
        });
    }, [mangaSources, ALLOWED_READING_SOURCE_NAMES]);

	if (mangaSources.length === 0 || mangaError) {
        return (
			<NotFound
                title="Джерело манги не знайдено" 
                description="Можливо, зовнішні джерела для читання ще не додані або оновлюються."
            />
		);
    }

    if (mangaLoading) {
        return <div className="flex flex-col gap-8">Loading manga info...</div>;
    }

    if (!mangaInfo) {
        return <div className="flex flex-col gap-8">Manga info not found.</div>;
    }


    return (
        <div className="flex flex-col gap-8">
            <SelectableItemList
                items={selectableItems}
                onSelect={handleSourceSelection}
            />

            <ScrollArea className="relative flex flex-col gap-4 rounded-lg border border-border bg-secondary/20 p-4 max-h-80">
                {currentSelectedSource && isHoneyMangaUrl(currentSelectedSource) ? (
                    <>
                        <h2 className="text-xl font-semibold">HoneyManga Chapters</h2>
                        {chaptersLoading && <div className="text-sm text-gray-500">Loading chapters...</div>}
                        {chaptersError && <div className="text-red-500 text-sm">Error loading chapters: {chaptersError} <button onClick={refreshChapters}>Retry</button></div>}
                        {honeyMangaChapters && honeyMangaChapters.length > 0 ? (
                            <ul className="list-disc list-inside space-y-2">
                                {honeyMangaChapters.map((chapter) => (
                                    <li key={chapter.id} className="text-foreground">
                                        <a href={chapter.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {chapter.name}
                                        </a>
                                        {chapter.uploadDate && (
                                            <span className="ml-2 text-xs text-gray-500">
                                                ({chapter.uploadDate.toLocaleDateString()})
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !chaptersLoading && <div className="text-sm text-gray-500">No chapters found for this HoneyManga source.</div>
                        )}
                    </>
                ) : (
                    <div className="text-sm text-gray-500">
                        {currentSelectedSource ? "Chapters are not available for this source type." : "Please select a reading source to view chapters."}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default MangaReaderComponent;