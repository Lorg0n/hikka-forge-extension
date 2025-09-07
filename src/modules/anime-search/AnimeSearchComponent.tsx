import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, SearchX, Film, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnimeSearch } from '@/hooks/useAnimeSearch';
import SimilarAnimeCard from '@/components/ui/anime/similar-anime-card';
import { Icon } from '@iconify/react/dist/iconify.js';
import { SimilarAnimeItem } from '@/types';

const SearchResults = ({
  loading,
  results,
}: {
  loading: boolean;
  results: SimilarAnimeItem[] | null;
}) => {
  const CenteredPlaceholder = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-full flex-col items-center justify-center text-center py-12 px-4">
      {children}
    </div>
  );

  if (!loading && !results) {
    return (
      <CenteredPlaceholder>
        <div className="relative mb-6">
          <Film className="h-16 w-16 text-muted-foreground/40 mx-auto" />
          <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Відкрийте своє наступне аніме</h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          Опишіть будь-яку концепцію, сюжет або персонажа аніме, і ми знайдемо схожі шоу, які вам сподобаються.
        </p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✨ Згадайте теми, жанри або пам'ятні сцени</p>
          <p>🎭 Опишіть типи персонажів або стосунки</p>
          <p>🌍 Включіть місце дії або період часу</p>
        </div>
      </CenteredPlaceholder>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Пошук у базі даних аніме...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (results && results.length === 0) {
    return (
      <CenteredPlaceholder>
        <SearchX className="h-12 w-12 text-muted-foreground/40 mb-4 mx-auto" />
        <h3 className="font-semibold mb-2">Збігів не знайдено</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Спробуйте інші ключові слова або будьте точнішими щодо тем і жанрів.
        </p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Спробуйте описати візуальний стиль або художнє оформлення</p>
          <p>🎬 Згадайте елементи сюжету або структуру історії</p>
        </div>
      </CenteredPlaceholder>
    );
  }

  if (results && results.length > 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h4 className="font-semibold text-sm">Знайдено {results.length} схожих аніме</h4>
            <p className="text-xs text-muted-foreground">Натисніть будь-яку картку, щоб переглянути деталі</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>За схожістю</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {results.map((anime) => (
            <DialogClose asChild key={anime.slug}>
              <SimilarAnimeCard anime={anime} />
            </DialogClose>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const AnimeSearchComponent: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const [inputText, setInputText] = useState('');
  const { results, loading, error, search, clear } = useAnimeSearch();

  const handleSearchClick = () => {
    if (inputText.trim()) search(inputText);
  };

  const handleClearClick = () => {
    clear();
    setInputText('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-md"
        >
          <Icon icon="mingcute:list-search-line" className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] grid grid-rows-[auto_1fr] p-0 gap-0">
        <div className="p-6 pb-4 border-b bg-gradient-to-r from-muted/30 to-background">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon icon="mingcute:list-search-line" className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Семантичний пошук аніме</DialogTitle>
                <DialogDescription className="text-sm">
                  Знайдіть аніме за допомогою описів природною мовою. Будьте максимально детальними.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Опис для пошуку..."
                className="min-h-24 resize-none pr-16 rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearchClick();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {inputText.length}/500
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSearchClick}
                disabled={loading || !inputText.trim()}
                variant={"default"}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Пошук...' : 'Шукати'}
              </Button>

              {(results || inputText) && !loading && (
                <Button onClick={handleClearClick} variant="outline">
                  Очистити
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-h-60 min-h-60">
          <SearchResults loading={loading} results={results} />
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default AnimeSearchComponent;