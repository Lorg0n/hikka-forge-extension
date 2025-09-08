"use client"

import { AnimeResultItem } from "./anime-result-item"
import { SimilarAnimeItem } from "@/types"

interface SearchResultsProps {
  selectedIndex: number
  searchData: SimilarAnimeItem[]
  isLoading: boolean
  error: string | null
}

export function SearchResults({ selectedIndex, searchData, isLoading, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Завантаження...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Помилка: {error}</div>
      </div>
    )
  }

  if (searchData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Результатів не знайдено</div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      {searchData.map((anime, index) => (
        <AnimeResultItem
          key={anime.slug || index}
          anime={anime}
          isSelected={index === selectedIndex}
        />
      ))}
    </div>
  )
}