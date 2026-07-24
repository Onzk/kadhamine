import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useMutation } from 'convex/react';

import { api } from '../../convex/_generated/api';

const HEARTBEAT_MS = 45_000;

/**
 * Keeps `users.lastActiveAt` fresh while the app is foregrounded,
 * so peers can show online / last-seen status.
 */
export function usePresenceHeartbeat(enabled: boolean) {
  const heartbeat = useMutation(api.users.heartbeat);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = () => {
      if (cancelled) return;
      void heartbeat({}).catch(() => {});
    };

    const start = () => {
      ping();
      if (timer) clearInterval(timer);
      timer = setInterval(ping, HEARTBEAT_MS);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    if (appState.current === 'active') start();

    const onChange = (next: AppStateStatus) => {
      appState.current = next;
      if (next === 'active') start();
      else stop();
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => {
      cancelled = true;
      stop();
      sub.remove();
    };
  }, [enabled, heartbeat]);
}
