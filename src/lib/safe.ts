import { reportError } from '@/lib/reportError';

/** Exécute un callback sync sans jamais throw. */
export function safeCall<T>(fn: () => T, fallback: T, context?: string): T {
  try {
    return fn();
  } catch (error) {
    reportError(error, { context: context ?? 'safeCall', severity: 'warning' });
    return fallback;
  }
}

/** Exécute une promesse ; retourne fallback en cas d’échec. */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    reportError(error, { context: context ?? 'safeAsync', severity: 'warning' });
    return fallback;
  }
}

export function safeJsonParse<T>(raw: string, fallback: T, context?: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    reportError(error, { context: context ?? 'safeJsonParse', severity: 'warning' });
    return fallback;
  }
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Ignore les rejets (fire-and-forget sans crash). */
export function voidCatch(promise: Promise<unknown>, context?: string): void {
  promise.catch((error) => {
    reportError(error, { context: context ?? 'voidCatch', severity: 'warning' });
  });
}
