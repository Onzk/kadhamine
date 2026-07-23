import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { NDJAMENA } from '@/utils/geo';

/** Avoid infinite "Localisation…" if GPS never returns a fix. */
const POSITION_TIMEOUT_MS = 10_000;

interface LocationState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
  /** True when coords are N'Djamena center (no usable device GPS). */
  isFallback: boolean;
}

function fallbackState(error: string | null): Omit<LocationState, 'loading'> {
  return {
    latitude: NDJAMENA.latitude,
    longitude: NDJAMENA.longitude,
    error,
    isFallback: true,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Effective user position for map / search radius.
 * Always returns numbers: device GPS when available, otherwise N'Djamena center.
 */
export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    ...fallbackState(null),
    loading: true,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLocation((prev) => ({ ...prev, loading: true, error: null }));

    const settle = (next: LocationState) => {
      if (!mountedRef.current) return;
      setLocation(next);
    };

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        settle({ ...fallbackState('Localisation désactivée'), loading: false });
        return;
      }

      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        ({ status } = await Location.requestForegroundPermissionsAsync());
      }

      if (status !== 'granted') {
        settle({
          ...fallbackState('Permission localisation refusée'),
          loading: false,
        });
        return;
      }

      try {
        const pos = await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          POSITION_TIMEOUT_MS,
        );
        settle({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          loading: false,
          error: null,
          isFallback: false,
        });
      } catch {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          settle({
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
            loading: false,
            error: null,
            isFallback: false,
          });
          return;
        }
        settle({
          ...fallbackState("Impossible d'obtenir la position"),
          loading: false,
        });
      }
    } catch {
      settle({
        ...fallbackState("Impossible d'obtenir la position"),
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    // Defer so the effect itself does not synchronously setState (lint: set-state-in-effect).
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return { ...location, refresh };
}
