import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { ElementSidebar } from './components/ElementSidebar';
import { Workspace, WorkspaceElement } from './components/Workspace';
import { GameElement, ELEMENTS } from './data/elements';
import { RECIPES } from './data/recipes';
import { generateId } from './utils';
import { DraggableElement } from './components/DraggableElement';

const STARTER_ELEMENTS_IDS = ['anime', 'shonen', 'shojo', 'isekai'];

// FIX: Перейменовано, щоб не конфліктувати зі станом
const defaultDropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

interface CombinationTarget {
  id: string;
  isValid: boolean;
}

function AlchemyPage() {
  const [discoveredElements, setDiscoveredElements] = useState<GameElement[]>(() =>
    STARTER_ELEMENTS_IDS.map(id => ELEMENTS[id])
  );
  const [workspaceElements, setWorkspaceElements] = useState<WorkspaceElement[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<GameElement | null>(null);
  const [combinationTarget, setCombinationTarget] = useState<CombinationTarget | null>(null);

  // FIX: Стан для динамічного керування анімацією
  const [dropAnimation, setDropAnimation] = useState<DropAnimation | null>(defaultDropAnimation);

  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    // FIX: Завжди встановлюємо анімацію за замовчуванням на початку
    setDropAnimation(defaultDropAnimation);
    setActiveElement(event.active.data.current?.element as GameElement);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setCombinationTarget(null);
      return;
    }

    const activeEl = active.data.current?.element as GameElement;
    const overEl = over.data.current?.element as GameElement;
    const isTargetOnWorkspace = workspaceElements.some(el => el.instanceId === over.id);

    if (activeEl && overEl && isTargetOnWorkspace) {
      const recipeKey = [activeEl.id, overEl.id].sort().join('+');
      const resultId = RECIPES[recipeKey];
      setCombinationTarget({ id: over.id as string, isValid: !!resultId });
    } else {
      setCombinationTarget(null);
    }
  }, [workspaceElements]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setCombinationTarget(null);
    setActiveElement(null);
    const { active, over, delta } = event;
    const activeElData = active.data.current?.element as GameElement;

    if (!activeElData) {
      return;
    }

    const isFromWorkspace = workspaceElements.some(el => el.instanceId === active.id);
    const isTargetOnWorkspace = over ? workspaceElements.some(el => el.instanceId === over.id) : false;

    // Case 1: Combination attempt
    if (over && over.data.current?.element && active.id !== over.id && isTargetOnWorkspace) {
      const targetElData = over.data.current.element as GameElement;
      const recipeKey = [activeElData.id, targetElData.id].sort().join('+');
      const resultId = RECIPES[recipeKey];
      
      if (resultId && ELEMENTS[resultId]) {
        // FIX: Успішна дія! Вимикаємо анімацію повернення.
        setDropAnimation(null);
        
        const resultElement = ELEMENTS[resultId];
        
        setWorkspaceElements(prev => prev.filter(el => 
          el.instanceId !== active.id && el.instanceId !== over.id
        ));
        
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        const activeRect = event.active.rect.current.translated;
        let newPosition = { x: 100, y: 100 };
        if (workspaceRect && activeRect) {
          newPosition = {
            x: Math.max(0, activeRect.left - workspaceRect.left),
            y: Math.max(0, activeRect.top - workspaceRect.top)
          };
        }
        const newWorkspaceElement: WorkspaceElement = { ...resultElement, instanceId: generateId(), position: newPosition };
        setWorkspaceElements(prev => [...prev, newWorkspaceElement]);

        if (!discoveredElements.find(el => el.id === resultId)) {
          setDiscoveredElements(prev => [...prev, resultElement]);
          showNotification(`Нове відкриття! Знайдено: ${resultElement.name}`);
        }
        return;
      }
    }
    
    // Case 2: Moving an existing element
    if (isFromWorkspace) {
      // FIX: Успішна дія! Вимикаємо анімацію.
      setDropAnimation(null);
      setWorkspaceElements(prev => prev.map(el =>
        el.instanceId === active.id 
          ? { ...el, position: { 
              x: Math.max(0, el.position.x + delta.x), 
              y: Math.max(0, el.position.y + delta.y) 
            } } 
          : el
      ));
      return;
    }

    // Case 3: Adding new element
    if (over && (over.id === 'workspace' || isTargetOnWorkspace) && workspaceRef.current) {
      // FIX: Успішна дія! Вимикаємо анімацію.
      setDropAnimation(null);
      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      const activeRect = event.active.rect.current.translated;
      
      if (activeRect) {
        const newElement: WorkspaceElement = {
          ...activeElData,
          instanceId: generateId(),
          position: { 
            x: Math.max(0, activeRect.left - workspaceRect.left), 
            y: Math.max(0, activeRect.top - workspaceRect.top) 
          }
        };
        setWorkspaceElements(prev => [...prev, newElement]);
      }
    }
  }, [workspaceElements, discoveredElements]);

  const clearWorkspace = () => setWorkspaceElements([]);

  return (
    <DndContext 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setCombinationTarget(null)}
    >
      <div className="flex h-screen bg-background text-foreground font-sans">
        <ElementSidebar discoveredElements={discoveredElements} />
        
        <main className="flex flex-col flex-1 p-4">
          <header className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Hikka Alchemy</h1>
              <p className="text-muted-foreground">Поєднуйте елементи, щоб відкривати нові!</p>
            </div>
            <button 
              onClick={clearWorkspace} 
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
            >
              Очистити поле
            </button>
          </header>
          <Workspace ref={workspaceRef} elements={workspaceElements} combinationTarget={combinationTarget}/>
        </main>

        {/* FIX: Використовуємо стан для керування анімацією */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeElement ? <DraggableElement element={activeElement} isOverlay /> : null}
        </DragOverlay>

        {notification && (
          <div className="fixed bottom-5 right-5 p-4 bg-primary text-primary-foreground rounded-lg shadow-lg animate-pulse">
            {notification}
          </div>
        )}
      </div>
    </DndContext>
  );
}

export default AlchemyPage;