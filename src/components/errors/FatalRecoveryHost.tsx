import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BootErrorFallback } from '@/components/errors/BootErrorFallback';
import { subscribeErrorReports, type ErrorReport } from '@/lib/reportError';
import { safeCall } from '@/lib/safe';

/**
 * Affiche un écran de récupération si une erreur JS fatale
 * a été absorbée par ErrorUtils (prod) sans tuer le process.
 */
export function FatalRecoveryHost() {
  const [fatal, setFatal] = useState<ErrorReport | null>(null);

  useEffect(() => {
    return subscribeErrorReports((report) => {
      if (report.severity === 'fatal') {
        setFatal(report);
      }
    });
  }, []);

  if (!fatal) return null;

  return (
    <View
      pointerEvents="auto"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        elevation: 9999,
      }}
    >
      <BootErrorFallback
        error={new Error(fatal.message)}
        title="L’application a rencontré un problème"
        description="Une erreur critique a été interceptée. Réessayez ou revenez à l’accueil."
        onRetry={() => setFatal(null)}
        onGoHome={() => {
          setFatal(null);
          safeCall(() => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { router } = require('expo-router') as typeof import('expo-router');
            router.replace('/(tabs)');
          }, undefined, 'FatalRecoveryHost.goHome');
        }}
      />
    </View>
  );
}
