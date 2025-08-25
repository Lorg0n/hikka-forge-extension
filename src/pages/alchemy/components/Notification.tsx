import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose?: () => void;
}

export function Notification({ message, type, onClose }: NotificationProps) {
  return (
    <div className={`
      fixed bottom-24 right-5 md:bottom-5 p-4 rounded-xl shadow-2xl z-50 max-w-sm
      backdrop-blur-md border transition-all duration-500 transform
      ${type === 'success' 
        ? 'bg-primary/90 text-primary-foreground border-primary/20' 
        : 'bg-destructive/90 text-destructive-foreground border-destructive/20'
      }
      animate-in slide-in-from-right-5 fade-in
    `}>
      <div className="flex items-start gap-3">
        {type === 'success' ? (
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />
        ) : (
          <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
        )}
        <p className="text-sm font-medium leading-relaxed">
          {message}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-white/10 rounded transition-colors duration-200"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}