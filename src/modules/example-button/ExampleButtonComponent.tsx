
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun } from "lucide-react";

const ExampleButtonComponent: React.FC = () => {
  const handleClick = () => {
    alert('Hikka Forge Module Button Clicked!');
  };

  return (
    <div className="hikka-forge-module-container p-2 border border-dashed border-blue-500 rounded my-2 bg-background/80 backdrop-blur-sm">
      <Button variant="outline" size="sm" onClick={handleClick}>
        <Sun className="mr-2 h-4 w-4" />
        Forge Button
      </Button>
      <p className="text-xs text-muted-foreground mt-1">This is injected by Hikka Forge.</p>
    </div>
  );
};

export default ExampleButtonComponent;