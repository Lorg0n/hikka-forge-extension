import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnimeSearch } from '@/hooks/useAnimeSearch';
import SimilarAnimeCard from '@/components/ui/anime/similar-anime-card';
import { Icon } from '@iconify/react/dist/iconify.js';

interface AnimeSearchComponentProps {
  moduleId: string;
}

const AnimeSearchComponent: React.FC<AnimeSearchComponentProps> = ({ moduleId }) => {
  const [inputText, setInputText] = useState('');
  const { results, loading, error, search, clear } = useAnimeSearch();
  
  const handleSearchClick = () => {
    search(inputText);
  };

  const handleClearClick = () => {
    clear();
    setInputText('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-md" className="relative">
          <Icon icon="mingcute:list-search-line" className="size-full" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-80">
        <DialogHeader>
          <DialogTitle>Anime Search</DialogTitle>
          <DialogDescription>
            Search anime by natural language descriptions using text embeddings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input and buttons in column layout */}
          <div className="flex flex-col gap-2">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe the anime you're looking for..."
              className="min-h-[80px] flex-grow"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSearchClick}
                disabled={loading || !inputText.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
              {results && (
                <Button onClick={handleClearClick} variant="outline">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Scrollable results container */}
          <div className="max-h-60 w-full overflow-y-auto">
            {loading && !results && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            )}

            {results && results.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No anime found matching your description
              </div>
            )}

            {results && results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((anime) => (
                  <SimilarAnimeCard
                    key={anime.slug}
                    anime={anime}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnimeSearchComponent;
