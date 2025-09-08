"use client"

import { AnimeResultItem } from "./anime-result-item"
import { SimilarAnimeItem } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

interface SearchResultsProps {
  selectedIndex: number
  searchData: SimilarAnimeItem[]
  isLoading: boolean
  error: string | null
}

export function SearchResults({ selectedIndex, searchData, isLoading, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border skeleton-shimmer">
            <Skeleton className="h-16 w-12 rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 animate-fade-in">
        <div className="text-destructive text-lg font-medium">Помилка пошуку</div>
        <div className="text-muted-foreground text-center text-sm">{error}</div>
        <div className="text-xs text-muted-foreground">
          Перевірте підключення до інтернету та спробуйте ще раз
        </div>
      </div>
    )
  }

  if (searchData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 animate-fade-in">
        <div className="text-muted-foreground text-lg">Результатів не знайдено</div>
        <div className="text-sm text-muted-foreground text-center">
          Спробуйте інший запит або перефразуйте пошук
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1 animate-fade-in">
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
