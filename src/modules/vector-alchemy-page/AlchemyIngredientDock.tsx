import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlchemyCatalogItem } from "@/services/alchemyService";
import type { PaletteObject } from "./alchemy.types";
import { CatalogItem, PaletteItem } from "./alchemy-card-components";

export function AlchemyIngredientDock({
  palette,
  query,
  onQuery,
  catalogResults,
  catalogSearching,
  onRemove,
}: {
  palette: PaletteObject[];
  query: string;
  onQuery: (value: string) => void;
  catalogResults: AlchemyCatalogItem[];
  catalogSearching: boolean;
  onRemove: (id: string) => void;
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches,
  );
  const [open, setOpen] = useState(() =>
    !(typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return palette;
    return palette.filter((item) =>
      `${item.title} ${item.subtitle || ""}`.toLowerCase().includes(value),
    );
  }, [palette, query]);
  const [basicElementsOpen, setBasicElementsOpen] = useState(false);
  useEffect(() => {
    if (query.trim()) setBasicElementsOpen(true);
  }, [query]);
  const basicElements = filtered.filter((item) => item.type === "element");
  const otherIngredients = filtered.filter((item) => item.type !== "element");
  const basicElementsExpanded = basicElementsOpen;
  const showCatalog = query.trim().length >= 2;
  const toggleLabel = open ? "Згорнути інгредієнти" : "Розгорнути інгредієнти";
  const toggleIcon = isMobile
    ? open
      ? "material-symbols:keyboard-arrow-down"
      : "material-symbols:keyboard-arrow-up"
    : open
      ? "material-symbols:keyboard-arrow-down"
      : "material-symbols:chevron-right";

  return (
    <section
      data-ingredient-dock
      className={`surface absolute left-3 z-30 flex flex-col overflow-hidden rounded-2xl border shadow-2xl shadow-black/20 backdrop-blur-md ${isMobile ? "right-3 bottom-3" : "top-3"} ${open ? "max-h-[58%] w-[calc(100%-1.5rem)] p-2.5 md:bottom-3 md:right-auto md:max-h-none md:w-64" : "w-[calc(100%-1.5rem)] p-2.5 md:bottom-auto md:w-64"}`}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-10 min-h-10 w-full shrink-0 justify-start rounded-xl px-1.5 py-0 text-left transition-none hover:bg-transparent"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="alchemy-ingredient-list"
        aria-label={toggleLabel}
      >
        <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
          <Icon
            icon={toggleIcon}
          />
        </span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400">
          <Icon icon="material-symbols:inventory-2-outline" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-4">Інгредієнти</p>
          <p className="text-[11px] leading-4 text-muted-foreground">Перетягніть на мапу</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {palette.length}
        </span>
      </Button>
      {open && <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
        <div id="alchemy-ingredient-list" className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
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
              {basicElements.length > 0 && (
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-full justify-start rounded-lg px-2 text-xs transition-none hover:bg-accent/60"
                    onClick={() => setBasicElementsOpen((value) => !value)}
                    aria-expanded={basicElementsExpanded}
                    aria-controls="alchemy-basic-elements"
                  >
                    <Icon
                      icon={basicElementsExpanded
                        ? "material-symbols:keyboard-arrow-down"
                        : "material-symbols:chevron-right"}
                      className="text-muted-foreground"
                    />
                    <span className="flex-1 text-left font-semibold">Базові елементи</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {basicElements.length}
                    </span>
                  </Button>
                  {basicElementsExpanded && (
                    <div id="alchemy-basic-elements" className="space-y-1.5">
                      {basicElements.map((item) => (
                        <PaletteItem key={item.paletteId} item={item} onRemove={onRemove} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {otherIngredients.map((item) => (
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
      </div>}
    </section>
  );
}
