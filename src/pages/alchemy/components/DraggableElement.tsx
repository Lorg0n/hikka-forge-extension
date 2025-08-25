import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { DraggableItem, CombinationTarget } from '@/types'; // <-- UPDATED IMPORT

interface DraggableElementProps {
  element: DraggableItem & { instanceId?: string };
  isOverlay?: boolean;
  combinationTarget?: CombinationTarget | null;
}

// ... rest of the component code is identical to my previous answer
export function DraggableElement({ 
  element, 
  isOverlay = false, 
  combinationTarget 
}: DraggableElementProps) {
  const idToUse = element.instanceId || element.uniqueId;

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

  const style: React.CSSProperties = {
    pointerEvents: isOverlay ? 'none' : 'auto',
  };

  const isTarget = combinationTarget?.id === idToUse;
  let highlightClass = '';
  if (isTarget) {
    highlightClass = combinationTarget.isValid
      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      : 'ring-2 ring-destructive ring-offset-2 ring-offset-background';
  }

  const baseClasses = "flex flex-col items-center justify-center p-1 text-center bg-card border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing touch-none select-none w-16 h-16 transition-all duration-150";
  const dynamicClasses = isDragging && !isOverlay ? 'invisible' : 'visible';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${baseClasses} ${dynamicClasses} ${highlightClass}`}
      title={element.name}
    >
      <div className="w-10 h-10 flex items-center justify-center pointer-events-none">
          {element.imageUrl ? (
            <img 
              src={element.imageUrl} 
              alt={element.name} 
              className="max-w-full max-h-full object-contain rounded-sm"
              draggable="false"
            />
          ) : (
            <span className="text-2xl">?</span>
          )}
      </div>
      <span className="text-xs text-muted-foreground pointer-events-none truncate w-full mt-1">
        {element.name}
      </span>
    </div>
  );
}