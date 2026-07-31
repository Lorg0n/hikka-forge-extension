import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlchemyService,
  briefAlchemyError,
  type AlchemyElement,
} from "@/services/alchemyService";
import type { PaletteObject } from "./alchemy.types";
import {
  loadAlchemyDiscoveries,
  paletteFromElement,
  saveAlchemyDiscoveries,
} from "./alchemy.utils";

export function useAlchemyPalette(onError: (message: string) => void) {
  const [elements, setElements] = useState<AlchemyElement[]>([]);
  const [palette, setPalette] = useState<PaletteObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const restoredSession = useRef(false);
  const load = useCallback(async () => {
    setIsLoading(true);
    const discoveries = loadAlchemyDiscoveries();
    try {
      const serverElements = await AlchemyService.listAllElements();
      setElements(serverElements);
      const basicElements = serverElements.map(paletteFromElement);
      const basicIds = new Set(basicElements.map((item) => item.paletteId));
      setPalette([
        ...basicElements,
        ...discoveries.filter((item) => !basicIds.has(item.paletteId)),
      ]);
    } catch (error) {
      setPalette(discoveries);
      onError(briefAlchemyError(error, "Не вдалося завантажити елементи."));
    } finally {
      restoredSession.current = true;
      setIsLoading(false);
    }
  }, [onError]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (restoredSession.current) saveAlchemyDiscoveries(palette);
  }, [palette]);
  return { elements, setElements, palette, setPalette, isLoading };
}
