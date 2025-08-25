// File: /home/lorgon/hikka-forge-extension/src/pages/alchemy/components/SidebarDraggableItem.tsx
import React, { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { DraggableItem } from '@/types';

interface SidebarDraggableItemProps {
  element: DraggableItem;
}

export const SidebarDraggableItem = memo(function SidebarDraggableItem({ element }: SidebarDraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: element.uniqueId,
    data: { element },
  });

  const isAnime = element.type === 'anime';

  // --- FIX: Added 'touch-action-pan-y' for mobile scroll and changed dragging style to 'invisible' ---
  const style = `
    relative flex flex-col items-center justify-center p-1 bg-card border border-border 
    rounded-lg shadow-sm aspect-square cursor-grab active:cursor-grabbing 
    select-none overflow-hidden touch-action-pan-y
    transition-all duration-200 ease-out transform
    hover:bg-muted hover:shadow-md hover:scale-105
    ${isDragging ? 'invisible' : ''} 
  `;

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={style} title={element.name}>
      <div className={`w-10 h-10 flex items-center justify-center mb-1 ${isAnime ? 'w-full h-full absolute inset-0' : ''}`}>
        {element.imageUrl ? (
          <img
            src={element.imageUrl}
            alt={element.name}
            className={`${isAnime ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'}`}
            draggable="false"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl">❓</span>
        )}
      </div>
      <span className={`text-xs font-medium text-center w-full truncate ${isAnime ? 'absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-white leading-tight' : 'text-muted-foreground'}`}>
        {element.name}
      </span>
    </div>
  );
});