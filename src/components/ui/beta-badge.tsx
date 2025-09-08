import React from "react";
import { Badge } from "@/components/ui/badge";

interface BetaBadgeProps {
  className?: string;
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({ className = "" }) => {
  return (
    <Badge 
      variant="secondary" 
      className={`bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800 font-medium ${className}`}
    >
      🛠️ Beta
    </Badge>
  );
};
