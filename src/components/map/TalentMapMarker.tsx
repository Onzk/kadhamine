import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { TalentMapPin } from '@/components/map/TalentMapPin';

interface TalentMapMarkerProps {
  MarkerComponent: React.ComponentType<any>;
  coordinate: { latitude: number; longitude: number };
  selected: boolean;
  onPress: () => void;
  categoryIcon?: string;
  categoryLabel?: string;
  isPremium?: boolean;
  /** Passe à true quand MapView a fini de s'initialiser — relance le snapshot. */
  mapReady?: boolean;
}

const TRACKS_MS = Platform.OS === 'android' ? 1200 : 600;

/**
 * Wrapper Marker — garde tracksViewChanges actif jusqu'au layout + délai plateforme,
 * puis le coupe pour les perfs.
 */
export function TalentMapMarker({
  MarkerComponent,
  coordinate,
  selected,
  onPress,
  categoryIcon,
  categoryLabel,
  isPremium,
  mapReady = true,
}: TalentMapMarkerProps) {
  const [tracks, setTracks] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpSnapshot = useCallback(() => {
    setTracks(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTracks(false);
      timerRef.current = null;
    }, TRACKS_MS);
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    bumpSnapshot();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mapReady, selected, categoryIcon, categoryLabel, isPremium, bumpSnapshot]);

  const onPinLayout = useCallback(() => {
    if (!mapReady) return;
    bumpSnapshot();
  }, [mapReady, bumpSnapshot]);

  return (
    <MarkerComponent
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={selected ? 100 : 1}
      tracksViewChanges={tracks}
    >
      <View collapsable={false} onLayout={onPinLayout}>
        <TalentMapPin
          categoryIcon={categoryIcon}
          categoryLabel={categoryLabel}
          isPremium={isPremium}
          selected={selected}
        />
      </View>
    </MarkerComponent>
  );
}
