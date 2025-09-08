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
  const hasResults = searchData.length > 0

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-muted-foreground p-4">Searching...</div>
    }
    if (error) {
      return <div className="text-center text-red-500 p-4">{error}</div>
    }
    if (!hasResults) {
      return <div className="text-center text-muted-foreground p-4">No results found. Type to start a search.</div>
    }
    return (
      <div className="space-y-2">
        {searchData.map((item, index) => (
          <AnimeResultItem 
            key={item.slug} 
            anime={item} 
            isSelected={selectedIndex === index} 
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 max-h-24 overflow-hidden">
      <div className="p-4 h-full overflow-y-auto">
        <div className="mb-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Anime
            {hasResults && <span className="ml-2">{searchData.length}</span>}
          </h3>
        </div>
        {renderContent()}
      </div>
    </div>
  )
}