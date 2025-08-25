// File: /home/lorgon/hikka-forge-extension/src/pages/alchemy/AlchemyPage.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay,
  DropAnimation, defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { ElementSidebar } from './components/ElementSidebar';
import { Workspace } from './components/Workspace';
import { SidebarToggle } from './components/SidebarToggle';
import { DraggableElement } from './components/DraggableElement';
import { Notification } from './components/Notification';
import { DraggableItem, WorkspaceItem, CombinationTarget, AlchemyItem, AnimeItem, AnimeCombinationResultItem, AlchemyElementItem } from '@/types';
import { fetchAlchemyElements, combineItems } from '@/services/alchemyService';
import { generateId } from './utils';

// --- Mapper Functions ---
const mapApiElementToAlchemyItem = (apiElement: AlchemyElementItem): AlchemyItem => ({
  type: 'alchemy_element',
  id: apiElement.id,
  uniqueId: `element-${apiElement.id}`,
  name: apiElement.name,
  imageUrl: apiElement.imageUrl,
});

const mapApiAnimeToAnimeItem = (apiAnime: AnimeCombinationResultItem): AnimeItem => ({
  type: 'anime',
  slug: apiAnime.slug,
  uniqueId: `anime-${apiAnime.slug}`,
  name: apiAnime.titleEn || apiAnime.titleNative,
  imageUrl: apiAnime.imageUrl,
});

function AlchemyPage() {
  const [discoveredItems, setDiscoveredItems] = useState<DraggableItem[]>([]);
  const [workspaceElements, setWorkspaceElements] = useState<WorkspaceItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [activeElement, setActiveElement] = useState<DraggableItem | null>(null);
  const [combinationTarget, setCombinationTarget] = useState<CombinationTarget | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { content } = await fetchAlchemyElements();
        setDiscoveredItems(content.map(mapApiElementToAlchemyItem));
      } catch (error) {
        console.error(error);
        showNotification("Не вдалося завантажити елементи.", "error");
      }
    }
    loadInitialData();
  }, []);

  const defaultDropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const [dropAnimation, setDropAnimation] = useState<DropAnimation | null>(defaultDropAnimation);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDropAnimation(defaultDropAnimation);
    setActiveElement(event.active.data.current?.element as DraggableItem);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setCombinationTarget(null);
      return;
    }
    const activeEl = active.data.current?.element as DraggableItem;
    const overEl = over.data.current?.element as DraggableItem;
    const isTargetOnWorkspace = workspaceElements.some(el => el.instanceId === over.id);

    if (activeEl && overEl && isTargetOnWorkspace) {
      const isValid = (activeEl.type === 'anime' && overEl.type === 'anime') || (activeEl.type !== overEl.type);
      setCombinationTarget({ id: over.id as string, isValid });
    } else {
      setCombinationTarget(null);
    }
  }, [workspaceElements]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setCombinationTarget(null);
    setActiveElement(null);
    const { active, over } = event;
    const activeElData = active.data.current?.element as DraggableItem;

    if (!over || !activeElData) return;

    // --- ВИПРАВЛЕНА ЛОГІКА РОЗРАХУНКУ ПОЗИЦІЇ ---
    // Ця функція тепер працює коректно як для нових, так і для існуючих елементів,
    // навіть з трансформованим батьківським контейнером.
    const getCorrectedPosition = () => {
      const workspaceNode = workspaceRef.current;
      const overlayRect = active.rect.current.translated;

      if (!workspaceNode || !overlayRect) {
        // Запасний варіант, якщо щось піде не так
        const existingItem = workspaceElements.find(el => el.instanceId === active.id);
        return existingItem ? existingItem.position : { x: 100, y: 100 };
      }

      const workspaceRect = workspaceNode.getBoundingClientRect();

      // Розраховуємо локальну позицію, віднімаючи позицію робочої області та зсув панорамування
      // від абсолютної позиції перетягуваного елемента.
      return {
        x: overlayRect.left - workspaceRect.left - panOffset.x,
        y: overlayRect.top - workspaceRect.top - panOffset.y,
      };
    };

    const overInstance = workspaceElements.find(el => el.instanceId === over.id);

    // --- Логіка комбінації ---
    if (overInstance && active.id !== over.id) {
      const isValidCombination =
        (activeElData.type === 'anime' && overInstance.type === 'anime') ||
        (activeElData.type !== overInstance.type);

      if (!isValidCombination) {
        return;
      }

      try {
        setDropAnimation(null);
        const resultAnime = await combineItems(activeElData, overInstance);
        const newElement = mapApiAnimeToAnimeItem(resultAnime);

        setWorkspaceElements(prev => prev.filter(el => el.instanceId !== active.id && el.instanceId !== over.id));

        const newWorkspaceElement: WorkspaceItem = {
          ...newElement,
          instanceId: generateId(),
          position: overInstance.position
        };

        setWorkspaceElements(prev => [...prev, newWorkspaceElement]);

        if (!discoveredItems.find(el => el.uniqueId === newElement.uniqueId)) {
          setDiscoveredItems(prev => [...prev, newElement].sort((a, b) => a.name.localeCompare(b.name)));
          showNotification(`🎉 Нове відкриття! Знайдено: ${newElement.name}`, "success");
        } else {
          showNotification(`Створено: ${newElement.name}`, "success");
        }
        return; // Завершуємо виконання після комбінації
      } catch (error) {
        console.error(error);
        showNotification("Поєднання не вдалося.", "error");
        // Не повертаємо елемент на місце, щоб уникнути багів, просто нічого не робимо
        return;
      }
    }

    const isFromWorkspace = workspaceElements.some(el => el.instanceId === active.id);

    // --- Логіка переміщення або додавання елемента ---
    if (isFromWorkspace) {
      // Переміщення існуючого елемента
      setDropAnimation(null);
      setWorkspaceElements(prev => prev.map(el =>
        el.instanceId === active.id
          ? { ...el, position: getCorrectedPosition() }
          : el
      ));
      return;
    }

    if (over.id === 'workspace' || overInstance) {
      // Додавання нового елемента з бічної панелі
      setDropAnimation(null);
      const newWorkspaceElement: WorkspaceItem = { ...activeElData, instanceId: generateId(), position: getCorrectedPosition() };
      setWorkspaceElements(prev => [...prev, newWorkspaceElement]);

      if (!discoveredItems.some(el => el.uniqueId === activeElData.uniqueId)) {
        setDiscoveredItems(prev => [...prev, activeElData].sort((a, b) => a.name.localeCompare(b.name)));
        showNotification(`Новий елемент: ${activeElData.name} додано до ваших відкриттів!`, "success");
      }
    }

  }, [workspaceElements, discoveredItems, panOffset]);

  const clearWorkspace = () => {
    setWorkspaceElements([]);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={() => setCombinationTarget(null)}>
      <div className="flex flex-col md:flex-row h-screen bg-background text-foreground font-sans overflow-hidden">
        <ElementSidebar discoveredItems={discoveredItems} isOpen={isSidebarOpen} />
        <main className="flex flex-col flex-1 p-2 md:p-4 h-full">
          <header className="hidden md:flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Hikka Alchemy</h1>
              <p className="text-muted-foreground">Поєднуйте елементи, щоб відкривати нові!</p>
            </div>
            <button onClick={clearWorkspace} className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
              Очистити поле
            </button>
          </header>
          <Workspace ref={workspaceRef} elements={workspaceElements} combinationTarget={combinationTarget} panOffset={panOffset} setPanOffset={setPanOffset} />
        </main>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeElement ? <DraggableElement element={activeElement} isOverlay combinationTarget={combinationTarget} /> : null}
        </DragOverlay>
        <SidebarToggle isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(prev => !prev)} />
        {notification && (
          <Notification
            message={notification}
            type={notificationType}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </DndContext>
  );
}

export default AlchemyPage;