// File: /home/lorgon/hikka-forge-extension/src/pages/alchemy/components/DraggableElement.tsx
import React, { memo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Sparkles } from 'lucide-react';
import { DraggableItem, CombinationTarget } from '@/types';

interface DraggableElementProps {
  element: DraggableItem & { instanceId?: string };
  isOverlay?: boolean;
  combinationTarget?: CombinationTarget | null;
}

export const DraggableElement = memo(function DraggableElement({
  element, 
  isOverlay = false, 
  combinationTarget 
}: DraggableElementProps) {
  const idToUse = element.instanceId || element.uniqueId;
  
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
    id: idToUse,
    // --- ЗМІНА: Додаємо джерело перетягування ---
    data: { element, source: 'workspace' },
  });

  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: idToUse,
    data: { element },
  });

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const isAnime = element.type === 'anime';
  const isTargeted = combinationTarget?.id === idToUse;
  const isValidTarget = combinationTarget?.isValid;

  const containerClasses = `
    bg-card border border-border rounded-xl shadow-lg cursor-grab active:cursor-grabbing 
    touch-none select-none transition-all duration-300 ease-out transform
    hover:shadow-xl hover:scale-105 hover:-translate-y-1
    ${isDragging && !isOverlay ? 'opacity-0 scale-95' : ''} 
    ${isOverlay ? 'scale-110 shadow-2xl' : ''}
    ${isTargeted && isValidTarget ? 'ring-4 ring-primary ring-opacity-50 scale-110 shadow-primary/25 shadow-xl' : ''}
    ${isTargeted && !isValidTarget ? 'ring-4 ring-destructive ring-opacity-50 scale-95 shadow-destructive/25' : ''}
    ${isAnime ? 'group overflow-hidden backdrop-blur-sm' : ''}
  `;

  if (isAnime) {
    return (
      <div 
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={containerClasses}
        style={{ pointerEvents: isOverlay ? 'none' : 'auto' }}
        title={element.name}
      >
        <div className="relative w-24 h-32 text-white overflow-hidden">
          <div className="absolute inset-0 transform group-hover:scale-110 transition-transform duration-500">
            <img
              src={element.imageUrl || ''}
              alt={element.name}
              className="w-full h-full object-cover"
              draggable="false"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700" />
          <div className="absolute top-2 right-2 opacity-70">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-xs font-bold leading-tight line-clamp-2 drop-shadow-lg">
              {element.name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={containerClasses}
      style={{ pointerEvents: isOverlay ? 'none' : 'auto' }}
      title={element.name}
    >
      <div className="flex flex-col items-center justify-center w-20 h-20 p-2 group">
        <div className="w-12 h-12 flex items-center justify-center mb-1 relative">
          {element.imageUrl ? (
            <>
              <img
                src={element.imageUrl}
                alt={element.name}
                className="max-w-full max-h-full object-contain filter group-hover:brightness-110 transition-all duration-200"
                draggable="false"
              />
              <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </>
          ) : (
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">❓</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium truncate w-full text-center group-hover:text-foreground transition-colors duration-200">
          {element.name}
        </span>
      </div>
    </div>
  );
});