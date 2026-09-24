import HalloweenGhostsEffect from "./HalloweenGhostsEffect";

import type React from "react";

export interface ThematicEffect {
  id: string;
  name: string;
  Component: React.FC;
  /** Whether the effect should be active on the given date. */
  isActive: (date: Date) => boolean;
}

function isHalloweenPeriod(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 9 && day >= 30) || (month === 10 && day <= 1);
}

export const THEMATIC_EFFECTS: readonly ThematicEffect[] = [
  {
    id: "halloween-ghosts",
    name: "Геловінські привиди",
    Component: HalloweenGhostsEffect,
    isActive: isHalloweenPeriod,
  },
];
