import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotFound from "@/components/ui/not-found";
import { ModulePageTransition } from "@/components/ui/module-page-transition";
import { useAuth } from "@/contexts/ModuleAuthContext";
import {
  AlchemyService,
  type AlchemyCatalogItem,
  type AlchemyElement,
  type AlchemyIngredient,
  type AlchemyResult,
} from "@/services/alchemyService";
import type { BoardCard, DragData, PaletteObject, Recipe } from "./alchemy.types";
import {
  asIngredient,
  cardFromPalette,
  cardFromResult,
  paletteFromCatalog,
  paletteFromElement,
} from "./alchemy.utils";
import { createExpressionEmbedding, createRecipeEmbedding } from "./alchemy.recipe";
import { useAlchemyCatalogSearch } from "./useAlchemyCatalogSearch";
import { useAlchemyPalette } from "./useAlchemyPalette";

const CARD_WIDTH = 220;
const CARD_HEIGHT = 112;
const MAX_ZOOM = 2;
const MIN_ZOOM = 0.35;

type RecipeIngredient = PaletteObject & { weight: 1 | -1 };
type ReactionNotice = { x: number; y: number; label: string };

function typeIcon(type: PaletteObject["type"] | AlchemyCatalogItem["type"]) {
  if (type === "element") return "material-symbols:science-outline";
  return type === "anime" ? "material-symbols:movie-outline" : "material-symbols:menu-book";
}

function CardBody({ card }: { card: BoardCard }) {
  return (
    <>
      <div className="flex h-full w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-violet-500/12">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <Icon icon={typeIcon(card.type)} className="text-xl text-violet-400" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <span className="block line-clamp-3 text-sm font-semibold leading-5">{card.title}</span>
        <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {card.subtitle || (card.type === "element" ? "Базовий елемент" : card.type)}
        </span>
      </div>
    </>
  );
}

function BoardCardView({ card, draggingSign, onToggleSign }: { card: BoardCard; draggingSign?: 1 | -1; onToggleSign: (id: string) => void }) {
  const draggable = useDraggable({
    id: `board:${card.instanceId}`,
    data: { source: "board", card } satisfies DragData,
  });
  const droppable = useDroppable({ id: `target:${card.instanceId}`, data: { card } });
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
      className={`absolute z-[1] flex h-[112px] w-[220px] cursor-grab touch-none select-none gap-2.5 overflow-hidden rounded-xl border bg-card/95 p-2.5 shadow-xl backdrop-blur transition-[opacity,box-shadow,border-color] active:cursor-grabbing ${
        draggable.isDragging
          ? "opacity-0"
          : droppable.isOver && draggingSign === -1
            ? "z-[3] border-2 border-red-400 ring-2 ring-red-400/45 shadow-[0_0_0_4px_rgba(248,113,113,.12),0_0_28px_rgba(248,113,113,.45)]"
            : droppable.isOver && draggingSign === 1
              ? "z-[3] border-2 border-white ring-2 ring-white/35 shadow-[0_0_0_4px_rgba(255,255,255,.1),0_0_26px_rgba(255,255,255,.22)]"
            : card.sign < 0
              ? "border-red-400/80 shadow-[0_0_20px_rgba(248,113,113,.2)] hover:border-red-300"
              : "border-border/80 hover:border-white/80 hover:shadow-[0_0_22px_rgba(255,255,255,.16)]"
      }`}
      style={{ left: card.x, top: card.y }}
      title="Подвійний клік змінює знак інгредієнта"
    >
      <CardBody card={card} />
      {card.sign < 0 && (
        <span className="absolute right-2 top-1 rounded bg-red-500/20 px-1 text-xs font-bold text-red-300">−</span>
      )}
    </article>
  );
}

function PaletteItem({ item, onRemove }: { item: PaletteObject; onRemove?: (id: string) => void }) {
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
        <img src={item.imageUrl} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400">
          <Icon icon={typeIcon(item.type)} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{item.subtitle || "Елемент"}</span>
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

function CatalogItem({ item }: { item: AlchemyCatalogItem }) {
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
        <img src={item.imageUrl} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon icon={typeIcon(item.type)} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.titleEn || item.titleNative || item.slug}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {item.type === "anime" ? "Аніме" : "Манґа"}{item.year ? ` · ${item.year}` : ""}
        </span>
      </span>
      <Icon icon="material-symbols:drag-indicator" className="text-muted-foreground opacity-60" />
    </button>
  );
}

function UnifiedIngredientDock({
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
    return palette.filter((item) => `${item.title} ${item.subtitle || ""}`.toLowerCase().includes(value));
  }, [palette, query]);
  const showCatalog = query.trim().length >= 2;
  return (
    <section data-ingredient-dock className="surface absolute bottom-3 left-3 top-3 z-30 flex w-64 max-w-[calc(100%-1.5rem)] flex-col rounded-2xl border p-3 shadow-2xl shadow-black/20 backdrop-blur-md">
      <div className="flex shrink-0 items-center gap-2 px-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400">
            <Icon icon="material-symbols:inventory-2-outline" />
          </span>
          <div>
            <p className="text-sm font-semibold">Інгредієнти</p>
            <p className="text-[11px] text-muted-foreground">Перетягніть на мапу</p>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{elements.length}</span>
        </div>
        <div className="relative mt-3 shrink-0">
          <Icon icon="material-symbols:search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Знайти елемент, аніме або манґу…"
            className="h-10 rounded-xl pl-9 pr-9"
            aria-label="Пошук інгредієнтів"
          />
          {catalogSearching && <Icon icon="svg-spinners:90-ring-with-bg" className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400" />}
        </div>
      <div className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {filtered.map((item) => <PaletteItem key={item.paletteId} item={item} onRemove={onRemove} />)}
        {showCatalog && catalogResults.map((item) => <CatalogItem key={`${item.type}-${item.slug}`} item={item} />)}
        {!filtered.length && !catalogResults.length && (
          <div className="flex items-center px-2 py-2 text-sm text-muted-foreground">
            {showCatalog && !catalogSearching ? "Нічого не знайдено." : "Додайте інгредієнт для початку."}
          </div>
        )}
      </div>
    </section>
  );
}

function HighlightedExpression({ value }: { value: string }) {
  const parts = value.split(/(element|anime|manga|[+\-*\/^()]|[()\"])/g);
  return (
    <>
      {parts.map((part, index) => {
        const className = /^(element|anime|manga)$/.test(part)
          ? "text-sky-400"
          : /^[+\-*\/^]$/.test(part)
            ? "text-amber-300"
            : /^[()]$/.test(part)
              ? "text-violet-300"
            : part === '"'
              ? "text-emerald-300"
              : "text-foreground";
        return <span className={className} key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function expressionLookup(value: string, cursor: number) {
  const before = value.slice(0, cursor);
  const match = before.match(/((?:element|anime|manga)\(\s*["'])([^"']*)$/);
  if (!match) return null;
  return { start: cursor - match[0].length, prefix: match[1], query: match[2] };
}

function toRecipeIngredient(item: PaletteObject, weight: 1 | -1 = 1): RecipeIngredient {
  return { ...item, weight };
}

function recipeIngredientsFromRecipe(recipe: Recipe, palette: PaletteObject[]): RecipeIngredient[] {
  return recipe.ingredients.map((ingredient, index) => {
    const found = palette.find((item) =>
      ingredient.type === "element"
        ? item.type === "element" && Number(item.sourceId) === ingredient.id
        : item.type === ingredient.type && String(item.sourceId) === ingredient.slug,
    );
    return toRecipeIngredient(
      found ?? {
        id: ingredient.id ?? ingredient.slug ?? index,
        paletteId: `${ingredient.type}:${ingredient.id ?? ingredient.slug}`,
        type: ingredient.type,
        sourceId: ingredient.id ?? ingredient.slug ?? "",
        title: ingredient.slug || `Елемент ${ingredient.id}`,
        subtitle: ingredient.type,
      },
      ingredient.weight < 0 ? -1 : 1,
    );
  });
}

function ingredientsToExpression(ingredients: RecipeIngredient[]) {
  return ingredients
    .map((ingredient) => {
      const functionName = ingredient.type;
      const value = String(ingredient.sourceId);
      return `${ingredient.weight < 0 ? "-" : "+"} ${functionName}("${value}")`;
    })
    .join(" ")
    .replace(/^\+ /, "");
}

function RecipeChip({ ingredient, onWeight, onRemove }: { ingredient: RecipeIngredient; onWeight: () => void; onRemove: () => void }) {
  return (
    <div className={`group flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ${ingredient.weight < 0 ? "border-red-400/50 bg-red-500/8" : "border-border bg-muted/35"}`}>
      <button type="button" onClick={onWeight} className={`text-sm font-bold ${ingredient.weight < 0 ? "text-red-300" : "text-emerald-300"}`} aria-label="Змінити знак">
        {ingredient.weight < 0 ? "−" : "+"}
      </button>
      <Icon icon={typeIcon(ingredient.type)} className="shrink-0 text-violet-400" />
      <span className="max-w-[12rem] truncate text-sm">{ingredient.title}</span>
      <button type="button" onClick={onRemove} className="ml-1 text-muted-foreground opacity-60 hover:text-foreground hover:opacity-100" aria-label={`Видалити ${ingredient.title}`}>
        <Icon icon="material-symbols:close" className="text-base" />
      </button>
    </div>
  );
}

function AdminWorkspace({
  elements,
  palette,
  adminElement,
  adminName,
  adminDescription,
  adminImageUrl,
  adminExpression,
  recipeIngredients,
  replaceVector,
  lastRecipe,
  saving,
  searchQuery,
  catalogResults,
  catalogSearching,
  onSearch,
  onSelectIngredient,
  onNew,
  onEdit,
  onName,
  onDescription,
  onImage,
  onExpression,
  onIngredients,
  onReplace,
  onSave,
}: {
  elements: AlchemyElement[];
  palette: PaletteObject[];
  adminElement: AlchemyElement | null;
  adminName: string;
  adminDescription: string;
  adminImageUrl: string;
  adminExpression: string;
  recipeIngredients: RecipeIngredient[];
  replaceVector: boolean;
  lastRecipe: Recipe | null;
  saving: boolean;
  searchQuery: string;
  catalogResults: AlchemyCatalogItem[];
  catalogSearching: boolean;
  onSearch: (value: string) => void;
  onSelectIngredient: (item: PaletteObject) => void;
  onNew: () => void;
  onEdit: (element: AlchemyElement) => void;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onImage: (value: string) => void;
  onExpression: (value: string, cursor: number) => void;
  onIngredients: (value: RecipeIngredient[]) => void;
  onReplace: (value: boolean) => void;
  onSave: () => void;
}) {
  const [listQuery, setListQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [cursor, setCursor] = useState(adminExpression.length);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lookup = expressionLookup(adminExpression, cursor);
  const filteredElements = elements.filter((item) => item.name.toLowerCase().includes(listQuery.trim().toLowerCase()));
  const suggestions = useMemo(() => {
    const value = (lookup?.query || searchQuery).toLowerCase();
    const elementItems = palette.filter((item) => item.type === "element" && item.title.toLowerCase().includes(value));
    const catalogItems = catalogResults.map(paletteFromCatalog).filter((item) => item.title.toLowerCase().includes(value));
    return [...elementItems, ...catalogItems].slice(0, 8);
  }, [catalogResults, lookup?.query, palette, searchQuery]);
  const chooseSuggestion = (item: PaletteObject) => {
    if (advanced && lookup) {
      const next = `${adminExpression.slice(0, lookup.start)}${lookup.prefix}${item.sourceId}")${adminExpression.slice(cursor)}`;
      onExpression(next, lookup.start + lookup.prefix.length + String(item.sourceId).length + 2);
    } else {
      onSelectIngredient(item);
    }
    onSearch("");
  };
  const handleExpressionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextCursor = event.target.selectionStart;
    setCursor(nextCursor);
    onExpression(event.target.value, nextCursor);
    const nextLookup = expressionLookup(event.target.value, nextCursor);
    onSearch(nextLookup?.query || "");
  };
  const insertOperator = (operator: string) => {
    const start = editorRef.current?.selectionStart ?? cursor;
    const end = editorRef.current?.selectionEnd ?? start;
    const next = adminExpression.slice(0, start) + operator + adminExpression.slice(end);
    const nextCursor = start + operator.length;
    onExpression(next, nextCursor);
    setCursor(nextCursor);
    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };
  useEffect(() => setCursor(adminExpression.length), [adminElement?.id]);
  return (
    <section className="surface overflow-hidden rounded-2xl border shadow-xl shadow-black/5">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/12 text-violet-400"><Icon icon="material-symbols:admin-panel-settings-outline" /></span>
          <div><h2 className="font-semibold">Керування елементами</h2><p className="text-xs text-muted-foreground">Створюйте та редагуйте базові елементи алхімії.</p></div>
        </div>
        <Button variant="outline" size="sm" onClick={onNew}><Icon icon="material-symbols:add" /> Новий елемент</Button>
      </div>
      <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b p-3 lg:flex lg:min-h-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center justify-between px-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Каталог</p><span className="text-xs text-muted-foreground">{elements.length}</span></div>
          <p className="mb-2 px-2 text-[11px] text-muted-foreground">Базові елементи захищені від видалення.</p>
          <Input value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Знайти елемент" className="mb-2 h-9" />
          <div className="max-h-72 space-y-1 overflow-y-auto lg:min-h-0 lg:max-h-none lg:flex-1">
            {filteredElements.map((element) => <div key={element.id} className={`flex items-center gap-1 rounded-lg p-1 ${adminElement?.id === element.id ? "bg-violet-500/12" : "hover:bg-muted/60"}`}>
              <button type="button" className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm" onClick={() => void onEdit(element)}>{element.name}</button>
            </div>)}
          </div>
        </aside>
        <div className="p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3"><div><p className="font-medium">{adminElement ? `Редагування: ${adminElement.name}` : "Новий базовий елемент"}</p><p className="mt-1 text-xs text-muted-foreground">{adminElement ? "Змініть метадані або замініть вектор рецептом." : "Сформуйте вектор із рецепту або останньої реакції."}</p></div></div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">Назва<Input value={adminName} onChange={(event) => onName(event.target.value)} placeholder="Наприклад, Світло" /></label>
            <label className="grid gap-1.5 text-sm font-medium">URL зображення<Input value={adminImageUrl} onChange={(event) => onImage(event.target.value)} placeholder="https://…" /></label>
            <label className="grid gap-1.5 text-sm font-medium md:col-span-2">Опис<Input value={adminDescription} onChange={(event) => onDescription(event.target.value)} placeholder="Коротке пояснення елемента" /></label>
          </div>
          <div className={`mt-5 rounded-2xl border p-4 ${replaceVector ? "border-violet-400/50 bg-violet-500/8" : "bg-muted/25"}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium">Рецепт вектора</p><p className="mt-1 text-xs text-muted-foreground">+ і − поєднують вектори; * / ^ працюють із числами; дужки групують вираз.</p></div>{adminElement && <Button size="sm" variant={replaceVector ? "default" : "outline"} onClick={() => onReplace(!replaceVector)}>{replaceVector ? "Зберігати рецепт" : "Замінити вектор"}</Button>}</div>
            {replaceVector && <>
              <div className="relative mt-4">
                <Icon icon="material-symbols:add-circle-outline" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
                <Input value={searchQuery} onChange={(event) => onSearch(event.target.value)} placeholder="Додати інгредієнт до рецепту…" className="h-10 rounded-xl pl-9" />
                {(searchQuery.trim() || lookup) && suggestions.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border bg-popover p-1 shadow-2xl">{suggestions.map((item) => <button type="button" key={item.paletteId} onClick={() => chooseSuggestion(item)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-accent"><Icon icon={typeIcon(item.type)} className="text-violet-400" /><span className="min-w-0 flex-1 truncate text-sm">{item.title}</span><span className="text-[10px] uppercase text-muted-foreground">{item.type}</span></button>)}</div>}
              </div>
              <div className="mt-3 flex min-h-10 flex-wrap gap-2">{recipeIngredients.map((ingredient, index) => <RecipeChip key={`${ingredient.paletteId}-${index}`} ingredient={ingredient} onWeight={() => onIngredients(recipeIngredients.map((item, itemIndex) => itemIndex === index ? { ...item, weight: item.weight === 1 ? -1 : 1 } : item))} onRemove={() => onIngredients(recipeIngredients.filter((_, itemIndex) => itemIndex !== index))} />)}{!recipeIngredients.length && <span className="text-sm text-muted-foreground">Поки що немає інгредієнтів.</span>}</div>
              <div className="mt-3 flex items-center justify-between gap-2"><button type="button" onClick={() => { setAdvanced((value) => !value); if (!adminExpression && recipeIngredients.length) onExpression(ingredientsToExpression(recipeIngredients), 0); }} className="text-xs font-medium text-violet-400 hover:text-violet-300">{advanced ? "Сховати редактор синтаксису" : "Відкрити редактор синтаксису"}</button>{lastRecipe && <span className="truncate text-xs text-muted-foreground">Остання реакція: {lastRecipe.label}</span>}</div>
              {advanced && <>
                <div className="mt-3 flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background/50 p-1.5"><span className="px-1.5 text-[11px] text-muted-foreground">Оператори</span>{[" + ", " − ", " * ", " / ", " ^ ", "(", ")"].map((operator) => <button type="button" key={operator} onClick={() => insertOperator(operator === " − " ? " - " : operator)} className="min-w-7 rounded-lg px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-accent">{operator.trim()}</button>)}</div>
                <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-background/70 font-mono text-sm"><pre aria-hidden className="pointer-events-none min-h-24 whitespace-pre-wrap break-words p-3 leading-6"><HighlightedExpression value={adminExpression} /></pre><textarea ref={editorRef} value={adminExpression} onChange={handleExpressionChange} onSelect={(event) => setCursor(event.currentTarget.selectionStart)} onClick={(event) => setCursor(event.currentTarget.selectionStart)} spellCheck={false} className="absolute inset-0 min-h-24 w-full resize-y bg-transparent p-3 font-mono text-sm leading-6 text-transparent caret-foreground outline-none selection:bg-violet-400/30" aria-label="Векторний вираз" placeholder={'anime("frieren-123") + 2 * (element("2") - manga("one-piece"))'} />{lookup && suggestions.length > 0 && <div className="absolute left-3 top-full z-10 mt-1 hidden rounded-lg border bg-popover p-1 shadow-lg sm:block">{suggestions.slice(0, 5).map((item) => <button type="button" key={item.paletteId} onClick={() => chooseSuggestion(item)} className="block px-2 py-1 text-left text-xs hover:bg-accent">{item.type}("{item.sourceId}") · {item.title}</button>)}</div>}</div>
              </>}
            </>}
            {!replaceVector && <p className="mt-3 text-xs text-muted-foreground">Поточний 256-вимірний вектор буде збережено без змін.</p>}
          </div>
          <div className="mt-5 flex gap-2"><Button onClick={onSave} disabled={saving || !adminName.trim() || (!adminElement && !replaceVector)}>{saving ? "Збереження…" : adminElement ? "Зберегти зміни" : "Створити елемент"}</Button><Button variant="ghost" onClick={onNew}>Очистити</Button></div>
        </div>
      </div>
    </section>
  );
}

const VectorAlchemyPageComponent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = Boolean(user?.roles.includes("ADMIN"));
  const viewportRef = useRef<HTMLDivElement>(null);
  const boardDrop = useDroppable({ id: "board" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [crafting, setCrafting] = useState(false);
  const [reactionNotice, setReactionNotice] = useState<ReactionNotice | null>(null);
  const [lastRecipe, setLastRecipe] = useState<Recipe | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminElement, setAdminElement] = useState<AlchemyElement | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminDescription, setAdminDescription] = useState("");
  const [adminImageUrl, setAdminImageUrl] = useState("");
  const [adminExpression, setAdminExpression] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [adminSaving, setAdminSaving] = useState(false);
  const [replaceVector, setReplaceVector] = useState(true);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const setCatalogError = useCallback((message: string) => setError(message), []);
  const { elements, setElements, palette, setPalette, isLoading: loading } = useAlchemyPalette(setCatalogError);
  const { query: catalogQuery, setQuery: setCatalogQuery, results: catalogResults, isSearching: catalogSearching, clear: clearCatalog } = useAlchemyCatalogSearch(setCatalogError);
  const onIngredientQuery = useCallback((value: string) => {
    setIngredientQuery(value);
    setCatalogQuery(value);
  }, [setCatalogQuery]);
  const panRef = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const viewRef = useRef({ pan, zoom });
  viewRef.current = { pan, zoom };

  const zoomAt = useCallback((requestedZoom: number, focalPoint?: { x: number; y: number }) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const current = viewRef.current;
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, requestedZoom));
    if (next === current.zoom) return;
    const x = focalPoint?.x ?? viewport.clientWidth / 2;
    const y = focalPoint?.y ?? viewport.clientHeight / 2;
    const ratio = next / current.zoom;
    setPan({ x: x - (x - current.pan.x) * ratio, y: y - (y - current.pan.y) * ratio });
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
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min((rect.width - padding * 2) / contentWidth, (rect.height - padding * 2) / contentHeight)));
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
  const addToPalette = useCallback((item: PaletteObject) => setPalette((current) => current.some((existing) => existing.paletteId === item.paletteId) ? current : [...current, item]), [setPalette]);
  const removeFromPalette = useCallback((paletteId: string) => setPalette((current) => current.filter((item) => item.type === "element" || item.paletteId !== paletteId)), [setPalette]);
  useEffect(() => { const remove = (event: Event) => removeFromPalette((event as CustomEvent<string>).detail); window.addEventListener("alchemy-remove-palette", remove); return () => window.removeEventListener("alchemy-remove-palette", remove); }, [removeFromPalette]);

  const craft = useCallback(async (first: BoardCard, second: BoardCard, x: number, y: number, consumedIds: string[]) => {
    const ingredients = [asIngredient(first), asIngredient(second)];
    setCards((current) => current.filter((card) => !consumedIds.includes(card.instanceId)));
    setReactionNotice({ x, y, label: `${first.title} + ${second.title}` });
    setCrafting(true);
    try {
      const response = await AlchemyService.query(ingredients);
      setLastRecipe({ ingredients, label: `${first.title} + ${second.title}` });
      if (response.content.length) {
        // The backend already returns candidates in deterministic similarity
        // order. Random near-tie selection made the same recipe produce
        // different results and caused unexplained titles to recur.
        const chosen = response.content[0];
        setCards((current) => [...current, cardFromResult(chosen, x, y)]);
      }
      setReactionNotice(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алхімічна реакція не вдалася.");
      setReactionNotice(null);
    } finally { setCrafting(false); }
  }, []);
  const getDropClientPoint = (event: DragEndEvent) => { const initial = event.active.rect.current.initial; return initial ? { x: initial.left + event.delta.x + initial.width / 2, y: initial.top + event.delta.y + initial.height / 2 } : null; };
  const toBoardPoint = (event: DragEndEvent) => { const rect = viewportRef.current?.getBoundingClientRect(); const point = getDropClientPoint(event); if (!rect || !point) return { x: 120, y: 100 }; return { x: Math.max(0, (point.x - rect.left - pan.x) / zoom - CARD_WIDTH / 2), y: Math.max(0, (point.y - rect.top - pan.y) / zoom - CARD_HEIGHT / 2) }; };
  const onDragStart = (event: DragStartEvent) => { const data = event.active.data.current as DragData; if (data.card) setActiveCard(data.card); else if (data.palette) setActiveCard(cardFromPalette(data.palette, 0, 0)); else if (data.catalog) setActiveCard(cardFromPalette(paletteFromCatalog(data.catalog), 0, 0)); };
  const onDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragData;
    const overId = String(event.over?.id ?? "");
    const hovered = event.over?.data.current?.card as BoardCard | undefined;
    const targetCard = hovered?.instanceId === data.card?.instanceId ? undefined : hovered;
    const client = getDropClientPoint(event); const rect = viewportRef.current?.getBoundingClientRect();
    const isInsideBoard = overId === "board" || overId.startsWith("target:") || Boolean(client && rect && client.x >= rect.left && client.x <= rect.right && client.y >= rect.top && client.y <= rect.bottom);
    const point = toBoardPoint(event); setActiveCard(null);
    // Do not treat a transiently missing collision target as a delete action.
    // The board bounds are the reliable source of truth for drops from the dock;
    // palette items are removed explicitly with their close button.
    if (data.source === "palette" && !isInsideBoard) return;
    if (data.source === "catalog" && !isInsideBoard && data.catalog) { addToPalette(paletteFromCatalog(data.catalog)); clearCatalog(); return; }
    if (!isInsideBoard) return;
    if (data.source === "board" && data.card) { const moved = { ...data.card, x: point.x, y: point.y }; if (targetCard) void craft(moved, targetCard, targetCard.x, targetCard.y, [moved.instanceId, targetCard.instanceId]); else setCards((current) => current.map((card) => card.instanceId === moved.instanceId ? moved : card)); return; }
    const item = data.palette ?? (data.catalog ? paletteFromCatalog(data.catalog) : null); if (!item) return;
    const added = cardFromPalette(item, point.x, point.y);
    if (targetCard) void craft(added, targetCard, targetCard.x, targetCard.y, [targetCard.instanceId]); else setCards((current) => [...current, added]);
    if (data.catalog) clearCatalog();
  };
  const toggleCardSign = (id: string) => setCards((current) => current.map((card) => card.instanceId === id ? { ...card, sign: card.sign === 1 ? -1 : 1 } : card));
  const onBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => { if ((event.target as HTMLElement).closest("button, input, textarea, [data-board-card], [data-ingredient-dock]")) return; panRef.current = { clientX: event.clientX, clientY: event.clientY, x: pan.x, y: pan.y }; };
  const onBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => { if (!panRef.current) return; setPan({ x: panRef.current.x + event.clientX - panRef.current.clientX, y: panRef.current.y + event.clientY - panRef.current.clientY }); };
  const prepareCreate = useCallback(() => { setAdminElement(null); setAdminName(""); setAdminDescription(""); setAdminImageUrl(""); setReplaceVector(true); setAdminExpression(lastRecipe ? ingredientsToExpression(recipeIngredientsFromRecipe(lastRecipe, palette)) : ""); setRecipeIngredients(lastRecipe ? recipeIngredientsFromRecipe(lastRecipe, palette) : []); setError(null); }, [lastRecipe, palette]);
  const openAdmin = () => { setAdminMode(true); if (!adminElement) prepareCreate(); };
  const prepareEdit = async (element: AlchemyElement) => { try { await AlchemyService.getAdminElement(element.id); setAdminElement(element); setAdminName(element.name); setAdminDescription(element.description || ""); setAdminImageUrl(element.imageUrl || ""); setReplaceVector(false); setRecipeIngredients([]); setAdminExpression(""); setError(null); } catch (err) { setError(err instanceof Error ? err.message : "Немає доступу до елемента."); } };
  const updateRecipeIngredients = useCallback((value: RecipeIngredient[]) => {
    setRecipeIngredients(value);
    // Keep the visual recipe and advanced editor synchronized. This prevents
    // the save path from silently using an older expression.
    setAdminExpression(ingredientsToExpression(value));
  }, []);
  const saveAdminElement = async () => {
    if (!adminName.trim()) return setError("Вкажіть назву елемента.");
    let sourceIngredients: AlchemyIngredient[] | undefined;
    try { sourceIngredients = recipeIngredients.length ? recipeIngredients.map(({ type, sourceId, weight }) => type === "element" ? { type, id: Number(sourceId), weight } : { type, slug: String(sourceId), weight }) : lastRecipe?.ingredients; } catch (err) { return setError(err instanceof Error ? err.message : "Некоректний рецепт."); }
    if (replaceVector && !adminExpression.trim() && !sourceIngredients?.length) return setError("Додайте інгредієнти до рецепту.");
    setAdminSaving(true);
    try {
      const embedding = adminElement && !replaceVector
        ? await AlchemyService.getEmbedding("element", adminElement.id)
        : adminExpression.trim()
          ? await createExpressionEmbedding(adminExpression)
          : await createRecipeEmbedding(sourceIngredients!);
      const payload = { name: adminName.trim(), description: adminDescription || null, imageUrl: adminImageUrl || null, embedding };
      const saved = adminElement ? await AlchemyService.updateElement(adminElement.id, payload) : await AlchemyService.createElement(payload);
      setElements((current) => adminElement ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)));
      setPalette((current) => current.some((item) => item.paletteId === `element:${saved.id}`) ? current.map((item) => item.paletteId === `element:${saved.id}` ? paletteFromElement(saved) : item) : [...current, paletteFromElement(saved)]);
      prepareCreate(); setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Не вдалося зберегти елемент."); } finally { setAdminSaving(false); }
  };
  const selectAdminIngredient = (item: PaletteObject) => { updateRecipeIngredients(recipeIngredients.some((ingredient) => ingredient.paletteId === item.paletteId) ? recipeIngredients : [...recipeIngredients, toRecipeIngredient(item)]); setIngredientQuery(""); setCatalogQuery(""); };

  if (loading) return <ModulePageTransition stateKey="loading"><main className="mx-auto mt-8 max-w-[92rem] px-4 lg:mt-12">Завантаження алхімічної мапи…</main></ModulePageTransition>;
  return <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveCard(null)}>
    <ModulePageTransition stateKey="alchemy"><main className="mx-auto my-5 w-full max-w-[92rem] px-3 sm:px-5 lg:my-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3"><a href="/" className="flex size-9 items-center justify-center rounded-xl border text-muted-foreground hover:bg-accent" aria-label="На головну"><Icon icon="material-symbols:arrow-back" /></a><div><div className="flex items-center gap-2"><Icon icon="material-symbols:science-outline" className="text-xl text-violet-400" /><h1 className="text-xl font-bold tracking-tight sm:text-2xl">Векторна алхімія</h1></div><p className="hidden text-xs text-muted-foreground sm:block">Поєднуйте ідеї, а не просто слова.</p></div></div>
        <div className="flex items-center gap-2"><div className="hidden rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:block">{crafting ? "Шукаємо реакцію…" : "Двічі клікніть картку, щоб змінити знак"}</div>{isAdmin && <Button size="sm" variant={adminMode ? "default" : "outline"} onClick={() => adminMode ? setAdminMode(false) : openAdmin()}><Icon icon={adminMode ? "material-symbols:play-arrow" : "material-symbols:admin-panel-settings-outline"} />{adminMode ? "До гри" : "Керування"}</Button>}</div>
      </header>
      {error && <div className="mb-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"><Icon icon="material-symbols:error-outline" />{error}</div>}
      {adminMode && !authLoading ? <AdminWorkspace elements={elements} palette={palette} adminElement={adminElement} adminName={adminName} adminDescription={adminDescription} adminImageUrl={adminImageUrl} adminExpression={adminExpression} recipeIngredients={recipeIngredients} replaceVector={replaceVector} lastRecipe={lastRecipe} saving={adminSaving} searchQuery={catalogQuery} catalogResults={catalogResults} catalogSearching={catalogSearching} onSearch={setCatalogQuery} onSelectIngredient={selectAdminIngredient} onNew={prepareCreate} onEdit={prepareEdit} onName={setAdminName} onDescription={setAdminDescription} onImage={setAdminImageUrl} onExpression={(value) => setAdminExpression(value)} onIngredients={updateRecipeIngredients} onReplace={setReplaceVector} onSave={saveAdminElement} /> : <>
        <section ref={(node) => { viewportRef.current = node; boardDrop.setNodeRef(node); }} className={`relative mt-3 h-[min(76svh,850px)] min-h-[430px] overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-black/10 touch-none sm:min-h-[520px] ${boardDrop.isOver ? "ring-2 ring-violet-400/50" : ""}`} onPointerDown={onBoardPointerDown} onPointerMove={onBoardPointerMove} onPointerUp={() => { panRef.current = null; }} onPointerCancel={() => { panRef.current = null; }}>
          <UnifiedIngredientDock elements={elements} palette={palette} query={ingredientQuery} onQuery={onIngredientQuery} catalogResults={catalogResults} catalogSearching={catalogSearching} onRemove={removeFromPalette} />
          <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:26px_26px]" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-border/60 bg-background/75 px-3 py-2 text-center text-xs text-muted-foreground backdrop-blur">{boardDrop.isOver ? <span className="font-medium text-violet-400">Відпустіть, щоб додати</span> : "Тягніть фон — рух · колесо — масштаб"}</div>
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-xl border bg-background/80 p-1 backdrop-blur">
            <Button size="icon-sm" variant="ghost" onClick={() => zoomAt(zoom * 1.2)} title="Збільшити" aria-label="Збільшити"><Icon icon="material-symbols:add" /></Button>
            <span className="min-w-10 text-center text-[11px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button size="icon-sm" variant="ghost" onClick={() => zoomAt(zoom * 0.8)} title="Зменшити" aria-label="Зменшити"><Icon icon="material-symbols:remove" /></Button>
            <Button size="icon-sm" variant="ghost" onClick={fitCards} title="Вмістити картки" aria-label="Вмістити картки"><Icon icon="material-symbols:fit-screen" /></Button>
          </div>
          <div className="absolute left-0 top-0 h-full w-full" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            {cards.map((card) => <BoardCardView key={card.instanceId} card={card} draggingSign={activeCard?.sign} onToggleSign={toggleCardSign} />)}
            {reactionNotice && <div role="status" aria-label={`Обчислення реакції: ${reactionNotice.label}`} className="pointer-events-none absolute z-20 flex h-[112px] w-[220px] animate-pulse gap-2.5 rounded-xl border border-violet-300/70 bg-card/90 p-2.5 shadow-[0_0_0_3px_rgba(167,139,250,.1),0_0_26px_rgba(139,92,246,.3)]" style={{ left: reactionNotice.x, top: reactionNotice.y }}>
              <span className="h-full w-16 shrink-0 rounded-lg bg-muted/80" />
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <span className="h-3 w-4/5 rounded-full bg-muted/90" />
                <span className="h-3 w-3/5 rounded-full bg-muted/70" />
                <span className="h-2 w-2/5 rounded-full bg-muted/60" />
              </span>
            </div>}
          </div>
          {!cards.length && !reactionNotice && <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center"><div className="max-w-xs"><span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400"><Icon icon="material-symbols:gesture" className="text-3xl" /></span><p className="font-medium">Перетягніть два інгредієнти сюди</p><p className="mt-1 text-sm text-muted-foreground">Вони зʼявляться на мапі, а поєднання відкриють нові результати.</p></div></div>}
        </section>
      </>}
    </main></ModulePageTransition>
    <DragOverlay dropAnimation={null}>{activeCard && <article className={`flex h-[112px] w-[220px] gap-2.5 overflow-hidden rounded-xl border-2 bg-card p-2.5 shadow-xl ${activeCard.sign < 0 ? "border-red-400 shadow-[0_0_22px_rgba(248,113,113,.35)]" : "border-white shadow-[0_0_18px_rgba(255,255,255,.22)]"}`}><CardBody card={activeCard} /></article>}</DragOverlay>
  </DndContext>;
};

export default VectorAlchemyPageComponent;
