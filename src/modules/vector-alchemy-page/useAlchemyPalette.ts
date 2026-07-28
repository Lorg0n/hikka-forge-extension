import { useCallback, useEffect, useState } from "react";
import { AlchemyService, type AlchemyElement } from "@/services/alchemyService";
import browser from "@/utils/browser";
import type { PaletteObject } from "./alchemy.types";
import { paletteFromElement } from "./alchemy.utils";

const STORAGE_KEY = "vector_alchemy_palette_v1";

export function useAlchemyPalette(onError: (message: string) => void) {
  const [elements, setElements] = useState<AlchemyElement[]>([]);
  const [palette, setPalette] = useState<PaletteObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const page = await AlchemyService.listElements();
      const saved = await browser.storage.local.get(STORAGE_KEY);
      const serverElements = page.content.map(paletteFromElement);
      const savedPalette = Array.isArray(saved[STORAGE_KEY])
        ? (saved[STORAGE_KEY] as PaletteObject[])
        : [];
      const savedDiscoveries = savedPalette.filter((item) => item.type !== "element");
      setElements(page.content);
      // Basic elements are server-defined ingredients, not personal palette
      // items. Always merge them back so an accidental drag/delete cannot make
      // one disappear permanently from the ingredient dock.
      setPalette([...serverElements, ...savedDiscoveries]);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Не вдалося завантажити елементи.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [onError]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!isLoading) void browser.storage.local.set({ [STORAGE_KEY]: palette });
  }, [isLoading, palette]);
  return { elements, setElements, palette, setPalette, isLoading };
}
