import React, { useState, useRef, MouseEvent, TouchEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DraggableElement } from './DraggableElement';
import { GameElement } from '../data/elements';
import clsx from 'clsx';

interface CombinationTarget {
  id: string;
  isValid: boolean;
}

export interface WorkspaceElement extends GameElement {
  instanceId: string;
  position: { x: number; y: number };
}

interface WorkspaceProps {
  elements: WorkspaceElement[];
  combinationTarget: CombinationTarget | null;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const Workspace = React.forwardRef<HTMLDivElement, WorkspaceProps>(
  ({ elements, combinationTarget, panOffset, setPanOffset }, ref) => {
    const { setNodeRef } = useDroppable({ id: 'workspace' });

    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const [isGrabbing, setIsGrabbing] = useState(false);

    const setRefs = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const handlePanStart = (clientX: number, clientY: number) => {
      isPanning.current = true;
      setIsGrabbing(true);
      panStart.current = { x: clientX - panOffset.x, y: clientY - panOffset.y };
    };
    
    const handlePanMove = (clientX: number, clientY: number) => {
      if (!isPanning.current) return;
      setPanOffset({
        x: clientX - panStart.current.x,
        y: clientY - panStart.current.y,
      });
    };
    
    const handlePanEnd = () => {
      isPanning.current = false;
      setIsGrabbing(false);
    };

    const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) handlePanStart(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent<HTMLDivElement>) => handlePanMove(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => handlePanMove(e.touches[0].clientX, e.touches[0].clientY);

    // FIX: Покращений фон "Карта Світу" з кількома шарами
    const gridStyle: React.CSSProperties = {
      // Кілька фонових зображень накладаються одне на одне
      backgroundImage: `
        linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
      // Розміри для кожної сітки, що відповідають порядку в backgroundImage
      backgroundSize: `
        100px 100px,
        100px 100px,
        25px 25px,
        25px 25px,
        100% 100%
      `,
      // Динамічна позиція, що створює ефект руху
      backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
    };

    return (
      <div
        ref={setRefs}
        className={clsx(
            "relative flex-1 h-full bg-background rounded-lg overflow-hidden",
            isGrabbing ? "cursor-grabbing" : "cursor-grab"
        )}
        style={gridStyle} // <-- Застосовуємо наші нові стилі
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handlePanEnd}
      >
        {elements.map(element => (
          <div
            key={element.instanceId}
            style={{
              position: 'absolute',
              left: `${element.position.x + panOffset.x}px`,
              top: `${element.position.y + panOffset.y}px`,
            }}
          >
            <DraggableElement element={element} combinationTarget={combinationTarget} />
          </div>
        ))}
      </div>
    );
  }
);