import { Icon } from "@iconify/react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import type { AlchemyCatalogItem } from "@/services/alchemyService";
import type { BoardCard, DragData, PaletteObject } from "./alchemy.types";
import { typeIcon } from "./alchemy.icons";

export function CardBody({ card }: { card: BoardCard }) {
  return (
    <>
      <div className="flex h-full w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-violet-500/12">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        ) : (
          <Icon icon={typeIcon(card.type)} className="text-xl text-violet-400" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        {card.type === "anime" || card.type === "manga" ? (
          <a
            href={`/${card.type}/${card.sourceId}`}
            target="_blank"
            rel="noopener noreferrer"
            onDoubleClick={(event) => event.stopPropagation()}
            className="block line-clamp-3 text-sm font-semibold leading-5 hover:underline"
          >
            {card.title}
          </a>
        ) : (
          <span className="block line-clamp-3 text-sm font-semibold leading-5">
            {card.title}
          </span>
        )}
        <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {card.subtitle ||
            (card.type === "element" ? "Базовий елемент" : card.type)}
        </span>
      </div>
    </>
  );
}

export function BoardCardView({
  card,
  draggingSign,
  invalidDropTarget = false,
  invalidDropSource = false,
  onToggleSign,
}: {
  card: BoardCard;
  draggingSign?: 1 | -1;
  invalidDropTarget?: boolean;
  invalidDropSource?: boolean;
  onToggleSign: (id: string) => void;
}) {
  const draggable = useDraggable({
    id: `board:${card.instanceId}`,
    data: { source: "board", card } satisfies DragData,
  });
  const droppable = useDroppable({
    id: `target:${card.instanceId}`,
    data: { card },
  });
  const setRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  };

  return (
    <article
      ref={setRef}
      data-board-card
      onDoubleClick={() => onToggleSign(card.instanceId)}
      {...draggable.listeners}
      {...draggable.attributes}
      className={`absolute z-[1] flex h-[112px] w-[220px] cursor-grab touch-none select-none gap-2.5 overflow-hidden rounded-xl border bg-card/95 p-2.5 shadow-xl backdrop-blur transition-[box-shadow,border-color] active:cursor-grabbing ${
        draggable.isDragging || invalidDropSource
          ? "opacity-0"
          : invalidDropTarget
            ? "z-[3] animate-[hikka-alchemy-invalid-pulse_1s_ease-in-out_infinite] border-2 border-yellow-300 ring-2 ring-yellow-300/70 shadow-[0_0_0_4px_rgba(250,204,21,.14),0_0_28px_rgba(250,204,21,.5)]"
            : droppable.isOver && draggingSign === -1
              ? "z-[3] border-2 border-red-400 ring-2 ring-red-400/45 shadow-[0_0_0_4px_rgba(248,113,113,.12),0_0_28px_rgba(248,113,113,.45)]"
              : droppable.isOver && draggingSign === 1
                ? "z-[3] border-2 border-white ring-2 ring-white/35 shadow-[0_0_0_4px_rgba(255,255,255,.1),0_0_26px_rgba(255,255,255,.22)]"
                : card.sign < 0
                  ? "border-red-400/80 shadow-[0_0_20px_rgba(248,113,113,.2)] hover:border-red-300"
                  : "border-border/80 hover:border-white/80 hover:shadow-[0_0_22px_rgba(255,255,255,.16)]"
      }`}
      style={{ left: card.x, top: card.y }}
      title="Alt + перетягування дублює картку · подвійний клік змінює знак інгредієнта"
    >
      <CardBody card={card} />
      {card.sign < 0 && (
        <span className="absolute right-2 top-1 rounded bg-red-500/20 px-1 text-xs font-bold text-red-300">
          −
        </span>
      )}
    </article>
  );
}

export function PaletteItem({
  item,
  onRemove,
}: {
  item: PaletteObject;
  onRemove?: (id: string) => void;
}) {
  const draggable = useDraggable({
    id: `palette:${item.paletteId}`,
    data: { source: "palette", palette: item } satisfies DragData,
  });
  const canRemove = item.type !== "element" && Boolean(onRemove);
  const remove = () => {
    if (canRemove && onRemove) onRemove(item.paletteId);
  };

  return (
    <div
      ref={draggable.setNodeRef}
      {...draggable.listeners}
      {...draggable.attributes}
      className="group flex w-full min-w-0 max-w-none touch-none select-none items-center gap-2 rounded-xl border border-transparent bg-muted/35 p-2 text-left transition-colors hover:border-violet-400/40 hover:bg-violet-500/10"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          draggable={false}
          className="size-8 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400">
          <Icon icon={typeIcon(item.type)} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {item.origin === "discovered"
            ? item.type === "anime" ? "Аніме" : "Манґа"
            : item.subtitle || "Елемент"}
        </span>
      </span>
      {canRemove && (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={remove}
          aria-label={`Видалити ${item.title}`}
        >
          <Icon icon="material-symbols:close" />
        </Button>
      )}
    </div>
  );
}

export function CatalogItem({ item }: { item: AlchemyCatalogItem }) {
  const draggable = useDraggable({
    id: `catalog:${item.type}:${item.slug}`,
    data: { source: "catalog", catalog: item } satisfies DragData,
  });

  return (
    <button
      ref={draggable.setNodeRef}
      type="button"
      {...draggable.listeners}
      {...draggable.attributes}
      className="group flex w-full touch-none items-center gap-2 rounded-xl p-2 text-left hover:bg-accent"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          draggable={false}
          className="size-9 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon icon={typeIcon(item.type)} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {item.titleEn || item.titleNative || item.slug}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {item.type === "anime" ? "Аніме" : "Манґа"}
          {item.year ? ` · ${item.year}` : ""}
        </span>
      </span>
      <Icon icon="material-symbols:drag-indicator" className="text-muted-foreground opacity-60" />
    </button>
  );
}
