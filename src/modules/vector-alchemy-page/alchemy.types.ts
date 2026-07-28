import type {
  AlchemyCatalogItem,
  AlchemyIngredient,
  AlchemySourceType,
} from "@/services/alchemyService";

export type PaletteObject = {
  id: string | number;
  paletteId: string;
  type: AlchemySourceType;
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
};

export type Recipe = { ingredients: AlchemyIngredient[]; label: string };

export type DragData = {
  source: "board" | "palette" | "catalog";
  card?: BoardCard;
  palette?: PaletteObject;
  catalog?: AlchemyCatalogItem;
};
