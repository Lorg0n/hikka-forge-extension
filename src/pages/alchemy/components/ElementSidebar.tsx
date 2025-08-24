import React from 'react';
import { GameElement } from '../data/elements';
import { DraggableElement } from './DraggableElement';
import clsx from 'clsx'; // A utility for conditional classes, run `npm install clsx`

interface ElementSidebarProps {
  discoveredElements: GameElement[];
  isOpen: boolean; // Prop to control visibility on mobile
}

export function ElementSidebar({ discoveredElements, isOpen }: ElementSidebarProps) {
  const sidebarClasses = clsx(
    // Base styles for both mobile and desktop
    "p-4 overflow-y-auto bg-card border-border transition-transform duration-300 ease-in-out z-40",
    // Mobile styles (bottom drawer)
    "fixed bottom-0 left-0 right-0 h-2/5 rounded-t-2xl border-t-2 md:h-full md:relative md:w-64 md:border-t-0 md:border-r md:rounded-t-none",
    // Conditional visibility on mobile
    {
      "translate-y-0": isOpen,
      "translate-y-full md:translate-y-0": !isOpen,
    }
  );

  return (
    <aside className={sidebarClasses}>
      <h2 className="text-lg font-bold mb-4 text-center md:text-left">
        Відкриті елементи ({discoveredElements.length})
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-3 gap-2">
        {discoveredElements.map(element => (
          <DraggableElement key={element.id} element={element} />
        ))}
      </div>
    </aside>
  );
}