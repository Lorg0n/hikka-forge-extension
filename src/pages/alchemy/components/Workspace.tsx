import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { GameElement } from '../data/elements';
import { DraggableElement } from './DraggableElement';

export interface WorkspaceElement extends GameElement {
  instanceId: string;
  position: { x: number; y: number };
}

interface WorkspaceProps {
  elements: WorkspaceElement[];
}

export const Workspace = React.forwardRef<HTMLDivElement, WorkspaceProps>(({ elements }, ref) => {
  const { setNodeRef } = useDroppable({
    id: 'workspace'
  });

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <div 
      ref={setRefs} 
      className="relative flex-1 h-full bg-background border-2 border-dashed border-border rounded-lg min-h-96"
    >
      {elements.map(element => (
        <div 
          key={element.instanceId} 
          style={{ 
            position: 'absolute', 
            left: Math.max(0, element.position.x), 
            top: Math.max(0, element.position.y) 
          }}
        >
          <DraggableElement element={element} />
        </div>
      ))}
    </div>
  );
});