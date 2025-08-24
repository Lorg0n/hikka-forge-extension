import React from 'react';

interface SidebarToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function SidebarToggle({ isOpen, onClick }: SidebarToggleProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-4 right-4 z-50 w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
      aria-label={isOpen ? 'Close Elements Panel' : 'Open Elements Panel'}
    >
      <span className="text-3xl transform transition-transform duration-300 ease-in-out" style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}>
        ✨
      </span>
    </button>
  );
}