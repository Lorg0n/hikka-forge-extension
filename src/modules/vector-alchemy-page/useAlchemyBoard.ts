import { useCallback, useEffect, useRef, useState } from "react";
import {
  useDroppable,
  useSensors,
  useSensor,
  PointerSensor,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  AlchemyService,
  briefAlchemyError,
} from "@/services/alchemyService";
import type {
  BoardCard,
  DragData,
  PaletteObject,
  ReactionNotice,
  Recipe,
} from "./alchemy.types";
import {
  asIngredient,
  cardFromPalette,
  cardFromResult,
  mergeAlchemyHistory,
  paletteFromCatalog,
} from "./alchemy.utils";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  MAX_ZOOM,
  MIN_ZOOM,
} from "./alchemy.constants";

type BoardPoint = { x: number; y: number };
const DELETE_ZONE_PADDING = 24;

const rectsTouch = (
  first: Pick<DOMRect, "left" | "right" | "top" | "bottom">,
  second: Pick<DOMRect, "left" | "right" | "top" | "bottom">,
  padding = 0,
) =>
  first.right >= second.left - padding &&
  first.left <= second.right + padding &&
  first.bottom >= second.top - padding &&
  first.top <= second.bottom + padding;

const isRectOutside = (
  rect: Pick<DOMRect, "left" | "right" | "top" | "bottom">,
  boundary: Pick<DOMRect, "left" | "right" | "top" | "bottom">,
) =>
  rect.left < boundary.left ||
  rect.right > boundary.right ||
  rect.top < boundary.top ||
  rect.bottom > boundary.bottom;

export function useAlchemyBoard({
  setError,
  addToPalette,
  clearCatalog,
}: {
  setError: (message: string) => void;
  addToPalette: (item: PaletteObject) => void;
  clearCatalog: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const boardDrop = useDroppable({ id: "board" });
  const deleteZoneDrop = useDroppable({ id: "delete-zone" });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [activeDragSource, setActiveDragSource] = useState<DragData["source"] | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [crafting, setCrafting] = useState(false);
  const [reactionNotice, setReactionNotice] = useState<ReactionNotice | null>(null);
  const [lastRecipe, setLastRecipe] = useState<Recipe | null>(null);
  const panRef = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const viewRef = useRef({ pan, zoom });
  viewRef.current = { pan, zoom };

  const zoomAt = useCallback((requestedZoom: number, focalPoint?: BoardPoint) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const current = viewRef.current;
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, requestedZoom));
    if (next === current.zoom) return;
    const x = focalPoint?.x ?? viewport.clientWidth / 2;
    const y = focalPoint?.y ?? viewport.clientHeight / 2;
    const ratio = next / current.zoom;
    setPan({
      x: x - (x - current.pan.x) * ratio,
      y: y - (y - current.pan.y) * ratio,
    });
    setZoom(next);
  }, []);

  const fitCards = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !cards.length) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const minX = Math.min(...cards.map((card) => card.x));
    const minY = Math.min(...cards.map((card) => card.y));
    const maxX = Math.max(...cards.map((card) => card.x + CARD_WIDTH));
    const maxY = Math.max(...cards.map((card) => card.y + CARD_HEIGHT));
    const contentWidth = Math.max(CARD_WIDTH, maxX - minX);
    const contentHeight = Math.max(CARD_HEIGHT, maxY - minY);
    const padding = 72;
    const next = Math.max(
      MIN_ZOOM,
      Math.min(
        MAX_ZOOM,
        Math.min(
          (rect.width - padding * 2) / contentWidth,
          (rect.height - padding * 2) / contentHeight,
        ),
      ),
    );
    setZoom(next);
    setPan({
      x: (rect.width - contentWidth * next) / 2 - minX * next,
      y: (rect.height - contentHeight * next) / 2 - minY * next,
    });
  }, [cards]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest("[data-ingredient-dock]")) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const current = viewRef.current;
      zoomAt(current.zoom * (event.deltaY < 0 ? 1.12 : 0.9), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [zoomAt]);

  const craft = useCallback(
    async (first: BoardCard, second: BoardCard, x: number, y: number, consumedIds: string[]) => {
      const ingredients = [asIngredient(first), asIngredient(second)];
      setCards((current) => current.filter((card) => !consumedIds.includes(card.instanceId)));
      setReactionNotice({ x, y, label: `${first.title} + ${second.title}` });
      setCrafting(true);
      try {
        const history = mergeAlchemyHistory(first.history, second.history);
        const response = await AlchemyService.query(ingredients, "any", {
          history,
          repeatSuppression: 1,
        });
        setLastRecipe({ ingredients, label: `${first.title} + ${second.title}` });
        if (response.content.length) {
          const chosen = response.content[0];
          setCards((current) => [
            ...current,
            cardFromResult(
              chosen,
              x,
              y,
              mergeAlchemyHistory(history, [
                { type: chosen.contentType, slug: chosen.slug },
              ]),
            ),
          ]);
        }
        setReactionNotice(null);
        setError("");
      } catch (error) {
        setError(briefAlchemyError(error, "Алхімічна реакція не вдалася."));
        setReactionNotice(null);
      } finally {
        setCrafting(false);
      }
    },
    [setError],
  );

  const getDropClientPoint = (event: DragEndEvent) => {
    const initial = event.active.rect.current.initial;
    return initial
      ? {
          x: initial.left + event.delta.x + initial.width / 2,
          y: initial.top + event.delta.y + initial.height / 2,
        }
      : null;
  };

  const toBoardPoint = (event: DragEndEvent): BoardPoint => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const point = getDropClientPoint(event);
    if (!rect || !point) return { x: 120, y: 100 };
    return {
      x: Math.max(0, (point.x - rect.left - pan.x) / zoom - CARD_WIDTH / 2),
      y: Math.max(0, (point.y - rect.top - pan.y) / zoom - CARD_HEIGHT / 2),
    };
  };

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData;
    setActiveDragSource(data.source);
    setDeleteCandidate(false);
    if (data.card) setActiveCard(data.card);
    else if (data.palette) setActiveCard(cardFromPalette(data.palette, 0, 0));
    else if (data.catalog) {
      setActiveCard(cardFromPalette(paletteFromCatalog(data.catalog), 0, 0));
    }
  };

  const onDragMove = (event: DragMoveEvent) => {
    const data = event.active.data.current as DragData;
    if (data.source !== "board" || !data.card) {
      setDeleteCandidate(false);
      return;
    }
    const activeRect = event.active.rect.current.translated;
    const deleteRect = deleteZoneDrop.rect.current;
    const viewportRect = viewportRef.current?.getBoundingClientRect();
    const touchesDeleteZone = Boolean(
      activeRect &&
        deleteRect &&
        rectsTouch(activeRect, deleteRect, DELETE_ZONE_PADDING),
    );
    const isOutsideBoard = Boolean(
        activeRect &&
        viewportRect &&
        isRectOutside(activeRect, viewportRect),
    );
    setDeleteCandidate(touchesDeleteZone || isOutsideBoard);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragData;
    const overId = String(event.over?.id ?? "");
    const hovered = event.over?.data.current?.card as BoardCard | undefined;
    const targetCard = hovered?.instanceId === data.card?.instanceId ? undefined : hovered;
    const client = getDropClientPoint(event);
    const rect = viewportRef.current?.getBoundingClientRect();
    const isInsideBoard =
      overId === "board" ||
      overId.startsWith("target:") ||
      Boolean(
        client &&
          rect &&
          client.x >= rect.left &&
          client.x <= rect.right &&
          client.y >= rect.top &&
          client.y <= rect.bottom,
      );
    const point = toBoardPoint(event);
    const activeRect = event.active.rect.current.translated;
    const deleteRect = deleteZoneDrop.rect.current;
    const viewportRect = viewportRef.current?.getBoundingClientRect();
    const touchesDeleteZone = Boolean(
      activeRect &&
        deleteRect &&
        rectsTouch(activeRect, deleteRect, DELETE_ZONE_PADDING),
    );
    const isOutsideBoard = Boolean(
      activeRect && viewportRect && isRectOutside(activeRect, viewportRect),
    );
    setActiveCard(null);
    setActiveDragSource(null);
    setDeleteCandidate(false);

    if (
      data.source === "board" &&
      data.card &&
      (overId === "delete-zone" || touchesDeleteZone || isOutsideBoard || !isInsideBoard)
    ) {
      setCards((current) =>
        current.filter((card) => card.instanceId !== data.card?.instanceId),
      );
      return;
    }

    if (data.source === "palette" && !isInsideBoard) return;
    if (data.source === "catalog" && !isInsideBoard && data.catalog) {
      addToPalette(paletteFromCatalog(data.catalog));
      clearCatalog();
      return;
    }
    if (!isInsideBoard) return;
    if (data.source === "board" && data.card) {
      const moved = { ...data.card, x: point.x, y: point.y };
      if (targetCard) {
        void craft(moved, targetCard, targetCard.x, targetCard.y, [
          moved.instanceId,
          targetCard.instanceId,
        ]);
      } else {
        setCards((current) =>
          current.map((card) =>
            card.instanceId === moved.instanceId ? moved : card,
          ),
        );
      }
      return;
    }
    const item = data.palette ?? (data.catalog ? paletteFromCatalog(data.catalog) : null);
    if (!item) return;
    const added = cardFromPalette(item, point.x, point.y);
    if (targetCard) {
      void craft(added, targetCard, targetCard.x, targetCard.y, [targetCard.instanceId]);
    } else {
      setCards((current) => [...current, added]);
    }
    if (data.catalog) clearCatalog();
  };

  const toggleCardSign = (id: string) => {
    setCards((current) =>
      current.map((card) =>
        card.instanceId === id
          ? { ...card, sign: card.sign === 1 ? -1 : 1 }
          : card,
      ),
    );
  };

  const removeCardsForElement = (elementId: number) => {
    setCards((current) =>
      current.filter(
        (card) => !(card.type === "element" && Number(card.sourceId) === elementId),
      ),
    );
  };

  const onBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      (event.target as HTMLElement).closest(
        "button, input, textarea, [data-board-card], [data-ingredient-dock]",
      )
    ) {
      return;
    }
    panRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      x: pan.x,
      y: pan.y,
    };
  };

  const onBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    setPan({
      x: panRef.current.x + event.clientX - panRef.current.clientX,
      y: panRef.current.y + event.clientY - panRef.current.clientY,
    });
  };

  return {
    viewportRef,
    boardDrop,
    sensors,
    cards,
    activeCard,
    crafting,
    reactionNotice,
    lastRecipe,
    pan,
    zoom,
    zoomAt,
    fitCards,
    onDragStart,
    onDragEnd,
    onBoardPointerDown,
    onBoardPointerMove,
    stopPanning: () => {
      panRef.current = null;
    },
    clearActiveCard: () => {
      setActiveCard(null);
      setActiveDragSource(null);
      setDeleteCandidate(false);
    },
    activeDragSource,
    deleteCandidate,
    deleteZoneDrop,
    onDragMove,
    toggleCardSign,
    removeCardsForElement,
  };
}
