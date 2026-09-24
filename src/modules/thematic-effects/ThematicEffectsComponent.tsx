import { THEMATIC_EFFECTS } from "./effects";

export default function ThematicEffectsComponent() {
  const now = new Date();

  return (
    <>
      {THEMATIC_EFFECTS.filter((effect) => effect.isActive(now)).map(
        ({ Component, id }) => (
          <Component key={id} />
        ),
      )}
    </>
  );
}
