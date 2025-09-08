import React from "react";
import { Badge } from "@/components/ui/badge";

interface BetaBadgeProps {
  className?: string;
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({ className = "" }) => {
  return (
    <Badge 
      variant="secondary">
        Beta
    </Badge>
  );
};
