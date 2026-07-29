import type { Recipe, RecipeIngredient, PaletteObject } from "./alchemy.types";
import { paletteFromCatalog } from "./alchemy.utils";

export function toRecipeIngredient(
  item: PaletteObject,
  weight: 1 | -1 = 1,
): RecipeIngredient {
  return { ...item, weight };
}

export function recipeIngredientsFromRecipe(
  recipe: Recipe,
  palette: PaletteObject[],
): RecipeIngredient[] {
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

export function ingredientsToExpression(ingredients: RecipeIngredient[]) {
  return ingredients
    .map((ingredient) => {
      const value = String(ingredient.sourceId);
      return `${ingredient.weight < 0 ? "-" : "+"} ${ingredient.type}("${value}")`;
    })
    .join(" ")
    .replace(/^\+ /, "");
}

export function catalogSuggestionItems(
  palette: PaletteObject[],
  catalogResults: Parameters<typeof paletteFromCatalog>[0][],
  value: string,
) {
  const normalized = value.toLowerCase();
  const elementItems = palette.filter(
    (item) => item.type === "element" && item.title.toLowerCase().includes(normalized),
  );
  const catalogItems = catalogResults
    .map(paletteFromCatalog)
    .filter((item) => item.title.toLowerCase().includes(normalized));
  return [...elementItems, ...catalogItems].slice(0, 8);
}
