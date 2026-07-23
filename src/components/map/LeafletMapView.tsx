import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { LEAFLET_HTML } from '@/components/map/leafletHtml';

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
  isPremium?: boolean;
  /** Compact callout rendered above the pin when selected. */
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
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setView: (lat: number, lng: number, zoom?: number) => void;
  setPadding: (padding: LeafletMapPadding) => void;
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers: LeafletMarkerData[];
  userLocation?: { lat: number; lng: number } | null;
  orbitColor?: string;
  theme?: LeafletMapTheme;
  /** Insets used when flyTo-padding so the pin sits in the usable map area. */
  focusPadding?: LeafletMapPadding;
  onMarkerPress?: (id: string) => void;
  /** Tap on the in-map callout card. */
  onTooltipPress?: (id: string) => void;
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
    zoom = 12,
    markers,
    userLocation,
    orbitColor = '#0B3D91',
    theme,
    focusPadding,
    onMarkerPress,
    onTooltipPress,
    onReady,
    style,
  },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const send = useCallback((msg: object) => {
    postToWeb(webRef, msg);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lat, lng, z = 15) => send({ type: 'flyTo', lat, lng, zoom: z }),
      setView: (lat, lng, z = 12) => send({ type: 'setView', lat, lng, zoom: z }),
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
    if (!readyRef.current) return;
    send({ type: 'setMarkers', markers, orbitColor, theme });
  }, [markers, orbitColor, theme, send]);

  useEffect(() => {
    if (!readyRef.current || !userLocation) return;
    send({ type: 'setUserLocation', lat: userLocation.lat, lng: userLocation.lng });
  }, [userLocation, send]);

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

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: {
        type?: string;
        id?: string;
      };
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (msg.type === 'ready') {
        readyRef.current = true;
        send({
          type: 'init',
          center,
          zoom,
          markers,
          orbitColor,
          theme,
          padding: focusPadding,
          user: userLocation ?? undefined,
        });
        onReady?.();
        return;
      }
      if (msg.type === 'markerPress' && msg.id) {
        onMarkerPress?.(msg.id);
        return;
      }
      if (msg.type === 'tooltipPress' && msg.id) {
        onTooltipPress?.(msg.id);
      }
    },
    [
      center,
      zoom,
      markers,
      orbitColor,
      theme,
      focusPadding,
      userLocation,
      onMarkerPress,
      onTooltipPress,
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
