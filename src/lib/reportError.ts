export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export type ErrorReport = {
  message: string;
  name?: string;
  stack?: string;
  context?: string;
  severity: ErrorSeverity;
  at: number;
};

const MAX_RECENT = 30;
const recentErrors: ErrorReport[] = [];
const listeners = new Set<(report: ErrorReport) => void>();

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name || 'Error';
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Log structuré — ne relance jamais. */
export function reportError(
  error: unknown,
  options?: { context?: string; severity?: ErrorSeverity },
): void {
  const severity = options?.severity ?? 'error';
  const context = options?.context;
  const err = error instanceof Error ? error : undefined;
  const report: ErrorReport = {
    message: toMessage(error),
    name: err?.name,
    stack: err?.stack,
    context,
    severity,
    at: Date.now(),
  };

  recentErrors.push(report);
  if (recentErrors.length > MAX_RECENT) recentErrors.shift();

  const prefix = context ? `[AppError:${context}]` : '[AppError]';
  if (severity === 'fatal') {
    console.error(prefix, '(fatal)', error);
  } else if (severity === 'warning') {
    console.warn(prefix, error);
  } else {
    console.error(prefix, error);
  }

  for (const listener of listeners) {
    try {
      listener(report);
    } catch {
      // never throw from reporter
    }
  }
}

export function getRecentErrors(): readonly ErrorReport[] {
  return recentErrors;
}

export function clearRecentErrors(): void {
  recentErrors.length = 0;
}

/** Abonnement pour UI de récupération (fatal hors boundary). */
export function subscribeErrorReports(listener: (report: ErrorReport) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
