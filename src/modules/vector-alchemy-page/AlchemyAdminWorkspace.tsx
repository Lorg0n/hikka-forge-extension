import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type AlchemyCatalogItem,
  type AlchemyElement,
} from "@/services/alchemyService";
import type { PaletteObject, Recipe, RecipeIngredient } from "./alchemy.types";
import { catalogSuggestionItems } from "./alchemy.admin";
import { typeIcon } from "./alchemy.icons";

function HighlightedExpression({ value }: { value: string }) {
  const parts = value.split(/(element|anime|manga|[+*^()/-]|[()"])/g);
  return (
    <>
      {parts.map((part, index) => {
        const className = /^(element|anime|manga)$/.test(part)
          ? "text-sky-400"
          : /^[+*^/-]$/.test(part)
            ? "text-amber-300"
            : /^[()]$/.test(part)
              ? "text-violet-300"
              : part === '"'
                ? "text-emerald-300"
                : "text-foreground";
        return (
          <span className={className} key={`${part}-${index}`}>
            {part}
          </span>
        );
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

function RecipeChip({
  ingredient,
  onWeight,
  onRemove,
}: {
  ingredient: RecipeIngredient;
  onWeight: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ${ingredient.weight < 0 ? "border-red-400/50 bg-red-500/8" : "border-border bg-muted/35"}`}
    >
      <button
        type="button"
        onClick={onWeight}
        className={`text-sm font-bold ${ingredient.weight < 0 ? "text-red-300" : "text-emerald-300"}`}
        aria-label="Змінити знак"
      >
        {ingredient.weight < 0 ? "−" : "+"}
      </button>
      <Icon icon={typeIcon(ingredient.type)} className="shrink-0 text-violet-400" />
      <span className="max-w-[12rem] truncate text-sm">{ingredient.title}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-muted-foreground opacity-60 hover:text-foreground hover:opacity-100"
        aria-label={`Видалити ${ingredient.title}`}
      >
        <Icon icon="material-symbols:close" className="text-base" />
      </button>
    </div>
  );
}

export function AlchemyAdminWorkspace({
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
  onDelete,
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
  onDelete: (element: AlchemyElement) => void;
}) {
  const [listQuery, setListQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [cursor, setCursor] = useState(adminExpression.length);
  const [deleteTarget, setDeleteTarget] = useState<AlchemyElement | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const adminExpressionRef = useRef(adminExpression);
  const adminElementRef = useRef(adminElement);
  adminExpressionRef.current = adminExpression;
  adminElementRef.current = adminElement;
  const lookup = expressionLookup(adminExpression, cursor);
  const filteredElements = elements.filter((item) =>
    item.name.toLowerCase().includes(listQuery.trim().toLowerCase()),
  );
  const suggestions = useMemo(
    () => catalogSuggestionItems(palette, catalogResults, lookup?.query || searchQuery),
    [catalogResults, lookup?.query, palette, searchQuery],
  );

  const chooseSuggestion = (item: PaletteObject) => {
    if (advanced && lookup) {
      const next = `${adminExpression.slice(0, lookup.start)}${lookup.prefix}${item.sourceId}")${adminExpression.slice(cursor)}`;
      onExpression(next, lookup.start + lookup.prefix.length + String(item.sourceId).length + 2);
    } else {
      onSelectIngredient(item);
    }
    onSearch("");
  };

  const handleExpressionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
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

  useEffect(() => {
    setCursor(adminExpressionRef.current.length);
    setAdvanced(Boolean(adminElementRef.current && adminExpressionRef.current.trim()));
  }, [adminElement?.id]);

  return (
    <section className="surface overflow-hidden rounded-2xl border shadow-xl shadow-black/5">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/12 text-violet-400">
            <Icon icon="material-symbols:admin-panel-settings-outline" />
          </span>
          <div>
            <h2 className="font-semibold">Керування елементами</h2>
            <p className="text-xs text-muted-foreground">Створюйте та редагуйте базові елементи алхімії.</p>
          </div>
        </div>
      </div>
      <div className="grid lg:items-stretch lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b p-3 lg:flex lg:min-h-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Каталог</p>
            <span className="text-xs text-muted-foreground">{elements.length}</span>
          </div>
          <p className="mb-2 px-2 text-[11px] text-muted-foreground">Видалення елемента незворотне.</p>
          <div className="mb-2 flex items-center gap-2">
            <Input value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Знайти елемент" className="h-9 min-w-0 flex-1" />
            <Button type="button" variant="outline" size="icon-sm" onClick={onNew} title="Новий елемент" aria-label="Створити новий елемент">
              <Icon icon="material-symbols:add" />
            </Button>
          </div>
          <div className="max-h-72 min-h-0 space-y-1 overflow-y-auto lg:flex-1 lg:max-h-none">
            {filteredElements.map((element) => (
              <div key={element.id} className={`group flex items-center gap-1 rounded-lg p-1 ${adminElement?.id === element.id ? "bg-violet-500/12" : "hover:bg-muted/60"}`}>
                <button type="button" className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm" onClick={() => void onEdit(element)}>{element.name}</button>
                <Button type="button" size="icon-xs" variant="ghost" className="text-red-400 opacity-0 transition-opacity hover:bg-red-500/15 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100" onClick={() => setDeleteTarget(element)} aria-label={`Видалити ${element.name}`}><Icon icon="material-symbols:delete-outline" /></Button>
              </div>
            ))}
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
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити базовий елемент?</AlertDialogTitle>
            <AlertDialogDescription>«{deleteTarget?.name}» буде видалено з backend і з поточної алхімічної мапи. Цю дію неможливо скасувати.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null); }}>Видалити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
