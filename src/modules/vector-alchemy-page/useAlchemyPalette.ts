import { useCallback, useEffect, useState } from "react";
import {
  AlchemyService,
  briefAlchemyError,
  type AlchemyElement,
} from "@/services/alchemyService";
import type { PaletteObject } from "./alchemy.types";
import { paletteFromElement } from "./alchemy.utils";

export function useAlchemyPalette(onError: (message: string) => void) {
  const [elements, setElements] = useState<AlchemyElement[]>([]);
  const [palette, setPalette] = useState<PaletteObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverElements = await AlchemyService.listAllElements();
      setElements(serverElements);
      setPalette(serverElements.map(paletteFromElement));
    } catch (error) {
      onError(briefAlchemyError(error, "Не вдалося завантажити елементи."));
    } finally {
      setIsLoading(false);
    }
  }, [onError]);
  useEffect(() => {
    void load();
  }, [load]);
  return { elements, setElements, palette, setPalette, isLoading };
}
