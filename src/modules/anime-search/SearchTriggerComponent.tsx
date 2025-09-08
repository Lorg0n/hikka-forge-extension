"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AnimeSearchDialog } from "@/components/ui/search/anime-search-dialog"
import { Icon } from "@iconify/react/dist/iconify.js"

export function SearchTrigger() {
    const [isSearchOpen, setIsSearchOpen] = useState(false)

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