import type {
  AlchemyCatalogItem,
  AlchemyElement,
  AlchemyHistoryItem,
  AlchemyIngredient,
  AlchemyResult,
} from "@/services/alchemyService";
import type { BoardCard, PaletteObject } from "./alchemy.types";

const makeId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export const asIngredient = (card: BoardCard): AlchemyIngredient =>
  card.type === "element"
    ? { type: "element", id: Number(card.sourceId), weight: card.sign }
    : { type: card.type, slug: String(card.sourceId), weight: card.sign };

export const paletteFromElement = (element: AlchemyElement): PaletteObject => ({
  id: element.id,
  paletteId: `element:${element.id}`,
  type: "element",
  sourceId: element.id,
  title: element.name,
  subtitle: element.description,
  imageUrl: element.imageUrl,
});

export const paletteFromResult = (result: AlchemyResult): PaletteObject => ({
  id: result.slug,
  paletteId: `${result.contentType}:${result.slug}`,
  type: result.contentType,
  sourceId: result.slug,
  title: result.title,
  subtitle: [result.year, result.mediaType].filter(Boolean).join(" • "),
  imageUrl: result.imageUrl,
});

export const mergeAlchemyHistory = (
  ...histories: AlchemyHistoryItem[][]
): AlchemyHistoryItem[] => {
  const unique = new Map<string, AlchemyHistoryItem>();
  histories.flat().forEach((item) => unique.set(`${item.type}:${item.slug}`, item));
  return Array.from(unique.values()).slice(-200);
};

export const paletteFromCatalog = (
  item: AlchemyCatalogItem,
): PaletteObject => ({
  id: item.slug,
  paletteId: `${item.type}:${item.slug}`,
  type: item.type,
  sourceId: item.slug,
  title: item.titleEn || item.titleNative || item.slug,
  subtitle: [item.year, item.mediaType].filter(Boolean).join(" • "),
  imageUrl: item.imageUrl,
});

export const cardFromPalette = (
  item: PaletteObject,
  x: number,
  y: number,
  history: AlchemyHistoryItem[] = [],
): BoardCard => ({ ...item, instanceId: makeId(), x, y, sign: 1, history });

export const cardFromResult = (
  result: AlchemyResult,
  x: number,
  y: number,
  history: AlchemyHistoryItem[] = [],
): BoardCard => cardFromPalette(paletteFromResult(result), x, y, history);
