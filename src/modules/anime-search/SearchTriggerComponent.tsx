// components/layout/SearchTrigger.tsx (or wherever you want to place it)
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AnimeSearchDialog } from "@/components/ui/search/anime-search-dialog"
import { Icon } from "@iconify/react/dist/iconify.js"

export function SearchTrigger() {
    // 1. State to control if the dialog is open or closed
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    // Bonus: Add a keyboard shortcut (Cmd+K or Ctrl+K) to open the search
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsSearchOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
            {/* 2. This is the trigger button */}
            <Button
                variant="outline"
                size="icon-md"
                onClick={() => setIsSearchOpen(true)}
            >
                <Icon icon="mingcute:list-search-line" className="h-5 w-5" />
            </Button>
            <AnimeSearchDialog
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
            />
        </>
    )
}