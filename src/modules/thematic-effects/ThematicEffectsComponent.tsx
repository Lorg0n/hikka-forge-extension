import { THEMATIC_EFFECTS } from "./effects";
import type { ModuleComponentProps } from "@/types/module";

const MANUAL_SELECTION_SETTING_ID = "manualEffectId";
const AUTOMATIC_SELECTION = "automatic";

function calendarEnabledSettingId(effectId: string): string {
  return `calendarEnabled_${effectId}`;
}

export default function ThematicEffectsComponent({ settings }: ModuleComponentProps) {
  const now = new Date();
  const manualSelection = settings[MANUAL_SELECTION_SETTING_ID];
  const selectedEffects =
    typeof manualSelection === "string" && manualSelection !== AUTOMATIC_SELECTION
      ? THEMATIC_EFFECTS.filter((effect) => effect.id === manualSelection)
      : THEMATIC_EFFECTS.filter(
          (effect) =>
            settings[calendarEnabledSettingId(effect.id)] !== false && effect.isActive(now),
        );

  return (
    <>
      {selectedEffects.map(
        ({ Component, id }) => (
          <Component key={id} />
        ),
      )}
    </>
  );
}
