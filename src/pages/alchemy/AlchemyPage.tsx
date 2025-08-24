import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
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

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

function AlchemyPage() {
  const [discoveredElements, setDiscoveredElements] = useState<GameElement[]>(() =>
    STARTER_ELEMENTS_IDS.map(id => ELEMENTS[id])
  );
  const [workspaceElements, setWorkspaceElements] = useState<WorkspaceElement[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeElement, setActiveElement] = useState<GameElement | null>(null);

  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveElement(event.active.data.current?.element as GameElement);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveElement(null);
    const { active, over, delta } = event;
    const activeElData = active.data.current?.element as GameElement;

    if (!activeElData) {
      return;
    }

    const isFromWorkspace = workspaceElements.some(el => el.instanceId === active.id);

    // Case 1: Combination attempt (dropping on another element)
    if (over && over.data.current?.element && active.id !== over.id) {
      const targetElData = over.data.current.element as GameElement;
      const recipeKey = [activeElData.id, targetElData.id].sort().join('+');
      const resultId = RECIPES[recipeKey];
      
      if (resultId && ELEMENTS[resultId]) {
        const resultElement = ELEMENTS[resultId];
        
        // Remove both elements that were combined
        setWorkspaceElements(prev => prev.filter(el => 
          el.instanceId !== active.id && el.instanceId !== over.id
        ));
        
        // Calculate position for new element based on where the drag ended
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        const activeRect = event.active.rect.current.translated;
        
        let newPosition = { x: 100, y: 100 };
        
        if (workspaceRect && activeRect) {
          newPosition = {
            x: Math.max(0, activeRect.left - workspaceRect.left),
            y: Math.max(0, activeRect.top - workspaceRect.top)
          };
        }

        const newWorkspaceElement: WorkspaceElement = {
          ...resultElement,
          instanceId: generateId(),
          position: newPosition
        };
        
        setWorkspaceElements(prev => [...prev, newWorkspaceElement]);

        if (!discoveredElements.find(el => el.id === resultId)) {
          setDiscoveredElements(prev => [...prev, resultElement]);
          showNotification(`Нове відкриття! Знайдено: ${resultElement.name}`);
        }
        return;
      }
    }
    
    // Case 2: Moving an existing element on the workspace
    if (isFromWorkspace) {
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

    // Case 3: Adding new element from sidebar to workspace
    if (over && (over.id === 'workspace' || workspaceElements.some(el => el.instanceId === over.id)) && workspaceRef.current) {
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
          <Workspace ref={workspaceRef} elements={workspaceElements} />
        </main>

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