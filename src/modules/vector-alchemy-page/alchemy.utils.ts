import type {
  AlchemyCatalogItem,
  AlchemyElement,
  AlchemyHistoryItem,
  AlchemyIngredient,
  AlchemyResult,
  AlchemySourceType,
} from "@/services/alchemyService";
import type { BoardCard, PaletteObject } from "./alchemy.types";

const ALCHEMY_DISCOVERIES_STORAGE_KEY = "hikka-forge:alchemy:discoveries";

const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export const asIngredient = (card: BoardCard): AlchemyIngredient =>
  card.type === "element"
    ? { type: "element", id: Number(card.sourceId), weight: card.sign }
    : { type: card.type, slug: String(card.sourceId), weight: card.sign };

type ContentSourceType = Extract<AlchemySourceType, "anime" | "manga">;

const isContentCard = (
  item: Pick<PaletteObject, "type">,
): item is Pick<PaletteObject, "type"> & { type: ContentSourceType } =>
  item.type === "anime" || item.type === "manga";

export const historyForPaletteItem = (
  item: PaletteObject,
): AlchemyHistoryItem[] =>
  isContentCard(item)
    ? [{ type: item.type, slug: String(item.sourceId) }]
    : [];

export const asCraftIngredients = (
  first: BoardCard,
  second: BoardCard,
): [AlchemyIngredient, AlchemyIngredient] => {
  const firstIsContent = isContentCard(first);
  const secondIsContent = isContentCard(second);
  const isElementAndContent =
    (first.type === "element" && secondIsContent) ||
    (second.type === "element" && firstIsContent);

  if (!isElementAndContent) return [asIngredient(first), asIngredient(second)];

  return [
    asIngredient(first),
    asIngredient(second),
  ].map((ingredient, index) => {
    const card = index === 0 ? first : second;
    const weight = isContentCard(card) ? 0.8 : 0.25;
    return { ...ingredient, weight: card.sign * weight };
  }) as [AlchemyIngredient, AlchemyIngredient];
};

export const isInvalidCombination = (
  first: BoardCard,
  second: BoardCard,
): boolean => {
  const isSameIngredient =
    first.type === second.type &&
    String(first.sourceId) === String(second.sourceId);

  if (!isSameIngredient) return false;

  return first.sign !== second.sign || first.type === "element";
};

export const paletteFromElement = (element: AlchemyElement): PaletteObject => ({
  id: element.id,
  paletteId: `element:${element.id}`,
  type: "element",
  origin: "basic",
  sourceId: element.id,
  title: element.name,
  subtitle: element.description,
  imageUrl: element.imageUrl,
});

export const paletteFromResult = (result: AlchemyResult): PaletteObject => ({
  id: result.slug,
  paletteId: `${result.contentType}:${result.slug}`,
  type: result.contentType,
  origin: "discovered",
  sourceId: result.slug,
  title: result.title,
  subtitle: [result.year, result.mediaType].filter(Boolean).join(" • "),
  imageUrl: result.imageUrl,
});

export const mergeAlchemyHistory = (
  ...histories: AlchemyHistoryItem[][]
): AlchemyHistoryItem[] => {
  const unique = new Map<string, AlchemyHistoryItem>();
  histories.flat().forEach((item) => {
    const key = `${item.type}:${item.slug}`;
    unique.delete(key);
    unique.set(key, item);
  });
  return Array.from(unique.values()).slice(-200);
};

export const paletteFromCatalog = (
  item: AlchemyCatalogItem,
): PaletteObject => ({
  id: item.slug,
  paletteId: `${item.type}:${item.slug}`,
  type: item.type,
  origin: "catalog",
  sourceId: item.slug,
  title: item.titleEn || item.titleNative || item.slug,
  subtitle: [item.year, item.mediaType].filter(Boolean).join(" • "),
  imageUrl: item.imageUrl,
});

export const cardFromPalette = (
  item: PaletteObject,
  x: number,
  y: number,
  history: AlchemyHistoryItem[] = historyForPaletteItem(item),
): BoardCard => ({ ...item, instanceId: makeId(), x, y, sign: 1, history });

export const cardFromResult = (
  result: AlchemyResult,
  x: number,
  y: number,
  history = historyForPaletteItem(paletteFromResult(result)),
): BoardCard => cardFromPalette(paletteFromResult(result), x, y, history);

export function loadAlchemyDiscoveries(): PaletteObject[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(
      window.sessionStorage.getItem(ALCHEMY_DISCOVERIES_STORAGE_KEY) || "[]",
    );
    if (!Array.isArray(value)) return [];
    const discoveries = value.flatMap((item): PaletteObject[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<PaletteObject>;
      if (
        (candidate.type !== "anime" && candidate.type !== "manga") ||
        typeof candidate.sourceId !== "string" ||
        typeof candidate.title !== "string"
      ) {
        return [];
      }
      const slug = candidate.sourceId;
      return [{
        id: slug,
        paletteId: `${candidate.type}:${slug}`,
        type: candidate.type,
        origin: "discovered",
        sourceId: slug,
        title: candidate.title,
        subtitle: typeof candidate.subtitle === "string" ? candidate.subtitle : null,
        imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : null,
      }];
    });
    return Array.from(
      new Map(discoveries.map((item) => [item.paletteId, item])).values(),
    );
  } catch {
    return [];
  }
}

export function saveAlchemyDiscoveries(items: PaletteObject[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      ALCHEMY_DISCOVERIES_STORAGE_KEY,
      JSON.stringify(
        items
          .filter(
            (item) =>
              item.origin === "discovered" &&
              (item.type === "anime" || item.type === "manga"),
          )
          .map(({ id, paletteId, type, origin, sourceId, title, subtitle, imageUrl }) => ({
            id,
            paletteId,
            type,
            origin,
            sourceId,
            title,
            subtitle,
            imageUrl,
          })),
      ),
    );
  } catch {
    // Session storage can be unavailable in restricted browser contexts.
  }
}
