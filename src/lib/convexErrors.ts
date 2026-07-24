import { ConvexError } from 'convex/values';

import { reportError } from '@/lib/reportError';

/** Message utilisateur à partir d’une erreur Convex / JS. */
export function getConvexErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (typeof record.message === 'string' && record.message.trim()) return record.message;
      if (typeof record.code === 'string' && record.code.trim()) return record.code;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    // Évite d’exposer les stack traces Convex brutes à l’utilisateur.
    const msg = error.message;
    if (msg.includes('[CONVEX') || msg.includes('Server Error')) {
      return fallback;
    }
    return msg;
  }
  return fallback;
}

export function isConvexError(error: unknown): boolean {
  if (error instanceof ConvexError) return true;
  if (error instanceof Error) {
    return (
      error.message.includes('[CONVEX') ||
      error.name === 'ConvexError' ||
      error.name === 'ConvexActionError'
    );
  }
  return false;
}

/** Log structuré — ne relance jamais. */
export function reportConvexError(error: unknown, context?: string): void {
  reportError(error, { context: context ? `Convex:${context}` : 'Convex' });
}

/**
 * Exécute un appel Convex (mutation / action) sans faire crasher l’app.
 * Retourne `{ ok: true, data }` ou `{ ok: false, error, message }`.
 */
export async function runConvexSafe<T>(
  fn: () => Promise<T>,
  options?: { context?: string; fallbackMessage?: string },
): Promise<{ ok: true; data: T } | { ok: false; error: unknown; message: string }> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    reportConvexError(error, options?.context);
    return {
      ok: false,
      error,
      message: getConvexErrorMessage(error, options?.fallbackMessage ?? 'Une erreur est survenue'),
    };
  }
}
