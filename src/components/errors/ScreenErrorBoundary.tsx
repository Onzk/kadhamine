import React from 'react';

import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary';
import type { ErrorFallbackProps } from '@/components/errors/ThemedErrorFallback';

type Props = {
  children: React.ReactNode;
  /** Clé pour forcer un remount après reset (ex. id de route). */
  resetKey?: string | number;
  fallback?: (props: ErrorFallbackProps) => React.ReactNode;
};

/**
 * Boundary locale pour isoler une section (liste, carte, sheet…)
 * sans faire tomber tout l’écran.
 */
export function ScreenErrorBoundary({ children, resetKey, fallback }: Props) {
  return (
    <AppErrorBoundary key={resetKey} fallback={fallback}>
      {children}
    </AppErrorBoundary>
  );
}
