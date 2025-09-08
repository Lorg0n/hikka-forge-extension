// components/anime-search/SearchResults.tsx
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (searchData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No results found</div>
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