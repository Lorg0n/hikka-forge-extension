import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ChromeExtensionPortalProps {
  children: React.ReactNode;
}

/**
 * Custom portal component for Chrome extensions that handles positioning correctly
 * in extension contexts where regular portals might have positioning issues
 */
export const ChromeExtensionPortal: React.FC<ChromeExtensionPortalProps> = ({ children }) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create a portal container specifically for dialogs in Chrome extensions
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);

  if (!portalContainer) {
    return null;
  }

  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      {children}
    </div>,
    portalContainer
  );
};
