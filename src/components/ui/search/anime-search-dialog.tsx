"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { SearchHeader } from "./search-header"
import { SearchResults } from "./search-results"
import { useAnimeSearch } from "@/hooks/useAnimeSearch"
import { useDebounce } from "@/hooks/useDebounce"
import { SimilarAnimeItem } from "@/types" 

interface AnimeSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnimeSearchDialog({ open, onOpenChange }: AnimeSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isKeyboardMode, setIsKeyboardMode] = useState(false)

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
      setIsKeyboardMode(false)
    }
  }, [open, clear])

  const handleAnimeSelect = (anime: SimilarAnimeItem) => {
    onOpenChange(false)
    window.location.href = `https://hikka.io/anime/${anime.slug}`
  }

  const handleMouseSelect = (index: number) => {
    if (!isKeyboardMode) {
      setSelectedIndex(index)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === "Escape") {
        onOpenChange(false)
        return
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setIsKeyboardMode(true) 

        if (e.key === "ArrowDown") {
          const maxIndex = (results?.length ?? 0) - 1
          if (maxIndex >= 0) {
            setSelectedIndex((prev) => Math.min(prev + 1, maxIndex))
          }
        } else { 
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
        }
      } else if (e.key === "Enter") {
        e.preventDefault()
        const selectedAnime = results?.[selectedIndex]
        if (selectedAnime) {
          handleAnimeSelect(selectedAnime)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, results, selectedIndex])

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
              onAnimeSelect={handleAnimeSelect}
              onMouseSelect={handleMouseSelect}
              onMouseMove={() => setIsKeyboardMode(false)}
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