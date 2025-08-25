import React, { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Sparkles } from 'lucide-react';
import { WorkspaceItem, CombinationTarget } from '@/types';
import { DraggableElement } from './DraggableElement';

interface WorkspaceProps {
  elements: WorkspaceItem[];
  combinationTarget: CombinationTarget | null;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const Workspace = React.forwardRef<HTMLDivElement, WorkspaceProps>(
  ({ elements, combinationTarget, panOffset, setPanOffset }, ref) => {
    const { setNodeRef } = useDroppable({ id: 'workspace' });
    
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });

    const setRefs = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const handlePanStart = (clientX: number, clientY: number) => {
      setIsPanning(true);
      setIsGrabbing(true);
      panStart.current = { x: clientX - panOffset.x, y: clientY - panOffset.y };
    };

    const handlePanMove = (clientX: number, clientY: number) => {
      if (!isPanning) return;
      setPanOffset({
        x: clientX - panStart.current.x,
        y: clientY - panStart.current.y,
      });
    };

    const handlePanEnd = () => {
      setIsPanning(false);
      setIsGrabbing(false);
    };

    // Enhanced grid with animated pattern
    const gridStyle: React.CSSProperties = {
      backgroundImage: `
        radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px, 50px 50px, 50px 50px',
      backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
    };

    return (
      <div
        ref={setRefs}
        className={`
          relative flex-1 h-full bg-gradient-to-br from-background via-background to-muted/20 
          rounded-2xl overflow-hidden border border-border/50 shadow-inner
          ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}
          transition-all duration-200
        `}
        style={gridStyle}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) handlePanStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => handlePanMove(e.clientX, e.clientY)}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={(e) => {
          if (e.target === e.currentTarget) {
            handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => handlePanMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePanEnd}
      >
        {/* Workspace hint overlay when empty */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="relative">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30 animate-pulse" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary/10 rounded-full animate-ping" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground/70 mb-2">
                Перетягніть елементи сюди
              </h3>
              <p className="text-sm text-muted-foreground/50">
                Поєднуйте різні типи елементів, щоб відкривати нові аніме!
              </p>
            </div>
          </div>
        )}

        {/* Enhanced elements with stagger animation */}
        {elements.map((element, index) => (
          <div
            key={element.instanceId}
            className="absolute transition-all duration-200 ease-out"
            style={{
              left: `${element.position.x + panOffset.x}px`,
              top: `${element.position.y + panOffset.y}px`,
              animationDelay: `${index * 50}ms`,
            }}
          >
            <DraggableElement element={element} combinationTarget={combinationTarget} />
          </div>
        ))}
      </div>
    );
  }
);