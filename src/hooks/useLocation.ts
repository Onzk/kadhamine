import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { NDJAMENA } from '@/utils/geo';

interface LocationState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: NDJAMENA.latitude,
    longitude: NDJAMENA.longitude,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setLocation((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({
          latitude: NDJAMENA.latitude,
          longitude: NDJAMENA.longitude,
          loading: false,
          error: 'Permission localisation refusée',
        });
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        loading: false,
        error: null,
      });
    } catch {
      setLocation({
        latitude: NDJAMENA.latitude,
        longitude: NDJAMENA.longitude,
        loading: false,
        error: 'Impossible d\'obtenir la position',
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
