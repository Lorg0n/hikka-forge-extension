import HalloweenGhostsEffect from "./HalloweenGhostsEffect";

import type React from "react";

export interface ThematicEffect {
  id: string;
  name: string;
  scheduleLabel: string;
  Component: React.FC;
  /** Whether the effect should be active on the given date. */
  isActive: (date: Date) => boolean;
}

function isHalloweenPeriod(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 9 && day >= 14) || (month === 10 && day <= 3);
}

export const THEMATIC_EFFECTS: readonly ThematicEffect[] = [
  {
    id: "halloween-ghosts",
    name: "Геловінські привиди",
    scheduleLabel: "14 жовтня — 3 листопада",
    Component: HalloweenGhostsEffect,
    isActive: isHalloweenPeriod,
  },
];
