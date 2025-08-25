import React, { useMemo } from 'react';
import clsx from 'clsx';
import { DraggableItem } from '@/types';
import { useAnimeSearch } from '@/hooks/useAnimeSearch';
import { DraggableElement } from './DraggableElement';

interface ElementSidebarProps {
  discoveredItems: DraggableItem[];
  isOpen: boolean;
}

export function ElementSidebar({ discoveredItems, isOpen }: ElementSidebarProps) {
  const { searchTerm, setSearchTerm, results: searchResults, isSearching } = useAnimeSearch();

  const { baseElements, animeElements } = useMemo(() => {
    const base: DraggableItem[] = [];
    const anime: DraggableItem[] = [];
    discoveredItems.forEach(el => {
      if (el.type === 'alchemy_element') base.push(el);
      else anime.push(el);
    });
    return { baseElements: base, animeElements: anime };
  }, [discoveredItems]);

  const sidebarClasses = clsx(
    "p-4 bg-card border-border transition-transform duration-300 ease-in-out z-40 flex flex-col",
    "fixed bottom-0 left-0 right-0 h-2/5 rounded-t-2xl border-t-2 md:h-full md:relative md:w-64 md:border-t-0 md:border-r md:rounded-t-none",
    { "translate-y-0": isOpen, "translate-y-full md:translate-y-0": !isOpen }
  );
  
  const displayedAnime = searchTerm ? searchResults : animeElements;

  return (
    <aside className={sidebarClasses}>
      <div className="flex-shrink-0">
        <h2 className="text-lg font-bold mb-2 text-center md:text-left">Елементи</h2>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Базові</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-3 gap-2 mb-4">
          {baseElements.map(element => (
            <DraggableElement key={element.uniqueId} element={element} />
          ))}
        </div>
      </div>
      <div className="flex flex-col flex-grow min-h-0">
        <input
          type="text"
          placeholder="Пошук аніме..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-2 border border-border rounded bg-input text-foreground flex-shrink-0"
        />
        <div className="overflow-y-auto flex-grow">
          {isSearching && <p className="text-center text-muted-foreground p-4">Пошук...</p>}
          {!isSearching && displayedAnime.length === 0 && (
            <p className="text-center text-muted-foreground p-4">
              {searchTerm ? "Нічого не знайдено" : "Поки що немає відкритих аніме"}
            </p>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-3 gap-2">
            {displayedAnime.map(element => (
              <DraggableElement key={element.uniqueId} element={element} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}