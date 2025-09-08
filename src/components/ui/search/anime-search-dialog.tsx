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

  const { results, loading, error, search, clear } = useAnimeSearch()

  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (debouncedSearchQuery) {
      search(debouncedSearchQuery)
    } else {
      clear()
    }
  }, [debouncedSearchQuery, search, clear])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      clear()
    }
  }, [open, clear])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === "Escape") {
        onOpenChange(false)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
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
  }, [open, onOpenChange, results])

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
        <DialogTitle className="sr-only">Пошук</DialogTitle>
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
            Результатів не знайдено
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}