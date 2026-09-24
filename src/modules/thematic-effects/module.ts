import type { ForgeModuleDef } from "@/types/module";

import ThematicEffectsComponent from "./ThematicEffectsComponent";

const thematicEffectsModule: ForgeModuleDef = {
  id: "thematic-effects",
  name: "Тематичні ефекти",
  description:
    "Додає святкові анімації до сайту. Наразі активні геловінські привиди.",
  urlPatterns: ["https://hikka.io/*", "https://dev.hikka.io/*"],
  enabledByDefault: true,
  // Effects stay mounted while navigating between Hikka's SPA pages.
  persistent: true,
  category: "appearance",
  elementSelector: {
    // Hikka replaces parts of <body> during SPA navigation. Mounting beside it
    // keeps the canvas and its animation loop alive between page transitions.
    selector: "html",
    position: "append",
    visibleOnly: false,
    hostWidth: "auto",
  },
  component: ThematicEffectsComponent,
  icon: {
    name: "fe:birthday-cake",
    color: "#c084fc",
  },
};

export default thematicEffectsModule;
