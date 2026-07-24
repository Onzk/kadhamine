import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { LEAFLET_HTML } from '@/components/map/leafletHtml';

/** Aggressive pin focus zoom (usable map area above bottom sheet). */
export const MAP_FOCUS_ZOOM = 17;
/** Default zoom when device GPS is available. */
export const MAP_USER_ZOOM = 12;
/** Overview radius (km) when GPS is off / denied (N'Djamena fallback). */
export const MAP_FALLBACK_RADIUS_KM = 25;
/** Zoom used in location-picker mode. */
export const MAP_PICKER_ZOOM = 15;

export type LeafletMarkerTooltip = {
  title: string;
  providerName?: string;
  photoUrl?: string;
  priceLabel?: string;
  ratingLabel?: string;
  categoryLabel?: string;
  isPremium?: boolean;
  isVerified?: boolean;
};

export type LeafletMarkerData = {
  id: string;
  lat: number;
  lng: number;
  selected?: boolean;
  categoryIcon?: string;
  /** Saturated category accent for pin bubble / tip / selected halo. */
  categoryColor?: string;
  isPremium?: boolean;
  /** Compact callout rendered above the pin when selected (omit until fly completes). */
  tooltip?: LeafletMarkerTooltip;
};

export type LeafletMapPadding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

/** Theme tokens forwarded into Leaflet HTML for the in-map callout. */
export type LeafletMapTheme = {
  surface: string;
  surfaceStrong: string;
  ink: string;
  muted: string;
  border: string;
  orbit: string;
  rating: string;
  info: string;
};

export type LeafletMapHandle = {
  flyTo: (lat: number, lng: number, zoom?: number, focusId?: string) => void;
  setView: (lat: number, lng: number, zoom?: number) => void;
  /** Fit map to a bbox of ±km around lat/lng (GPS-off overview). */
  fitRadiusKm: (lat: number, lng: number, km?: number) => void;
  setPadding: (padding: LeafletMapPadding) => void;
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  /**
   * When set, initial view uses fitBounds for this radius (km) instead of `zoom`.
   * Used for GPS-off overview (~25 km around N'Djamena).
   */
  fitRadiusKm?: number;
  markers: LeafletMarkerData[];
  userLocation?: { lat: number; lng: number } | null;
  orbitColor?: string;
  theme?: LeafletMapTheme;
  /** Insets used when flyTo-padding so the pin sits in the usable map area. */
  focusPadding?: LeafletMapPadding;
  /**
   * Location-picker mode: one draggable / tap-to-place marker, no service pins.
   */
  picker?: boolean;
  onMarkerPress?: (id: string) => void;
  /** Tap on the in-map callout card. */
  onTooltipPress?: (id: string) => void;
  /** Fired after a focus flyTo animation settles (may be superseded mid-flight). */
  onFocusComplete?: (id: string) => void;
  /** Fired on Leaflet moveend/zoomend (and once after ready). */
  onCameraChange?: (camera: { lat: number; lng: number; zoom: number }) => void;
  /** Fired when the picker pin is placed / dragged. */
  onPickerPosition?: (pos: { lat: number; lng: number }) => void;
  onReady?: () => void;
  style?: StyleProp<ViewStyle>;
};

function postToWeb(ref: React.RefObject<WebView | null>, msg: object) {
  const json = JSON.stringify(msg);
  // Prefer direct handler; else one MessageEvent (listeners exist on window + document).
  ref.current?.injectJavaScript(
    `(function(){var d=${JSON.stringify(json)};` +
      `if(typeof window.__TT_HANDLE__==='function'){window.__TT_HANDLE__(d);}` +
      `else{try{window.dispatchEvent(new MessageEvent('message',{data:d}));}` +
      `catch(e){try{document.dispatchEvent(new MessageEvent('message',{data:d}));}catch(e2){}}}` +
      `})();true;`,
  );
}

/**
 * Carte Leaflet (OpenStreetMap) via WebView — iOS / Android / Web.
 */
export const LeafletMapView = forwardRef<LeafletMapHandle, Props>(function LeafletMapView(
  {
    center,
    zoom = MAP_USER_ZOOM,
    fitRadiusKm,
    markers,
    userLocation,
    orbitColor = '#0B3D91',
    theme,
    focusPadding,
    picker = false,
    onMarkerPress,
    onTooltipPress,
    onFocusComplete,
    onCameraChange,
    onPickerPosition,
    onReady,
    style,
  },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const onCameraChangeRef = useRef(onCameraChange);
  onCameraChangeRef.current = onCameraChange;
  const onPickerPositionRef = useRef(onPickerPosition);
  onPickerPositionRef.current = onPickerPosition;
  const pickerRef = useRef(picker);
  pickerRef.current = picker;

  const send = useCallback((msg: object) => {
    postToWeb(webRef, msg);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lat, lng, z = MAP_FOCUS_ZOOM, focusId) =>
        send({ type: 'flyTo', lat, lng, zoom: z, focusId }),
      setView: (lat, lng, z = MAP_USER_ZOOM) => send({ type: 'setView', lat, lng, zoom: z }),
      fitRadiusKm: (lat, lng, km = MAP_FALLBACK_RADIUS_KM) =>
        send({ type: 'fitRadiusKm', lat, lng, km }),
      setPadding: (padding) =>
        send({
          type: 'setPadding',
          top: padding.top ?? 0,
          right: padding.right ?? 0,
          bottom: padding.bottom ?? 0,
          left: padding.left ?? 0,
        }),
    }),
    [send],
  );

  useEffect(() => {
    if (!readyRef.current || picker) return;
    send({ type: 'setMarkers', markers, orbitColor, theme });
  }, [markers, orbitColor, theme, picker, send]);

  useEffect(() => {
    if (!readyRef.current || !userLocation || picker) return;
    send({ type: 'setUserLocation', lat: userLocation.lat, lng: userLocation.lng });
  }, [userLocation, picker, send]);

  useEffect(() => {
    if (!readyRef.current || !focusPadding) return;
    send({
      type: 'setPadding',
      top: focusPadding.top ?? 0,
      right: focusPadding.right ?? 0,
      bottom: focusPadding.bottom ?? 0,
      left: focusPadding.left ?? 0,
    });
  }, [focusPadding, send]);

  useEffect(() => {
    if (!readyRef.current || !theme) return;
    send({ type: 'setTheme', theme, orbitColor });
  }, [theme, orbitColor, send]);

  useEffect(() => {
    if (!readyRef.current || !picker) return;
    send({
      type: 'enablePicker',
      lat: center.lat,
      lng: center.lng,
      zoom: zoom || MAP_PICKER_ZOOM,
      orbitColor,
      theme,
    });
  }, [picker, center.lat, center.lng, zoom, orbitColor, theme, send]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: {
        type?: string;
        id?: string | null;
        lat?: number;
        lng?: number;
        zoom?: number;
      };
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (msg.type === 'ready') {
        readyRef.current = true;
        const isPicker = pickerRef.current;
        send({
          type: 'init',
          center,
          zoom: isPicker ? zoom || MAP_PICKER_ZOOM : zoom,
          fitRadiusKm: isPicker ? undefined : fitRadiusKm ?? undefined,
          markers: isPicker ? [] : markers,
          orbitColor,
          theme,
          padding: focusPadding,
          user: isPicker ? undefined : userLocation ?? undefined,
          picker: isPicker,
          pickerLat: center.lat,
          pickerLng: center.lng,
        });
        onReady?.();
        return;
      }
      if (
        msg.type === 'pickerPosition' &&
        typeof msg.lat === 'number' &&
        typeof msg.lng === 'number'
      ) {
        onPickerPositionRef.current?.({ lat: msg.lat, lng: msg.lng });
        return;
      }
      if (
        msg.type === 'camera' &&
        typeof msg.lat === 'number' &&
        typeof msg.lng === 'number' &&
        typeof msg.zoom === 'number'
      ) {
        onCameraChangeRef.current?.({ lat: msg.lat, lng: msg.lng, zoom: msg.zoom });
        return;
      }
      if (msg.type === 'markerPress' && msg.id) {
        onMarkerPress?.(msg.id);
        return;
      }
      if (msg.type === 'tooltipPress' && msg.id) {
        onTooltipPress?.(msg.id);
        return;
      }
      if (msg.type === 'focusComplete' && msg.id) {
        onFocusComplete?.(msg.id);
      }
    },
    [
      center,
      zoom,
      fitRadiusKm,
      markers,
      orbitColor,
      theme,
      focusPadding,
      userLocation,
      onMarkerPress,
      onTooltipPress,
      onFocusComplete,
      onReady,
      send,
    ],
  );

  return (
    <View style={[styles.fill, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: LEAFLET_HTML }}
        onMessage={onMessage}
        style={styles.fill}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        nestedScrollEnabled
      />
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
