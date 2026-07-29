import React, { useCallback, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModulePageTransition } from "@/components/ui/module-page-transition";
import { useAuth } from "@/contexts/ModuleAuthContext";
import {
  AlchemyService,
  briefAlchemyError,
  type AlchemyElement,
  type AlchemyIngredient,
} from "@/services/alchemyService";
import type { PaletteObject, RecipeIngredient } from "./alchemy.types";
import { paletteFromElement } from "./alchemy.utils";
import {
  createExpressionEmbedding,
  createRecipeEmbedding,
} from "./alchemy.recipe";
import { useAlchemyCatalogSearch } from "./useAlchemyCatalogSearch";
import { useAlchemyPalette } from "./useAlchemyPalette";
import { useAlchemyBoard } from "./useAlchemyBoard";
import { AlchemyAdminWorkspace } from "./AlchemyAdminWorkspace";
import {
  ingredientsToExpression,
  recipeIngredientsFromRecipe,
  toRecipeIngredient,
} from "./alchemy.admin";
import { AlchemyBoard } from "./AlchemyBoard";
import { CardBody } from "./alchemy-card-components";

const VectorAlchemyPageComponent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = Boolean(user?.roles.includes("ADMIN"));
  const [error, setError] = useState<string | null>(null);
  const setCatalogError = useCallback((message: string) => setError(message), []);
  const { elements, setElements, palette, setPalette, isLoading: loading } =
    useAlchemyPalette(setCatalogError);
  const {
    query: catalogQuery,
    setQuery: setCatalogQuery,
    results: catalogResults,
    isSearching: catalogSearching,
    clear: clearCatalog,
  } = useAlchemyCatalogSearch();
  const [adminMode, setAdminMode] = useState(false);
  const [adminElement, setAdminElement] = useState<AlchemyElement | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminDescription, setAdminDescription] = useState("");
  const [adminImageUrl, setAdminImageUrl] = useState("");
  const [adminExpression, setAdminExpression] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [adminSaving, setAdminSaving] = useState(false);
  const [replaceVector, setReplaceVector] = useState(true);

  const addToPalette = useCallback(
    (item: PaletteObject) =>
      setPalette((current) =>
        current.some((existing) => existing.paletteId === item.paletteId)
          ? current
          : [...current, item],
      ),
    [setPalette],
  );
  const removeFromPalette = useCallback(
    (paletteId: string) =>
      setPalette((current) =>
        current.filter(
          (item) => item.type === "element" || item.paletteId !== paletteId,
        ),
      ),
    [setPalette],
  );
  const onIngredientQuery = setCatalogQuery;

  React.useEffect(() => {
    const remove = (event: Event) =>
      removeFromPalette((event as CustomEvent<string>).detail);
    window.addEventListener("alchemy-remove-palette", remove);
    return () => window.removeEventListener("alchemy-remove-palette", remove);
  }, [removeFromPalette]);

  const board = useAlchemyBoard({
    setError: (message) => setError(message || null),
    addToPalette,
    clearCatalog,
  });

  const prepareCreate = useCallback(() => {
    const expression = board.lastRecipe
      ? ingredientsToExpression(
          recipeIngredientsFromRecipe(board.lastRecipe, palette),
        )
      : "";
    setAdminElement(null);
    setAdminName("");
    setAdminDescription("");
    setAdminImageUrl("");
    setReplaceVector(true);
    setAdminExpression(expression);
    setRecipeIngredients(
      board.lastRecipe
        ? recipeIngredientsFromRecipe(board.lastRecipe, palette)
        : [],
    );
    setError(null);
  }, [board.lastRecipe, palette]);

  const openAdmin = () => {
    setAdminMode(true);
    if (!adminElement) prepareCreate();
  };

  const prepareEdit = async (element: AlchemyElement) => {
    try {
      const loaded = await AlchemyService.getAdminElement(element.id);
      setAdminElement(loaded);
      setAdminName(loaded.name);
      setAdminDescription(loaded.description || "");
      setAdminImageUrl(loaded.imageUrl || "");
      setReplaceVector(Boolean(loaded.adminDescription?.trim()));
      setRecipeIngredients([]);
      setAdminExpression(loaded.adminDescription || "");
      setError(null);
    } catch (loadError) {
      setError(briefAlchemyError(loadError, "Не вдалося відкрити елемент."));
    }
  };

  const updateAdminExpression = useCallback((value: string) => {
    setAdminExpression(value);
  }, []);
  const updateRecipeIngredients = useCallback(
    (value: RecipeIngredient[]) => {
      setRecipeIngredients(value);
      setAdminExpression(ingredientsToExpression(value));
    },
    [],
  );

  const saveAdminElement = async () => {
    if (!adminName.trim()) {
      setError("Вкажіть назву елемента.");
      return;
    }
    let sourceIngredients: AlchemyIngredient[] | undefined;
    try {
      sourceIngredients = recipeIngredients.length
        ? recipeIngredients.map(({ type, sourceId, weight }) =>
            type === "element"
              ? { type, id: Number(sourceId), weight }
              : { type, slug: String(sourceId), weight },
          )
        : board.lastRecipe?.ingredients;
    } catch (saveError) {
      setError(briefAlchemyError(saveError, "Некоректний рецепт."));
      return;
    }
    if (replaceVector && !adminExpression.trim() && !sourceIngredients?.length) {
      setError("Додайте інгредієнти до рецепту.");
      return;
    }
    setAdminSaving(true);
    try {
      const embedding = adminElement && !replaceVector
        ? await AlchemyService.getEmbedding("element", adminElement.id)
        : adminExpression.trim()
          ? await createExpressionEmbedding(adminExpression)
          : await createRecipeEmbedding(sourceIngredients!);
      const payload = {
        name: adminName.trim(),
        description: adminDescription || null,
        adminDescription: adminExpression.trim() || null,
        imageUrl: adminImageUrl || null,
        embedding,
      };
      const saved = adminElement
        ? await AlchemyService.updateElement(adminElement.id, payload)
        : await AlchemyService.createElement(payload);
      setElements((current) =>
        adminElement
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setPalette((current) =>
        current.some((item) => item.paletteId === `element:${saved.id}`)
          ? current.map((item) =>
              item.paletteId === `element:${saved.id}`
                ? paletteFromElement(saved)
                : item,
            )
          : [...current, paletteFromElement(saved)],
      );
      prepareCreate();
      setError(null);
    } catch (saveError) {
      setError(briefAlchemyError(saveError, "Не вдалося зберегти елемент."));
    } finally {
      setAdminSaving(false);
    }
  };

  const deleteAdminElement = async (element: AlchemyElement) => {
    setAdminSaving(true);
    try {
      await AlchemyService.deleteElement(element.id);
      setElements((current) => current.filter((item) => item.id !== element.id));
      setPalette((current) =>
        current.filter((item) => item.paletteId !== `element:${element.id}`),
      );
      board.removeCardsForElement(element.id);
      if (adminElement?.id === element.id) prepareCreate();
      setError(null);
    } catch (deleteError) {
      setError(briefAlchemyError(deleteError, "Не вдалося видалити елемент."));
    } finally {
      setAdminSaving(false);
    }
  };

  const selectAdminIngredient = (item: PaletteObject) => {
    updateRecipeIngredients(
      recipeIngredients.some((ingredient) => ingredient.paletteId === item.paletteId)
        ? recipeIngredients
        : [...recipeIngredients, toRecipeIngredient(item)],
    );
    setIngredientQuery("");
    clearCatalog();
  };

  if (loading) {
    return (
      <ModulePageTransition stateKey="loading">
        <main className="mx-auto my-5 w-full max-w-[92rem] px-3 sm:px-5 lg:my-8">
          <div className="mb-4 flex items-center gap-3 px-1">
            <Skeleton className="size-9 rounded-xl" />
            <span className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-64" />
            </span>
          </div>
          <Skeleton className="h-[min(76svh,850px)] min-h-[430px] w-full rounded-2xl sm:min-h-[520px]" />
        </main>
      </ModulePageTransition>
    );
  }

  return (
    <DndContext
      sensors={board.sensors}
      onDragStart={board.onDragStart}
      onDragMove={board.onDragMove}
      onDragEnd={board.onDragEnd}
      onDragCancel={board.clearActiveCard}
    >
      <ModulePageTransition stateKey="alchemy">
        <main className="mx-auto my-5 w-full max-w-[92rem] px-3 sm:px-5 lg:my-8">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex size-9 items-center justify-center rounded-xl border text-muted-foreground hover:bg-accent"
                aria-label="На головну"
              >
                <Icon icon="material-symbols:arrow-back" />
              </a>
              <div>
                <div className="flex items-center gap-2">
                  <Icon icon="material-symbols:science-outline" className="text-xl text-violet-400" />
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Векторна алхімія</h1>
                </div>
                <p className="hidden text-xs text-muted-foreground sm:block">Поєднуйте ідеї, а не просто слова.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:block">
                {board.crafting ? "Шукаємо реакцію…" : "Двічі клікніть картку, щоб змінити знак"}
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  variant={adminMode ? "default" : "outline"}
                  onClick={() => (adminMode ? setAdminMode(false) : openAdmin())}
                >
                  <Icon icon={adminMode ? "material-symbols:play-arrow" : "material-symbols:admin-panel-settings-outline"} />
                  {adminMode ? "До гри" : "Керування"}
                </Button>
              )}
            </div>
          </header>
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <Icon icon="material-symbols:error-outline" />
              {error}
            </div>
          )}
          {adminMode && !authLoading ? (
            <AlchemyAdminWorkspace
              elements={elements}
              palette={palette}
              adminElement={adminElement}
              adminName={adminName}
              adminDescription={adminDescription}
              adminImageUrl={adminImageUrl}
              adminExpression={adminExpression}
              recipeIngredients={recipeIngredients}
              replaceVector={replaceVector}
              lastRecipe={board.lastRecipe}
              saving={adminSaving}
              searchQuery={catalogQuery}
              catalogResults={catalogResults}
              onSearch={setCatalogQuery}
              onSelectIngredient={selectAdminIngredient}
              onNew={prepareCreate}
              onEdit={prepareEdit}
              onName={setAdminName}
              onDescription={setAdminDescription}
              onImage={setAdminImageUrl}
              onExpression={updateAdminExpression}
              onIngredients={updateRecipeIngredients}
              onReplace={setReplaceVector}
              onSave={saveAdminElement}
              onDelete={deleteAdminElement}
            />
          ) : (
            <AlchemyBoard
              viewportRef={board.viewportRef}
              boardDrop={board.boardDrop}
              deleteZoneDrop={board.deleteZoneDrop}
              activeDragSource={board.activeDragSource}
              deleteCandidate={board.deleteCandidate}
              cards={board.cards}
              activeCard={board.activeCard}
              pan={board.pan}
              zoom={board.zoom}
              reactionNotice={board.reactionNotice}
              elements={elements}
              palette={palette}
              ingredientQuery={catalogQuery}
              catalogResults={catalogResults}
              catalogSearching={catalogSearching}
              onIngredientQuery={onIngredientQuery}
              onRemovePalette={removeFromPalette}
              onZoom={board.zoomAt}
              onFit={board.fitCards}
              onToggleSign={board.toggleCardSign}
              onPointerDown={board.onBoardPointerDown}
              onPointerMove={board.onBoardPointerMove}
              onPointerStop={board.stopPanning}
            />
          )}
        </main>
      </ModulePageTransition>
      <DragOverlay dropAnimation={null}>
        {board.activeCard && (
          <article
            className={`pointer-events-none flex h-[112px] w-[220px] gap-2.5 overflow-hidden rounded-xl border-2 p-2.5 opacity-100 shadow-xl ${board.deleteCandidate ? "border-red-300 bg-red-500/25 text-red-50 ring-2 ring-red-400/70 shadow-[0_0_24px_rgba(248,113,113,.55)]" : board.activeCard.sign < 0 ? "bg-card border-red-400 shadow-[0_0_22px_rgba(248,113,113,.35)]" : "bg-card border-white shadow-[0_0_18px_rgba(255,255,255,.22)]"}`}
          >
            <CardBody card={board.activeCard} />
          </article>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default VectorAlchemyPageComponent;
