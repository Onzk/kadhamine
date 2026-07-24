import React, { useEffect } from 'react';
import type { ErrorBoundaryProps } from 'expo-router';
import { useRouter } from 'expo-router';

import { BootErrorFallback } from '@/components/errors/BootErrorFallback';
import { ThemedErrorFallback } from '@/components/errors/ThemedErrorFallback';
import { reportError } from '@/lib/reportError';

/**
 * À exporter depuis un `_layout.tsx` / route :
 * `export { ExpoRouteErrorBoundary as ErrorBoundary } from '…'`
 */
export function ExpoRouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  try {
    return <ExpoRouteErrorBoundaryInner error={error} retry={retry} />;
  } catch {
    return (
      <BootErrorFallback
        error={error}
        onRetry={retry}
        title="Une erreur est survenue"
        description="Impossible d’afficher cet écran. Réessayez."
      />
    );
  }
}

function ExpoRouteErrorBoundaryInner({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    reportError(error, { context: 'ExpoRouteErrorBoundary' });
  }, [error]);

  return (
    <ThemedErrorFallback
      error={error}
      reset={() => {
        try {
          retry();
        } catch (e) {
          reportError(e, { context: 'ExpoRouteErrorBoundary.retry', severity: 'warning' });
          try {
            router.replace('/(tabs)');
          } catch {
            // ignore
          }
        }
      }}
    />
  );
}
