import { Input } from "@/components/ui/input"
import { Search, ArrowUp, ArrowDown } from "lucide-react"

interface SearchHeaderProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
}

export function SearchHeader({ searchQuery, onSearchQueryChange }: SearchHeaderProps) {
  return (
    <div className="p-4 border-b flex-shrink-0">
      <div className="flex items-center gap-3">
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder="Search for an anime..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none text-base flex-1 min-w-0"
          autoFocus
        />
      </div>
      {/* Optional: You can keep or remove the keyboard hints */}
      <div className="hidden sm:flex items-center justify-between text-sm text-muted-foreground pt-3">
        <div className="flex items-center gap-1">
          <span>Navigate</span>
          <div className="flex gap-1">
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded"><ArrowUp className="w-3 h-3" /></kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded"><ArrowDown className="w-3 h-3" /></kbd>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span>Close</span>
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">esc</kbd>
        </div>
      </div>
    </div>
  )
}