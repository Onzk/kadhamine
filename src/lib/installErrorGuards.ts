import { reportError } from '@/lib/reportError';

let installed = false;

type RejectionLike = {
  reason?: unknown;
  preventDefault?: () => void;
};

/**
 * Garde-fous globaux (rejets de promesses / erreurs JS non gérées).
 * À appeler une fois au démarrage — avant le rendu React.
 *
 * En prod : les erreurs non fatales sont loguées sans propager au handler
 * natif (évite un kill inutile). Les fatales sont loguées puis déléguées.
 */
export function installErrorGuards(): void {
  if (installed) return;
  installed = true;

  const g = globalThis as typeof globalThis & {
    onunhandledrejection?: ((event: PromiseRejectionEvent) => void) | null;
    onerror?:
      | ((
          message: Event | string,
          source?: string,
          lineno?: number,
          colno?: number,
          error?: Error,
        ) => boolean | void)
      | null;
    addEventListener?: (type: string, listener: (event: Event) => void) => void;
  };

  const onUnhandledRejection = (event: RejectionLike) => {
    reportError(event.reason ?? event, {
      context: 'unhandledRejection',
      severity: 'error',
    });
    try {
      event.preventDefault?.();
    } catch {
      // ignore
    }
  };

  if (typeof g.addEventListener === 'function') {
    g.addEventListener('unhandledrejection', (event) => {
      onUnhandledRejection(event as unknown as RejectionLike);
    });
    g.addEventListener('error', (event) => {
      const e = event as ErrorEvent;
      reportError(e.error ?? e.message, {
        context: 'window.onerror',
        severity: 'error',
      });
      try {
        e.preventDefault?.();
      } catch {
        // ignore
      }
    });
  } else {
    if (!g.onunhandledrejection) {
      g.onunhandledrejection = (event) => {
        onUnhandledRejection(event);
      };
    }
    if (!g.onerror) {
      g.onerror = (message, _source, _lineno, _colno, error) => {
        reportError(error ?? message, { context: 'global.onerror', severity: 'error' });
        return true;
      };
    }
  }

  const ErrorUtils = (
    globalThis as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | undefined;
        setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;

  if (ErrorUtils?.getGlobalHandler && ErrorUtils?.setGlobalHandler) {
    const previous = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      reportError(error, {
        context: isFatal ? 'fatal' : 'global',
        severity: isFatal ? 'fatal' : 'error',
      });

      // Dev : garder LogBox / redbox pour le debug.
      if (__DEV__) {
        previous?.(error, isFatal);
        return;
      }

      // Prod : ne propage PAS au handler natif (évite un kill).
      // FatalRecoveryHost affiche un écran de récupération.
      if (isFatal) {
        // no-op — l’app reste vivante
      }
    });
  }
}
