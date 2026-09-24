import HalloweenGhostsEffect from "./HalloweenGhostsEffect";

import type React from "react";

export interface ThematicEffect {
  id: string;
  name: string;
  Component: React.FC;
  /**
   * Effects can later use this to activate only during an event's date range.
   * The first effect deliberately remains active while the module is enabled.
   */
  isActive: (date: Date) => boolean;
}

export const THEMATIC_EFFECTS: readonly ThematicEffect[] = [
  {
    id: "halloween-ghosts",
    name: "Геловінські привиди",
    Component: HalloweenGhostsEffect,
    isActive: () => true,
  },
];
