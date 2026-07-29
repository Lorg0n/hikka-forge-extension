import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import type { AlchemyCatalogItem, AlchemyElement } from "@/services/alchemyService";
import type { BoardCard, PaletteObject, ReactionNotice } from "./alchemy.types";
import { BoardCardView } from "./alchemy-card-components";
import { AlchemyIngredientDock } from "./AlchemyIngredientDock";

export function AlchemyBoard({
  viewportRef,
  boardDrop,
  cards,
  activeCard,
  pan,
  zoom,
  reactionNotice,
  elements,
  palette,
  ingredientQuery,
  catalogResults,
  catalogSearching,
  onIngredientQuery,
  onRemovePalette,
  onZoom,
  onFit,
  onToggleSign,
  onPointerDown,
  onPointerMove,
  onPointerStop,
}: {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  boardDrop: { setNodeRef: (node: HTMLElement | null) => void; isOver: boolean };
  cards: BoardCard[];
  activeCard: BoardCard | null;
  pan: { x: number; y: number };
  zoom: number;
  reactionNotice: ReactionNotice | null;
  elements: AlchemyElement[];
  palette: PaletteObject[];
  ingredientQuery: string;
  catalogResults: AlchemyCatalogItem[];
  catalogSearching: boolean;
  onIngredientQuery: (value: string) => void;
  onRemovePalette: (id: string) => void;
  onZoom: (value: number) => void;
  onFit: () => void;
  onToggleSign: (id: string) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerStop: () => void;
}) {
  return (
    <section
      ref={(node) => {
        if (viewportRef) {
          (viewportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
        boardDrop.setNodeRef(node);
      }}
      className={`relative mt-3 h-[min(76svh,850px)] min-h-[430px] overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-black/10 touch-none sm:min-h-[520px] ${boardDrop.isOver ? "ring-2 ring-violet-400/50" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerStop}
      onPointerCancel={onPointerStop}
    >
      <AlchemyIngredientDock
        elements={elements}
        palette={palette}
        query={ingredientQuery}
        onQuery={onIngredientQuery}
        catalogResults={catalogResults}
        catalogSearching={catalogSearching}
        onRemove={onRemovePalette}
      />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-border/60 bg-background/75 px-3 py-2 text-center text-xs text-muted-foreground backdrop-blur">
        {boardDrop.isOver ? (
          <span className="font-medium text-violet-400">Відпустіть, щоб додати</span>
        ) : (
          "Тягніть фон — рух · колесо — масштаб"
        )}
      </div>
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border bg-background/80 p-1 backdrop-blur">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onZoom(zoom * 1.2)}
          title="Збільшити"
          aria-label="Збільшити"
        >
          <Icon icon="material-symbols:add" />
        </Button>
        <span className="min-w-10 text-center text-[11px] text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onZoom(zoom * 0.8)}
          title="Зменшити"
          aria-label="Зменшити"
        >
          <Icon icon="material-symbols:remove" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onFit}
          title="Вмістити картки"
          aria-label="Вмістити картки"
        >
          <Icon icon="material-symbols:fit-screen" />
        </Button>
      </div>
      <div
        className="absolute left-0 top-0 h-full w-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {cards.map((card) => (
          <BoardCardView
            key={card.instanceId}
            card={card}
            draggingSign={activeCard?.sign}
            onToggleSign={onToggleSign}
          />
        ))}
        {reactionNotice && (
          <div
            role="status"
            aria-label={`Обчислення реакції: ${reactionNotice.label}`}
            className="pointer-events-none absolute z-20 flex h-[112px] w-[220px] animate-pulse gap-2.5 rounded-xl border border-violet-300/70 bg-card/90 p-2.5 shadow-[0_0_0_3px_rgba(167,139,250,.1),0_0_26px_rgba(139,92,246,.3)]"
            style={{ left: reactionNotice.x, top: reactionNotice.y }}
          >
            <span className="h-full w-16 shrink-0 rounded-lg bg-muted/80" />
            <span className="flex min-w-0 flex-1 flex-col justify-center gap-2">
              <span className="h-3 w-4/5 rounded-full bg-muted/90" />
              <span className="h-3 w-3/5 rounded-full bg-muted/70" />
              <span className="h-2 w-2/5 rounded-full bg-muted/60" />
            </span>
          </div>
        )}
      </div>
      {!cards.length && !reactionNotice && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center">
          <div className="max-w-xs">
            <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Icon icon="material-symbols:gesture" className="text-3xl" />
            </span>
            <p className="font-medium">Перетягніть два інгредієнти сюди</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Вони зʼявляться на мапі, а поєднання відкриють нові результати.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
