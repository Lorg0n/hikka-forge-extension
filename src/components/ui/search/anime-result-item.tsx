"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Star, Tv } from "lucide-react"
import { SimilarAnimeItem } from "@/types"
import { CONTENT_TYPE_URL } from "@/constants"

interface AnimeResultItemProps {
  anime: SimilarAnimeItem
  isSelected: boolean
  onSelect: () => void
  onMouseEnter: () => void
}

export function AnimeResultItem({ anime, isSelected, onSelect, onMouseEnter }: AnimeResultItemProps) {
  return (
    <a
      href={`https://hikka.io/${CONTENT_TYPE_URL.anime}/${anime.slug}`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <Avatar className="w-10 h-14 rounded-sm flex-shrink-0">
        <AvatarImage src={anime.imageUrl} alt={anime.title} className="object-cover" />
        <AvatarFallback className="rounded-sm"><Tv className="w-4 h-4" /></AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{anime.title}</p>
        <p className="text-sm text-muted-foreground">{anime.year}</p>
        <div className="mt-1">
          <Badge variant="outline">
            Схожість: {(anime.similarityScore * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{anime.score.toFixed(1)}</span>
      </div>
    </a>
  )
}