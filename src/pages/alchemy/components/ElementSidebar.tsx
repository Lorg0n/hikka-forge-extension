// File: /home/lorgon/hikka-forge-extension/src/pages/alchemy/components/ElementSidebar.tsx
import React, { useState } from 'react';
import { Sparkles, Search, X, Loader2 } from 'lucide-react'; // Додано Loader2
import { DraggableItem } from '@/types';
import { DraggableElement } from './DraggableElement';
import { useAnimeSearch } from '@/hooks/useAnimeSearch'; // Імпорт вашого хука

interface ElementSidebarProps {
  discoveredItems: DraggableItem[];
  isOpen: boolean;
}

export function ElementSidebar({ discoveredItems, isOpen }: ElementSidebarProps) {
  // Використовуємо ваш хук для пошуку аніме
  const { searchTerm, setSearchTerm, results: searchAnimeResults, isSearching } = useAnimeSearch();
  const [activeTab, setActiveTab] = useState<'base' | 'anime'>('base'); // Додано стан activeTab

  // Базові елементи (завжди з discoveredItems)
  const baseElements = discoveredItems.filter(el => el.type === 'alchemy_element');

  // Вже відкриті аніме (відображаються, коли пошуковий запит порожній)
  const discoveredAnimeElements = discoveredItems.filter(el => el.type === 'anime')
    .sort((a, b) => a.name.localeCompare(b.name));

  const sidebarClasses = `
    bg-card/95 backdrop-blur-md border-border transition-all duration-500 ease-out z-40 flex flex-col
    fixed bottom-0 left-0 right-0 h-2/5 rounded-t-3xl border-t shadow-2xl
    md:h-full md:relative md:w-80 md:border-t-0 md:border-r md:rounded-t-none md:shadow-xl
    ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
  `;

  // Визначаємо, який список аніме відображати: результати пошуку або вже відкриті
  const currentAnimeDisplayList = searchTerm.trim() !== '' ? searchAnimeResults : discoveredAnimeElements;

  return (
    <aside className={sidebarClasses}>
      {/* Enhanced header */}
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
              onClick={() => { setActiveTab('base'); setSearchTerm(''); }} // Очищаємо пошук при зміні вкладки
              className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                activeTab === 'base'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Базові ({baseElements.length})
            </button>
            <button
              onClick={() => { setActiveTab('anime'); setSearchTerm(''); }} // Очищаємо пошук при зміні вкладки
              className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                activeTab === 'anime'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Аніме ({discoveredAnimeElements.length}) {/* Все ще показуємо кількість відкритих аніме */}
            </button>
          </div>
        </div>

        {/* Enhanced search for anime tab */}
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
            {isSearching && searchTerm.trim() !== '' && ( // Показуємо спіннер завантаження, якщо йде пошук і є запит
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            )}
            {!isSearching && searchTerm.trim() !== '' && ( // Показуємо кнопку очищення, якщо не шукаємо і є запит
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

      {/* Enhanced content area */}
      <div className="flex-grow overflow-hidden">
        {activeTab === 'base' ? (
          <div className="p-4 h-full overflow-y-auto">
            {baseElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm text-center">Базові елементи з'являться тут</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-3 gap-3">
                {baseElements.map(element => (
                  <DraggableElement key={element.uniqueId} element={element} />
                ))}
              </div>
            )}
          </div>
        ) : ( /* Вміст вкладки "Аніме" */
          <div className="p-4 h-full overflow-y-auto">
            {isSearching && searchTerm.trim() !== '' ? ( // Індикатор пошуку
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
                    <p className="text-sm text-center">Пошук аніме...</p>
                </div>
            ) : currentAnimeDisplayList.length === 0 ? ( // Немає результатів або немає відкритих аніме
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Search className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm text-center">
                  {searchTerm.trim() ? "Нічого не знайдено за вашим запитом" : "Відкрийте аніме, поєднуючи елементи або шукайте нові!"}
                </p>
              </div>
            ) : ( // Відображення аніме елементів
              <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                {currentAnimeDisplayList.map(element => (
                  <DraggableElement key={element.uniqueId} element={element} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}