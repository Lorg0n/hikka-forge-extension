import { useEffect, useState } from "react";
import {
  AlchemyService,
  type AlchemyCatalogItem,
} from "@/services/alchemyService";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 280;

export function useAlchemyCatalogSearch(onError: (message: string) => void) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlchemyCatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      void AlchemyService.searchCatalog(value)
        .then((items) => isCurrent && setResults(items))
        .catch((error) => {
          if (isCurrent)
            onError(
              error instanceof Error
                ? error.message
                : "Не вдалося знайти тайтли.",
            );
        })
        .finally(() => isCurrent && setIsSearching(false));
    }, SEARCH_DELAY_MS);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [onError, query]);

  const clear = () => {
    setQuery("");
    setResults([]);
  };

  return { query, setQuery, results, isSearching, clear };
}
