import type { ForgeModuleDef } from "@/types/module";

import ThematicEffectsComponent from "./ThematicEffectsComponent";
import { THEMATIC_EFFECTS } from "./effects";

const MANUAL_SELECTION_SETTING_ID = "manualEffectId";
const AUTOMATIC_SELECTION = "automatic";

function calendarEnabledSettingId(effectId: string): string {
  return `calendarEnabled_${effectId}`;
}

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
  thematicSchedule: {
    manualSelectionSettingId: MANUAL_SELECTION_SETTING_ID,
    automaticValue: AUTOMATIC_SELECTION,
    items: THEMATIC_EFFECTS.map((effect) => ({
      id: effect.id,
      label: effect.name,
      scheduleLabel: effect.scheduleLabel,
      calendarEnabledSettingId: calendarEnabledSettingId(effect.id),
    })),
  },
  getActiveThematicItemIds: () => {
    const now = new Date();
    return THEMATIC_EFFECTS.filter((effect) => effect.isActive(now)).map(({ id }) => id);
  },
  settings: [
    {
      id: MANUAL_SELECTION_SETTING_ID,
      label: "Ручний вибір ефекту",
      type: "select",
      defaultValue: AUTOMATIC_SELECTION,
      options: [
        { value: AUTOMATIC_SELECTION, label: "За календарем" },
        ...THEMATIC_EFFECTS.map((effect) => ({ value: effect.id, label: effect.name })),
      ],
    },
    ...THEMATIC_EFFECTS.map((effect) => ({
      id: calendarEnabledSettingId(effect.id),
      label: `Включати ${effect.name} за календарем`,
      type: "toggle" as const,
      defaultValue: true,
    })),
  ],
  icon: {
    name: "fe:birthday-cake",
    color: "#c084fc",
  },
};

export default thematicEffectsModule;
