import {
  ALCHEMY_VECTOR_SIZE,
  AlchemyService,
  type AlchemyIngredient,
} from "@/services/alchemyService";

const VECTOR_SIZE = ALCHEMY_VECTOR_SIZE;
const ZERO_VECTOR_THRESHOLD = 1e-9;

type TokenType =
  | "number"
  | "reference"
  | "normalize"
  | "operator"
  | "leftParen"
  | "rightParen"
  | "eof";

type Token = {
  type: TokenType;
  value?: string;
  position: number;
};

type ReferenceNode = {
  kind: "reference";
  source: AlchemyIngredient;
};

type NumberNode = {
  kind: "number";
  value: number;
};

type UnaryNode = {
  kind: "unary";
  operator: "+" | "-";
  operand: ExpressionNode;
};

type BinaryNode = {
  kind: "binary";
  operator: "+" | "-" | "*" | "/" | "^";
  left: ExpressionNode;
  right: ExpressionNode;
};

type NormalizeNode = {
  kind: "normalize";
  operand: ExpressionNode;
};

type ExpressionNode =
  | ReferenceNode
  | NumberNode
  | UnaryNode
  | BinaryNode
  | NormalizeNode;

type VectorValue =
  | { kind: "vector"; value: number[] }
  | { kind: "scalar"; value: number };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  while (cursor < expression.length) {
    const character = expression[cursor];
    if (/\s/.test(character)) {
      cursor += 1;
      continue;
    }
    if (/[()+\-*/^]/.test(character)) {
      tokens.push({
        type:
          character === "("
            ? "leftParen"
            : character === ")"
              ? "rightParen"
              : "operator",
        value: character,
        position: cursor,
      });
      cursor += 1;
      continue;
    }

    const number = expression
      .slice(cursor)
      .match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      tokens.push({ type: "number", value: number[0], position: cursor });
      cursor += number[0].length;
      continue;
    }

    const functionName = expression
      .slice(cursor)
      .match(/^(normalize|element|anime|manga)/);
    if (functionName) {
      const start = cursor;
      cursor += functionName[0].length;
      while (cursor < expression.length && /\s/.test(expression[cursor])) cursor += 1;
      if (expression[cursor] !== "(") {
        throw new Error(
          'Очікується "(" після ' + functionName[0] + " на позиції " + (start + 1) + ".",
        );
      }
      if (functionName[0] === "normalize") {
        tokens.push({ type: "normalize", value: functionName[0], position: start });
        continue;
      }
      cursor += 1;
      while (cursor < expression.length && /\s/.test(expression[cursor])) cursor += 1;
      const quote = expression[cursor];
      if (quote !== '"' && quote !== "'") {
        throw new Error(
          "Очікується рядок у " + functionName[0] + "(...) на позиції " + (cursor + 1) + ".",
        );
      }
      cursor += 1;
      const valueStart = cursor;
      while (cursor < expression.length && expression[cursor] !== quote) cursor += 1;
      if (cursor >= expression.length) {
        throw new Error("Незакритий рядок на позиції " + (valueStart + 1) + ".");
      }
      const value = expression.slice(valueStart, cursor);
      cursor += 1;
      while (cursor < expression.length && /\s/.test(expression[cursor])) cursor += 1;
      if (expression[cursor] !== ")") {
        throw new Error(
          'Очікується ")" після ' + functionName[0] + "(...) на позиції " + (cursor + 1) + ".",
        );
      }
      cursor += 1;
      if (!value) throw new Error(functionName[0] + "(...) не може містити порожнє значення.");
      if (functionName[0] === "element") {
        const id = Number(value);
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error('Ідентифікатор element("id") має бути додатним числом.');
        }
        tokens.push({ type: "reference", value: "element:" + id, position: start });
      } else {
        tokens.push({
          type: "reference",
          value: functionName[0] + ":" + value,
          position: start,
        });
      }
      continue;
    }

    throw new Error('Невідомий символ "' + character + '" на позиції ' + (cursor + 1) + ".");
  }

  tokens.push({ type: "eof", position: expression.length });
  return tokens;
}

class ExpressionParser {
  private cursor = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): ExpressionNode {
    const expression = this.parseAdditive();
    const token = this.peek();
    if (token.type !== "eof") {
      throw new Error("Неочікуваний токен на позиції " + (token.position + 1) + ".");
    }
    return expression;
  }

  private parseAdditive(): ExpressionNode {
    let expression = this.parseMultiplicative();
    while (this.matchOperator("+") || this.matchOperator("-")) {
      const operator = this.previous().value as "+" | "-";
      expression = {
        kind: "binary",
        operator,
        left: expression,
        right: this.parseMultiplicative(),
      };
    }
    return expression;
  }

  private parseMultiplicative(): ExpressionNode {
    let expression = this.parseUnary();
    while (this.matchOperator("*") || this.matchOperator("/")) {
      const operator = this.previous().value as "*" | "/";
      expression = {
        kind: "binary",
        operator,
        left: expression,
        right: this.parseUnary(),
      };
    }
    return expression;
  }

  private parseUnary(): ExpressionNode {
    if (this.matchOperator("+") || this.matchOperator("-")) {
      return {
        kind: "unary",
        operator: this.previous().value as "+" | "-",
        operand: this.parseUnary(),
      };
    }
    return this.parsePower();
  }

  private parsePower(): ExpressionNode {
    const expression = this.parsePrimary();
    if (!this.matchOperator("^")) return expression;
    return {
      kind: "binary",
      operator: "^",
      left: expression,
      right: this.parseUnary(),
    };
  }

  private parsePrimary(): ExpressionNode {
    const token = this.peek();
    if (token.type === "number") {
      this.cursor += 1;
      return { kind: "number", value: Number(token.value) };
    }
    if (token.type === "reference") {
      this.cursor += 1;
      const [type, value] = token.value!.split(":");
      return type === "element"
        ? { kind: "reference", source: { type, id: Number(value), weight: 1 } }
        : {
            kind: "reference",
            source: {
              type: type as "anime" | "manga",
              slug: value,
              weight: 1,
            },
        };
    }
    if (token.type === "normalize") {
      this.cursor += 1;
      if (this.peek().type !== "leftParen") {
        throw new Error('Очікується "(" після normalize.');
      }
      this.cursor += 1;
      const operand = this.parseAdditive();
      if (this.peek().type !== "rightParen") {
        throw new Error(
          'Очікується ")" після normalize на позиції ' +
            (this.peek().position + 1) +
            ".",
        );
      }
      this.cursor += 1;
      return { kind: "normalize", operand };
    }
    if (token.type === "leftParen") {
      this.cursor += 1;
      const expression = this.parseAdditive();
      if (this.peek().type !== "rightParen") {
        throw new Error('Очікується ")" на позиції ' + (this.peek().position + 1) + ".");
      }
      this.cursor += 1;
      return expression;
    }
    throw new Error(
      'Очікується число, інгредієнт або "(" на позиції ' + (token.position + 1) + ".",
    );
  }

  private matchOperator(operator: string) {
    if (this.peek().type === "operator" && this.peek().value === operator) {
      this.cursor += 1;
      return true;
    }
    return false;
  }

  private previous() {
    return this.tokens[this.cursor - 1];
  }

  private peek() {
    return this.tokens[this.cursor];
  }
}

function vectorOperation(
  left: number[],
  right: number[],
  operation: (a: number, b: number) => number,
) {
  if (left.length !== right.length) {
    throw new Error("Вектори мають різну кількість вимірів.");
  }
  return left.map((value, index) => operation(value, right[index]));
}

function assertFinite(values: number[]) {
  if (!values.every(Number.isFinite)) {
    throw new Error("Операція утворює некоректний вектор.");
  }
}

async function evaluate(
  node: ExpressionNode,
  cache: Map<string, Promise<number[]>>,
): Promise<VectorValue> {
  if (node.kind === "number") return { kind: "scalar", value: node.value };
  if (node.kind === "reference") {
    const source = node.source;
    const key =
      source.type === "element"
        ? "element:" + source.id
        : source.type + ":" + source.slug;
    let request = cache.get(key);
    if (!request) {
      request = AlchemyService.getEmbedding(
        source.type,
        source.type === "element" ? source.id! : source.slug!,
      );
      cache.set(key, request);
    }
    return { kind: "vector", value: await request };
  }
  if (node.kind === "unary") {
    const operand = await evaluate(node.operand, cache);
    if (node.operator === "+") return operand;
    return operand.kind === "scalar"
      ? { kind: "scalar", value: -operand.value }
      : { kind: "vector", value: operand.value.map((value) => -value) };
  }
  if (node.kind === "normalize") {
    const operand = await evaluate(node.operand, cache);
    if (operand.kind !== "vector") {
      throw new Error("normalize працює лише з векторами.");
    }
    const norm = Math.hypot(...operand.value);
    if (!Number.isFinite(norm) || norm <= ZERO_VECTOR_THRESHOLD) {
      throw new Error("Неможливо нормалізувати нульовий вектор.");
    }
    const normalized = operand.value.map((value) => value / norm);
    assertFinite(normalized);
    return { kind: "vector", value: normalized };
  }

  const [left, right] = await Promise.all([
    evaluate(node.left, cache),
    evaluate(node.right, cache),
  ]);
  if (node.operator === "+" || node.operator === "-") {
    if (left.kind !== "vector" || right.kind !== "vector") {
      throw new Error(node.operator + " працює лише з векторами.");
    }
    return {
      kind: "vector",
      value: vectorOperation(left.value, right.value, (a, b) =>
        node.operator === "+" ? a + b : a - b,
      ),
    };
  }
  if (node.operator === "*") {
    if (left.kind === "scalar" && right.kind === "scalar") {
      return { kind: "scalar", value: left.value * right.value };
    }
    if (left.kind === "vector" && right.kind === "scalar") {
      return { kind: "vector", value: left.value.map((value) => value * right.value) };
    }
    if (left.kind === "scalar" && right.kind === "vector") {
      return { kind: "vector", value: right.value.map((value) => value * left.value) };
    }
    throw new Error("Множення підтримує лише вектор на число або число на вектор.");
  }
  if (node.operator === "/") {
    if (right.kind !== "scalar" || right.value === 0) {
      throw new Error("Ділення вектора можливе лише на ненульове число.");
    }
    return left.kind === "scalar"
      ? { kind: "scalar", value: left.value / right.value }
      : { kind: "vector", value: left.value.map((value) => value / right.value) };
  }
  if (right.kind !== "scalar") throw new Error("Степінь має бути числом.");
  return left.kind === "scalar"
    ? { kind: "scalar", value: left.value ** right.value }
    : { kind: "vector", value: left.value.map((value) => value ** right.value) };
}

export async function createExpressionEmbedding(expression: string): Promise<number[]> {
  const trimmed = expression.trim();
  if (!trimmed) throw new Error("Введіть векторний вираз.");
  const tree = new ExpressionParser(tokenize(trimmed)).parse();
  const result = await evaluate(tree, new Map());
  if (result.kind !== "vector") {
    throw new Error("Вираз має завершуватися вектором, а не числом.");
  }
  if (result.value.length !== VECTOR_SIZE) {
    throw new Error("Очікується вектор із " + VECTOR_SIZE + " вимірів.");
  }
  assertFinite(result.value);
  const norm = Math.hypot(...result.value);
  if (!Number.isFinite(norm) || norm <= ZERO_VECTOR_THRESHOLD) {
    throw new Error("Рецепт утворює нульовий вектор.");
  }
  return result.value.map((value) => value / norm);
}

export async function createRecipeEmbedding(
  ingredients: AlchemyIngredient[],
): Promise<number[]> {
  if (!ingredients.length) throw new Error("Рецепт не містить інгредієнтів.");
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
    if (vector.length !== VECTOR_SIZE) {
      throw new Error("Backend returned a vector with an unexpected dimension.");
    }
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

/** Legacy linear parser retained for callers that only need +/- ingredients. */
export function parseVectorExpression(expression: string): AlchemyIngredient[] {
  const pattern = /\s*([+-]?)\s*(element|anime|manga)\(\s*["']([^"']+)["']\s*\)\s*/g;
  const ingredients: AlchemyIngredient[] = [];
  let cursor = 0;
  for (let match = pattern.exec(expression); match; match = pattern.exec(expression)) {
    if (match.index !== cursor) {
      throw new Error("Для складних операцій використовуйте числа, *, /, ^ та дужки.");
    }
    const type = match[2] as "element" | "anime" | "manga";
    if (type === "element") {
      const id = Number(match[3]);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Ідентифікатор element("id") має бути додатним числом.');
      }
      ingredients.push({ type, id, weight: match[1] === "-" ? -1 : 1 });
    } else {
      ingredients.push({
        type,
        slug: match[3],
        weight: match[1] === "-" ? -1 : 1,
      });
    }
    cursor = pattern.lastIndex;
  }
  if (!ingredients.length || cursor !== expression.length) {
    throw new Error("Некоректний лінійний вираз.");
  }
  return ingredients;
}
