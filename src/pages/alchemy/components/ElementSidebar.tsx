// File: /home/lorgon/hikka-forge-extension/src/pages/alchemy/components/ElementSidebar.tsx
import React, { useState, useRef, useMemo } from 'react';
import { Sparkles, Search, X, Loader2 } from 'lucide-react';
import { DraggableItem } from '@/types';
import { useAnimeSearch } from '@/hooks/useAnimeSearch';
import { SidebarDraggableItem } from './SidebarDraggableItem';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ElementSidebarProps {
  discoveredItems: DraggableItem[];
  isOpen: boolean;
}

export function ElementSidebar({ discoveredItems, isOpen }: ElementSidebarProps) {
  const { searchTerm, setSearchTerm, results: searchAnimeResults, isSearching } = useAnimeSearch();
  const [activeTab, setActiveTab] = useState<'base' | 'anime'>('base');

  const parentRef = useRef<HTMLDivElement>(null);

  const baseElements = useMemo(() => discoveredItems.filter(el => el.type === 'alchemy_element'), [discoveredItems]);
  const discoveredAnimeElements = useMemo(() => discoveredItems.filter(el => el.type === 'anime').sort((a, b) => a.name.localeCompare(b.name)), [discoveredItems]);
  
  const sidebarClasses = `
    bg-card/95 backdrop-blur-md border-border transition-all duration-500 ease-out z-40 flex flex-col
    fixed bottom-0 left-0 right-0 h-2/5 rounded-t-3xl border-t shadow-2xl
    md:h-full md:relative md:w-80 md:border-t-0 md:border-r md:rounded-t-none md:shadow-xl
    ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
  `;

  const currentAnimeDisplayList = searchTerm.trim() !== '' ? searchAnimeResults : discoveredAnimeElements;
  const itemsToDisplay = activeTab === 'base' ? baseElements : currentAnimeDisplayList;

  // --- FIX 1: DYNAMIC & MORE ACCURATE ESTIMATES ---
  // We determine column count and row height estimate based on the active tab.
  // These values are based on the w-80 sidebar width.
  const { columnCount, rowEstimate, gridClasses } = useMemo(() => {
    if (activeTab === 'base') {
      return {
        columnCount: 3, // 3 columns on desktop
        rowEstimate: 95,  // approx height for a 3-col square item + gap
        gridClasses: 'grid-cols-4 md:grid-cols-3' // 4 on mobile, 3 on desktop
      };
    }
    // 'anime' tab
    return {
      columnCount: 2, // 2 columns on desktop
      rowEstimate: 140, // approx height for a 2-col square item + gap
      gridClasses: 'grid-cols-3 md:grid-cols-2' // 3 on mobile, 2 on desktop
    };
  }, [activeTab]);

  const rowCount = Math.ceil(itemsToDisplay.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowEstimate, // Use the dynamic estimate
    overscan: 5,
  });

  return (
    <aside className={sidebarClasses}>
      {/* Header Area (No changes) */}
      <div className="flex-shrink-0 p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Елементи
            </h2>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('base'); setSearchTerm(''); }}
              className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                activeTab === 'base'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Базові ({baseElements.length})
            </button>
            <button
              onClick={() => { setActiveTab('anime'); setSearchTerm(''); }}
              className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                activeTab === 'anime'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Аніме ({discoveredAnimeElements.length})
            </button>
          </div>
        </div>
        {activeTab === 'anime' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Пошук аніме..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            {isSearching && searchTerm.trim() !== '' && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
            {!isSearching && searchTerm.trim() !== '' && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Virtualized Content Area */}
      <div ref={parentRef} className="flex-grow overflow-y-auto px-4">
        <div
          className="w-full relative" // Added relative here
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const itemsInRow = itemsToDisplay.slice(
              virtualRow.index * columnCount,
              (virtualRow.index * columnCount) + columnCount
            );
            return (
              <div
                key={virtualRow.key}
                className={`grid gap-3 absolute top-0 left-0 w-full ${gridClasses}`}
                style={{
                  // --- FIX 2: REMOVED fixed height. Row will now size itself. ---
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {itemsInRow.map(element => (
                  <SidebarDraggableItem key={element.uniqueId} element={element} />
                ))}
              </div>
            );
          })}
        </div>
        
        {/* Empty/Loading State Logic (No changes, just moved outside the virtual container) */}
        {itemsToDisplay.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center -mt-4">
            {isSearching && searchTerm.trim() !== '' ? (
              <>
                <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
                <p className="text-sm">Пошук аніме...</p>
              </>
            ) : (
              <>
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm max-w-xs">
                  {searchTerm.trim()
                    ? "Нічого не знайдено за вашим запитом"
                    : activeTab === 'base'
                      ? "Базові елементи з'являться тут"
                      : "Відкрийте аніме, поєднуючи елементи, або шукайте нові!"}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}