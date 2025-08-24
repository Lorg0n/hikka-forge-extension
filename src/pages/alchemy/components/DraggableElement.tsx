import React from 'react';
// Додано useDroppable
import { useDraggable, useDroppable } from '@dnd-kit/core'; 
import { GameElement } from '../data/elements';

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

  // FIX: Ось головне виправлення. Робимо елемент ціллю для скидання.
  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: idToUse,
    data: { element }, // Передаємо дані, щоб знати, НА ЩО ми кинули
  });

  // Об'єднуємо ref від обох хуків
  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style: React.CSSProperties = {
    opacity: isDragging && !isOverlay ? 0.5 : 1,
    pointerEvents: isOverlay ? 'none' : 'auto',
  };

  return (
    <div
      ref={setNodeRef} // Використовуємо об'єднаний ref
      style={style}
      {...listeners}
      {...attributes}
      className="flex flex-col items-center justify-center p-2 text-center bg-card border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing touch-none select-none w-16 h-16"
    >
      <span className="text-lg pointer-events-none">{element.emoji}</span>
      <span className="text-xs text-muted-foreground pointer-events-none truncate w-full">{element.name}</span>
    </div>
  );
}