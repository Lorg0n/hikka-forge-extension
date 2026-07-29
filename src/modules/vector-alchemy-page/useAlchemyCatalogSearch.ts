import { useEffect, useState } from "react";
import {
  AlchemyService,
  type AlchemyCatalogItem,
} from "@/services/alchemyService";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 280;

export function useAlchemyCatalogSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlchemyCatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      void AlchemyService.searchCatalog(value)
        .then((items) => isCurrent && setResults(items))
        .catch(() => isCurrent && setResults([]))
        .finally(() => isCurrent && setIsSearching(false));
    }, SEARCH_DELAY_MS);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const clear = () => {
    setQuery("");
    setResults([]);
  };

  return { query, setQuery, results, isSearching, clear };
}
