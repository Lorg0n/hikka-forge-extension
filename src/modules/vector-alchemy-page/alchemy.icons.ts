import type { AlchemyCatalogItem } from "@/services/alchemyService";
import type { PaletteObject } from "./alchemy.types";

export function typeIcon(type: PaletteObject["type"] | AlchemyCatalogItem["type"]) {
  if (type === "element") return "material-symbols:science-outline";
  return type === "anime"
    ? "material-symbols:movie-outline"
    : "material-symbols:menu-book";
}
