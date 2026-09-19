// Converts Prisma camelCase records to the snake_case shape the UI components expect (and back).

const toSnakeKey = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamelKey = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

export function snake<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => snake(v)) as T;
  if (value instanceof Date) return value.toISOString() as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[toSnakeKey(k)] = snake(v);
    return out as T;
  }
  return value as T;
}

export function camel<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => camel(v)) as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[toCamelKey(k)] = camel(v);
    return out as T;
  }
  return value as T;
}
