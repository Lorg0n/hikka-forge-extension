import React from 'react';
import { GameElement } from '../data/elements';
import { DraggableElement } from './DraggableElement';

interface ElementSidebarProps {
  discoveredElements: GameElement[];
}

export function ElementSidebar({ discoveredElements }: ElementSidebarProps) {
  return (
    <aside className="w-64 h-full p-4 overflow-y-auto bg-muted/50 border-r border-border">
      <h2 className="text-lg font-bold mb-4">Відкриті елементи ({discoveredElements.length})</h2>
      <div className="grid grid-cols-3 gap-2">
        {discoveredElements.map(element => (
          <DraggableElement key={element.id} element={element} />
        ))}
      </div>
    </aside>
  );
}