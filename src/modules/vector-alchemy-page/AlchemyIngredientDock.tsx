import { useMemo } from "react";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AlchemyCatalogItem,
  AlchemyElement,
} from "@/services/alchemyService";
import type { PaletteObject } from "./alchemy.types";
import { CatalogItem, PaletteItem } from "./alchemy-card-components";

export function AlchemyIngredientDock({
  elements,
  palette,
  query,
  onQuery,
  catalogResults,
  catalogSearching,
  onRemove,
}: {
  elements: AlchemyElement[];
  palette: PaletteObject[];
  query: string;
  onQuery: (value: string) => void;
  catalogResults: AlchemyCatalogItem[];
  catalogSearching: boolean;
  onRemove: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return palette;
    return palette.filter((item) =>
      `${item.title} ${item.subtitle || ""}`.toLowerCase().includes(value),
    );
  }, [palette, query]);
  const showCatalog = query.trim().length >= 2;

  return (
    <section
      data-ingredient-dock
      className="surface absolute bottom-3 left-3 top-3 z-30 flex w-64 max-w-[calc(100%-1.5rem)] flex-col rounded-2xl border p-3 shadow-2xl shadow-black/20 backdrop-blur-md"
    >
      <div className="flex shrink-0 items-center gap-2 px-1">
        <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400">
          <Icon icon="material-symbols:inventory-2-outline" />
        </span>
        <div>
          <p className="text-sm font-semibold">Інгредієнти</p>
          <p className="text-[11px] text-muted-foreground">Перетягніть на мапу</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {elements.length}
        </span>
      </div>
      <div className="relative mt-3 shrink-0">
        <Icon
          icon="material-symbols:search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Знайти елемент, аніме або манґу…"
          className="h-10 rounded-xl pl-9 pr-9"
          aria-label="Пошук інгредієнтів"
        />
        {catalogSearching && (
          <Icon
            icon="svg-spinners:90-ring-with-bg"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400"
          />
        )}
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {showCatalog && catalogSearching ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`catalog-skeleton-${index}`}
              className="flex items-center gap-2 rounded-xl p-2"
            >
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-2.5 w-2/5" />
              </span>
            </div>
          ))
        ) : (
          <>
            {filtered.map((item) => (
              <PaletteItem key={item.paletteId} item={item} onRemove={onRemove} />
            ))}
            {showCatalog &&
              catalogResults.map((item) => (
                <CatalogItem key={`${item.type}-${item.slug}`} item={item} />
              ))}
          </>
        )}
        {!catalogSearching && !filtered.length && !catalogResults.length && (
          <div className="flex items-center px-2 py-2 text-sm text-muted-foreground">
            {showCatalog
              ? "Нічого не знайдено."
              : "Додайте інгредієнт для початку."}
          </div>
        )}
      </div>
    </section>
  );
}
