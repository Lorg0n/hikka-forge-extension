import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { GameElement } from '../data/elements';
// Для зручного об'єднання класів можна використати утиліту, але тут вистачить і простого рядка
// import clsx from 'clsx'; 

interface DraggableElementProps {
  element: GameElement & { instanceId?: string };
  isOverlay?: boolean;
}

export function DraggableElement({ element, isOverlay = false }: DraggableElementProps) {
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
      className={`${baseClasses} ${dynamicClasses}`}
    >
      <span className="text-lg pointer-events-none">{element.emoji}</span>
      <span className="text-xs text-muted-foreground pointer-events-none truncate w-full">{element.name}</span>
    </div>
  );
}