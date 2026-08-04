import React, { useCallback, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ModulePageTransition } from "@/components/ui/module-page-transition";
import { useAuth } from "@/contexts/ModuleAuthContext";
import {
  AlchemyService,
  briefAlchemyError,
  type AlchemyElement,
} from "@/services/alchemyService";
import type { PaletteObject } from "./alchemy.types";
import { paletteFromElement } from "./alchemy.utils";
import { createExpressionEmbedding } from "./alchemy.recipe";
import { useAlchemyCatalogSearch } from "./useAlchemyCatalogSearch";
import { useAlchemyPalette } from "./useAlchemyPalette";
import {
  INVALID_DROP_ANIMATION_DURATION,
  useAlchemyBoard,
} from "./useAlchemyBoard";
import { AlchemyAdminWorkspace } from "./AlchemyAdminWorkspace";
import { AlchemyBoard } from "./AlchemyBoard";
import { CardBody } from "./alchemy-card-components";

const VectorAlchemyPageComponent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes("ADMIN"));
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
  const [adminSaving, setAdminSaving] = useState(false);
  const [replaceVector, setReplaceVector] = useState(true);
  const [adminDirty, setAdminDirty] = useState(false);
  const [adminExitConfirm, setAdminExitConfirm] = useState(false);

  const addToPalette = useCallback(
    (item: PaletteObject) =>
      setPalette((current) => {
        const existing = current.find((entry) => entry.paletteId === item.paletteId);
        if (!existing) return [...current, item];
        if (item.origin !== "discovered" || existing.origin === "discovered") {
          return current;
        }
        return current.map((entry) =>
          entry.paletteId === item.paletteId ? { ...entry, ...item } : entry,
        );
      }),
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
  const { clearDiscoveredCards } = board;
  const clearDiscoveredIngredients = useCallback(() => {
    setPalette((current) => current.filter((item) => item.origin !== "discovered"));
    clearDiscoveredCards();
  }, [clearDiscoveredCards, setPalette]);

  const prepareCreate = useCallback(() => {
    setAdminElement(null);
    setAdminName("");
    setAdminDescription("");
    setAdminImageUrl("");
    setReplaceVector(true);
    setAdminExpression("");
    setError(null);
  }, []);

  const openAdmin = () => {
    setAdminMode(true);
    if (!adminElement) prepareCreate();
  };

  const toggleAdminMode = () => {
    if (!adminMode) {
      openAdmin();
      return;
    }
    if (adminDirty) {
      setAdminExitConfirm(true);
      return;
    }
    setAdminMode(false);
  };

  const prepareEdit = async (element: AlchemyElement) => {
    try {
      const loaded = await AlchemyService.getAdminElement(element.id);
      setAdminElement(loaded);
      setAdminName(loaded.name);
      setAdminDescription(loaded.description || "");
      setAdminImageUrl(loaded.imageUrl || "");
      setReplaceVector(Boolean(loaded.adminDescription?.trim()));
      setAdminExpression(loaded.adminDescription || "");
      setError(null);
    } catch (loadError) {
      setError(briefAlchemyError(loadError, "Не вдалося відкрити елемент."));
    }
  };

  const updateAdminExpression = useCallback((value: string) => {
    setAdminExpression(value);
  }, []);
  const saveAdminElement = async (): Promise<boolean> => {
    if (!adminName.trim()) {
      setError("Вкажіть назву елемента.");
      return false;
    }
    if (replaceVector && !adminExpression.trim()) {
      setError("Вкажіть векторний вираз для рецепту.");
      return false;
    }
    setAdminSaving(true);
    try {
      const embedding = adminElement && !replaceVector
        ? await AlchemyService.getEmbedding("element", adminElement.id)
        : await createExpressionEmbedding(adminExpression);
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
      return true;
    } catch (saveError) {
      setError(briefAlchemyError(saveError, "Не вдалося зберегти елемент."));
      return false;
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
              {isAdmin && (
                <Button
                  size="sm"
                  variant={adminMode ? "default" : "outline"}
                  onClick={toggleAdminMode}
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
              adminElement={adminElement}
              adminName={adminName}
              adminDescription={adminDescription}
              adminImageUrl={adminImageUrl}
              adminExpression={adminExpression}
              replaceVector={replaceVector}
              lastRecipe={board.lastRecipe}
              saving={adminSaving}
              onNew={prepareCreate}
              onEdit={prepareEdit}
              onName={setAdminName}
              onDescription={setAdminDescription}
              onImage={setAdminImageUrl}
              onExpression={updateAdminExpression}
              onReplace={setReplaceVector}
              onSave={saveAdminElement}
              onDelete={deleteAdminElement}
              onDirtyChange={setAdminDirty}
            />
          ) : (
            <AlchemyBoard
              viewportRef={board.viewportRef}
              boardDrop={board.boardDrop}
              deleteZoneDrop={board.deleteZoneDrop}
              activeDragSource={board.activeDragSource}
              deleteCandidate={board.deleteCandidate}
              invalidCombination={board.invalidCombination}
              cards={board.cards}
              activeCard={board.activeCard}
              pan={board.pan}
              zoom={board.zoom}
              reactionNotice={board.reactionNotice}
              palette={palette}
              ingredientQuery={catalogQuery}
              catalogResults={catalogResults}
              catalogSearching={catalogSearching}
              onIngredientQuery={onIngredientQuery}
              onRemovePalette={removeFromPalette}
              onClearDiscovered={clearDiscoveredIngredients}
              onZoom={board.zoomAt}
              onFit={board.fitCards}
              onToggleSign={board.toggleCardSign}
              onPointerDown={board.onBoardPointerDown}
              onPointerMove={board.onBoardPointerMove}
              onPointerStop={board.stopPanning}
              dragOverlay={
                <DragOverlay
                  dropAnimation={
                    board.invalidDropAnimation
                      ? {
                          duration: INVALID_DROP_ANIMATION_DURATION,
                          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                        }
                      : null
                  }
                >
                  {board.activeCard && (
                    <article
                      className={`pointer-events-none flex h-[112px] w-[220px] gap-2.5 overflow-hidden rounded-xl border-2 p-2.5 opacity-100 shadow-xl ${board.deleteCandidate ? "border-red-300 bg-red-500/25 text-red-50 ring-2 ring-red-400/70 shadow-[0_0_24px_rgba(248,113,113,.55)]" : board.invalidDropAnimation ? "animate-[hikka-alchemy-invalid-pulse_1s_ease-in-out_infinite] border-yellow-300 bg-yellow-400/15 text-yellow-50 ring-2 ring-yellow-300/70 shadow-[0_0_24px_rgba(250,204,21,.55)]" : board.activeCard.sign < 0 ? "bg-card border-red-400 shadow-[0_0_22px_rgba(248,113,113,.35)]" : "bg-card border-white shadow-[0_0_18px_rgba(255,255,255,.22)]"}`}
                    >
                      <CardBody card={board.activeCard} />
                    </article>
                  )}
                </DragOverlay>
              }
            />
          )}
          <AlertDialog open={adminExitConfirm} onOpenChange={setAdminExitConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вийти без збереження?</AlertDialogTitle>
                <AlertDialogDescription>
                  Поточні зміни в адмін-панелі буде втрачено.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Залишитися</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setAdminExitConfirm(false);
                    setAdminDirty(false);
                    setAdminMode(false);
                  }}
                >
                  Вийти без збереження
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </ModulePageTransition>
    </DndContext>
  );
};

export default VectorAlchemyPageComponent;
