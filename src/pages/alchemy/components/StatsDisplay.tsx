import React from 'react';

interface StatsDisplayProps {
  combinations: number;
  discoveries: number;
}

export function StatsDisplay({ combinations, discoveries }: StatsDisplayProps) {
  return (
    <div className="flex gap-4 ml-8">
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 hover:bg-card/70 transition-all duration-200">
        <div className="text-xs text-muted-foreground">Поєднання</div>
        <div className="text-lg font-bold text-primary tabular-nums">{combinations}</div>
      </div>
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 hover:bg-card/70 transition-all duration-200">
        <div className="text-xs text-muted-foreground">Відкриття</div>
        <div className="text-lg font-bold text-primary tabular-nums">{discoveries}</div>
      </div>
    </div>
  );
}