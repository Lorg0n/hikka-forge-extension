import {
  AlchemyService,
  type AlchemyIngredient,
} from "@/services/alchemyService";

const VECTOR_SIZE = 256;
const ZERO_VECTOR_THRESHOLD = 1e-9;

export async function createRecipeEmbedding(
  ingredients: AlchemyIngredient[],
): Promise<number[]> {
  const vectors = await Promise.all(
    ingredients.map(async (ingredient) => ({
      ingredient,
      vector: await AlchemyService.getEmbedding(
        ingredient.type,
        ingredient.type === "element" ? ingredient.id! : ingredient.slug!,
      ),
    })),
  );
  const combined = Array.from({ length: VECTOR_SIZE }, () => 0);

  for (const { ingredient, vector } of vectors) {
    vector.forEach((value, index) => {
      combined[index] += ingredient.weight * value;
    });
  }

  const norm = Math.hypot(...combined);
  if (!Number.isFinite(norm) || norm <= ZERO_VECTOR_THRESHOLD) {
    throw new Error("Рецепт утворює нульовий вектор.");
  }

  return combined.map((value) => value / norm);
}

export function parseVectorExpression(expression: string): AlchemyIngredient[] {
  const pattern = /\s*([+-]?)\s*(element|anime|manga)\(\s*["']([^"']+)["']\s*\)\s*/g;
  const ingredients: AlchemyIngredient[] = [];
  let cursor = 0;

  for (
    let match = pattern.exec(expression);
    match;
    match = pattern.exec(expression)
  ) {
    if (match.index !== cursor) {
      throw new Error(
        'Вираз може містити лише element("id"), anime("slug") та manga("slug") з + або -.',
      );
    }
    const type = match[2] as "element" | "anime" | "manga";
    if (type === "element" && (!Number.isInteger(Number(match[3])) || Number(match[3]) <= 0)) {
      throw new Error('Ідентифікатор element("id") має бути додатним числом.');
    }
    ingredients.push(
      type === "element"
        ? {
            type,
            id: Number(match[3]),
            weight: match[1] === "-" ? -1 : 1,
          }
        : {
            type,
            slug: match[3],
            weight: match[1] === "-" ? -1 : 1,
          },
    );
    cursor = pattern.lastIndex;
  }

  if (!ingredients.length || cursor !== expression.length) {
    throw new Error("Некоректний вираз.");
  }

  return ingredients;
}
