import type {
  AlchemyCatalogItem,
  AlchemyHistoryItem,
  AlchemyIngredient,
  AlchemySourceType,
} from "@/services/alchemyService";

export type PaletteOrigin = "basic" | "catalog" | "discovered";

export type PaletteObject = {
  id: string | number;
  paletteId: string;
  type: AlchemySourceType;
  origin?: PaletteOrigin;
  sourceId: number | string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
};

export type BoardCard = PaletteObject & {
  instanceId: string;
  x: number;
  y: number;
  sign: 1 | -1;
  history: AlchemyHistoryItem[];
};

export type Recipe = { ingredients: AlchemyIngredient[]; label: string };

export type ReactionNotice = { x: number; y: number; label: string };

export type InvalidCombination = {
  draggedInstanceId?: string;
  targetInstanceId: string;
};

export type DragData = {
  source: "board" | "palette" | "catalog";
  card?: BoardCard;
  palette?: PaletteObject;
  catalog?: AlchemyCatalogItem;
};
