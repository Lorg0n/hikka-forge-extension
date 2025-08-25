import React from 'react';
import { X, Menu } from 'lucide-react';

interface SidebarToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function SidebarToggle({ isOpen, onClick }: SidebarToggleProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-4 right-4 z-50 w-16 h-16 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-2xl"
      aria-label={isOpen ? 'Close Elements Panel' : 'Open Elements Panel'}
    >
      <div className={`transition-all duration-300 ${isOpen ? 'rotate-180 scale-110' : 'rotate-0'}`}>
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </div>
      {/* Floating animation ring */}
      <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse" />
    </button>
  );
}