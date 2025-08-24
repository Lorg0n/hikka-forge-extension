import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { GameElement } from '../data/elements';

// NEW: Тип для пропса
interface CombinationTarget {
  id: string;
  isValid: boolean;
}

interface DraggableElementProps {
  element: GameElement & { instanceId?: string };
  isOverlay?: boolean;
  combinationTarget?: CombinationTarget | null; // NEW: Додаємо опціональний пропс
}

export function DraggableElement({ 
  element, 
  isOverlay = false, 
  combinationTarget 
}: DraggableElementProps) {
  const idToUse = element.instanceId || element.id;

  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
    id: idToUse,
    data: { element },
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: idToUse,
    data: { element },
  });

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  // FIX: Ми більше не використовуємо opacity в інлайн-стилях для цього.
  // Залишаємо лише pointerEvents для DragOverlay.
  const style: React.CSSProperties = {
    pointerEvents: isOverlay ? 'none' : 'auto',
  };

  const isTarget = combinationTarget?.id === idToUse;
  let highlightClass = '';

  if (isTarget) {
    // Використовуємо семантичні кольори, як ви просили
    // `ring-primary` для успіху (зазвичай зелений/синій)
    // `ring-destructive` для невдачі (зазвичай червоний)
    highlightClass = combinationTarget.isValid
      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      : 'ring-2 ring-destructive ring-offset-2 ring-offset-background';
  }

  // Базові класи для елемента
  const baseClasses = "flex flex-col items-center justify-center p-2 text-center bg-card border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing touch-none select-none w-16 h-16 transition-opacity";

  // Динамічно додаємо клас 'invisible' якщо елемент перетягується (і це не оверлей)
  const dynamicClasses = isDragging && !isOverlay ? 'invisible' : 'visible';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${baseClasses} ${dynamicClasses} ${highlightClass}`}
    >
      <span className="text-lg pointer-events-none">{element.emoji}</span>
      <span className="text-xs text-muted-foreground pointer-events-none truncate w-full">{element.name}</span>
    </div>
  );
}