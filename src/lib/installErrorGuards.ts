import { reportConvexError } from '@/lib/convexErrors';

let installed = false;

/**
 * Garde-fous globaux (rejets de promesses / erreurs fatales non gérées).
 * À appeler une fois au démarrage de l’app.
 */
export function installErrorGuards(): void {
  if (installed) return;
  installed = true;

  // Rejets de promesses non capturés (mutations Convex sans try/catch, etc.)
  const rejectionHandler = (event: { reason?: unknown; preventDefault?: () => void }) => {
    reportConvexError(event.reason ?? event, 'unhandledRejection');
    event.preventDefault?.();
  };

  // RN / Hermes expose parfois un tracking ; le web Expo aussi.
  const g = globalThis as typeof globalThis & {
    onunhandledrejection?: ((event: PromiseRejectionEvent) => void) | null;
    addEventListener?: (type: string, listener: (event: PromiseRejectionEvent) => void) => void;
  };

  if (typeof g.addEventListener === 'function') {
    g.addEventListener('unhandledrejection', (event) => {
      reportConvexError(event.reason, 'unhandledRejection');
      event.preventDefault();
    });
  } else if (!g.onunhandledrejection) {
    g.onunhandledrejection = (event) => {
      rejectionHandler(event);
    };
  }

  // ErrorUtils (React Native) — log sans remplacer le handler par défaut.
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
      reportConvexError(error, isFatal ? 'fatal' : 'global');
      previous?.(error, isFatal);
    });
  }
}
