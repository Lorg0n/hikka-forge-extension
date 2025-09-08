// components/anime-search/AnimeSearchDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { SearchHeader } from "./search-header"
import { SearchResults } from "./search-results"
import { useAnimeSearch } from "@/hooks/useAnimeSearch"
import { useDebounce } from "@/hooks/useDebounce"

interface AnimeSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnimeSearchDialog({ open, onOpenChange }: AnimeSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 1. Get the functions and state from your search hook
  const { results, loading, error, search, clear } = useAnimeSearch()

  // 2. Debounce the user's input to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500) // 500ms delay is good for API calls

  // 3. This effect connects the debounced query to your hook's search function
  useEffect(() => {
    if (debouncedSearchQuery) {
      search(debouncedSearchQuery)
    } else {
      clear() // Clear results if the search input is empty
    }
    // The `search` and `clear` functions are stable due to `useCallback`
  }, [debouncedSearchQuery, search, clear])

  // 4. Reset selection when search results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Reset local state when the dialog is closed
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      clear()
    }
  }, [open, clear])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === "Escape") {
        onOpenChange(false)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        // Use the length of the dynamic search results, handling the null case
        const maxIndex = (results?.length ?? 0) - 1
        if (maxIndex >= 0) {
          setSelectedIndex((prev) => Math.min(prev + 1, maxIndex))
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, results]) // Dependency on `results` is crucial

  // Calculate if we should show full height
  const hasContent = results && results.length > 0
  const shouldShowFullHeight = hasContent || loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 gap-0 flex flex-col"
        style={{ 
          maxHeight: shouldShowFullHeight ? '80vh' : 'auto',
          height: shouldShowFullHeight ? '80vh' : 'auto',
          width: 'min(90vw, 42rem)',
          maxWidth: 'none'
        }}
      >
        <DialogTitle className="sr-only">Search Anime</DialogTitle>
        <div className="flex-shrink-0">
          <SearchHeader
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
        {shouldShowFullHeight && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SearchResults
              selectedIndex={selectedIndex}
              searchData={results || []}
              isLoading={loading}
              error={error}
            />
          </div>
        )}
        {!shouldShowFullHeight && searchQuery && !loading && (
          <div className="p-4 text-center text-muted-foreground">
            No results found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}