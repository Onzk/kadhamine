import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  BackHandler,
  Dimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import {
  CaretLeft,
  Crosshair,
  MapPin,
} from 'phosphor-react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { CategoryChipMasonry } from '@/components/ui/CategoryChipMasonry';
import { EmptyState } from '@/components/ui/EmptyState';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { FlutterFab, FLUTTER_FAB } from '@/components/ui/FlutterFab';
import { ServiceCard } from '@/components/cards/ServiceCard';
import {
  LeafletMapView,
  MAP_FALLBACK_RADIUS_KM,
  MAP_FOCUS_ZOOM,
  MAP_USER_ZOOM,
  type LeafletMapHandle,
  type LeafletMapTheme,
  type LeafletMarkerData,
} from '@/components/map/LeafletMapView';
import { getCategoryVisual } from '@/lib/categoryTheme';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useLocation } from '@/hooks/useLocation';
import {
  getMapSession,
  patchMapCamera,
  patchMapSession,
  type MapCamera,
  type MapRadiusKm,
} from '@/stores/mapSessionStore';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { formatPrice, formatRating } from '@/types';
import { api } from '../../convex/_generated/api';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_COLLAPSED = 110;
const SHEET_MID = Math.round(SCREEN_H * 0.42);
const SHEET_EXPANDED = Math.round(SCREEN_H * 0.72);
const SNAP_POINTS = [SHEET_COLLAPSED, SHEET_MID, SHEET_EXPANDED];
const PANEL_RADIUS = Radius.xl;
/** Search bar + category chips — usable map top inset for focus centering. */
const MAP_FOCUS_TOP_PAD = 160;
const RADIUS_OPTIONS = [5, 15, 25, 50] as const;
type RadiusKm = MapRadiusKm;

function categoryAccent(icon?: string, label?: string) {
  return getCategoryVisual({ icon, label }).pastel.fg;
}

function nearestSnap(value: number) {
  'worklet';
  let best = SNAP_POINTS[0];
  let bestDist = Math.abs(value - best);
  for (const p of SNAP_POINTS) {
    const d = Math.abs(value - p);
    if (d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

function clampSheet(value: number) {
  'worklet';
  return Math.min(SHEET_EXPANDED, Math.max(SHEET_COLLAPSED, value));
}

function flushMapSession(partial: {
  radiusKm: RadiusKm;
  search: string;
  selectedCategory: string | undefined;
  selectedId: string | null;
  showCallout: boolean;
  sheetHeight: number;
  listScrollY: number;
  camera: MapCamera | null;
}) {
  patchMapSession(partial);
}

export default function MapScreen() {
  const saved = getMapSession();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { latitude, longitude, loading: locLoading, isFallback, refresh } = useLocation();

  /** Default chip matches the ~25 km GPS-off overview. */
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(
    saved.hasSession ? saved.radiusKm : 25,
  );
  const [search, setSearch] = useState(saved.hasSession ? saved.search : '');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    saved.hasSession ? saved.selectedCategory : undefined,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    saved.hasSession ? saved.selectedId : null,
  );
  /** Callout card only after flyTo settles (not during the animation). */
  const [showCallout, setShowCallout] = useState(
    saved.hasSession ? saved.showCallout : false,
  );

  const mapRef = useRef<LeafletMapHandle>(null);
  const listScrollRef = useRef<ScrollView>(null);
  const rowOffsets = useRef<Record<string, number>>({});
  const appliedLocKey = useRef<string | null>(null);
  /** Latest focus target — ignore focusComplete from superseded flies. */
  const pendingFocusId = useRef<string | null>(null);
  /** Keep radius stable across rapid sheet / query re-renders. */
  const radiusKmRef = useRef<RadiusKm>(saved.hasSession ? saved.radiusKm : 25);
  const listScrollYRef = useRef(saved.hasSession ? saved.listScrollY : 0);
  const cameraRef = useRef<MapCamera | null>(saved.hasSession ? saved.camera : null);
  /**
   * True while rehydrating from session after a remount.
   * Skips GPS auto-center and flyTo spam; camera comes from saved / init props.
   */
  const restoringRef = useRef(saved.hasSession && !!saved.camera);
  /** True until we apply saved listScrollY (avoids fighting scroll-to-selected). */
  const pendingScrollRestoreRef = useRef(
    saved.hasSession && saved.listScrollY > 0,
  );

  const sheetBg = colors.canvas;
  const panelBg = colors.surfaceCard;
  const orbitColor = colors.orbit;

  const selectRadius = useCallback((r: RadiusKm) => {
    radiusKmRef.current = r;
    setRadiusKm(r);
  }, []);

  const persistSheetHeight = useCallback((h: number) => {
    patchMapSession({ sheetHeight: h });
  }, []);

  const mapTheme: LeafletMapTheme = useMemo(
    () => ({
      surface: colors.surfaceCard,
      surfaceStrong: colors.surfaceStrong,
      ink: colors.ink,
      muted: colors.muted,
      border: colors.borderStrong,
      orbit: colors.orbit,
      rating: colors.rating ?? colors.accentSoft,
      info: colors.info,
    }),
    [colors],
  );

  const focusPadding = useMemo(
    () => ({
      top: MAP_FOCUS_TOP_PAD + 130,
      bottom: SHEET_MID,
      left: PAGE_H_PAD,
      right: PAGE_H_PAD,
    }),
    [],
  );

  /** Captured once at mount — used for WebView init / remount rehydrate only. */
  const restoreCameraRef = useRef<MapCamera | null>(
    saved.hasSession ? saved.camera : null,
  );
  const mapCenter = restoreCameraRef.current
    ? { lat: restoreCameraRef.current.lat, lng: restoreCameraRef.current.lng }
    : { lat: latitude, lng: longitude };
  const mapZoom = restoreCameraRef.current?.zoom ?? MAP_USER_ZOOM;
  const mapFitRadiusKm = restoreCameraRef.current
    ? undefined
    : isFallback
      ? MAP_FALLBACK_RADIUS_KM
      : undefined;

  // Persist filters / selection whenever they change.
  useEffect(() => {
    patchMapSession({
      radiusKm,
      search,
      selectedCategory,
      selectedId,
      showCallout,
    });
  }, [radiusKm, search, selectedCategory, selectedId, showCallout]);

  // GPS-off: ~25 km overview around N'Djamena. GPS-on: center on user.
  // First settle with real GPS also centers (init may have used fallback overview).
  // Skipped while restoring a saved camera so back-from-service keeps the view.
  useEffect(() => {
    if (locLoading) return;
    const key = `${latitude},${longitude}:${isFallback ? 'fb' : 'gps'}`;
    if (appliedLocKey.current === key) return;

    if (restoringRef.current) {
      appliedLocKey.current = key;
      return;
    }

    const isFirst = appliedLocKey.current === null;
    appliedLocKey.current = key;
    if (isFallback) {
      if (!isFirst) {
        mapRef.current?.fitRadiusKm(latitude, longitude, MAP_FALLBACK_RADIUS_KM);
      }
      return;
    }
    mapRef.current?.setView(latitude, longitude, MAP_USER_ZOOM);
  }, [latitude, longitude, locLoading, isFallback]);

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const talents = useQuery(api.services.listForMap, {
    latitude,
    longitude,
    radiusKm,
  });

  const filtered = useMemo(() => {
    if (!talents) return undefined;
    let list = talents;
    if (selectedCategory) {
      list = list.filter((t) => t.categoryId === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.providerName.toLowerCase().includes(q) ||
          (t.categoryLabel?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [talents, selectedCategory, search]);

  const leafletMarkers: LeafletMarkerData[] = useMemo(
    () =>
      (filtered ?? []).map((t) => {
        const selected = selectedId === t.serviceId;
        const priceLabel =
          t.pricingType === 'negotiable'
            ? 'Négociable'
            : t.price != null
              ? formatPrice(t.price)
              : undefined;
        return {
          id: t.serviceId,
          lat: t.latitude,
          lng: t.longitude,
          selected,
          categoryIcon: t.categoryIcon,
          categoryColor: categoryAccent(t.categoryIcon, t.categoryLabel),
          isPremium: t.isPremium,
          // Defer card until fly finishes — selected pin still highlights mid-flight.
          // On session restore, showCallout is already true so the callout reappears without flyTo.
          tooltip:
            selected && showCallout
              ? {
                  title: t.title,
                  providerName: t.providerName,
                  photoUrl: t.photos[0],
                  priceLabel,
                  ratingLabel:
                    (t.reviewCount ?? 0) > 0 ? formatRating(t.rating) : undefined,
                  categoryLabel: t.categoryLabel,
                  isPremium: t.isPremium,
                  isVerified: t.isVerified,
                }
              : undefined,
        };
      }),
    [filtered, selectedId, showCallout],
  );

  const sheetHeight = useSharedValue(
    saved.hasSession ? saved.sheetHeight : SHEET_COLLAPSED,
  );
  const dragStart = useSharedValue(
    saved.hasSession ? saved.sheetHeight : SHEET_COLLAPSED,
  );
  const headerHeight = useSharedValue(72);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onStart(() => {
      dragStart.value = sheetHeight.value;
    })
    .onUpdate((e) => {
      sheetHeight.value = clampSheet(dragStart.value - e.translationY);
    })
    .onEnd(() => {
      const snapped = nearestSnap(sheetHeight.value);
      sheetHeight.value = withSpring(snapped, {
        damping: 20,
        stiffness: 200,
      });
      runOnJS(persistSheetHeight)(snapped);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  const listWrapStyle = useAnimatedStyle(() => ({
    height: Math.max(0, sheetHeight.value - headerHeight.value),
  }));

  const recenterStyle = useAnimatedStyle(() => ({
    bottom: sheetHeight.value + FLUTTER_FAB.edgeMargin,
  }));

  /**
   * Radius chips follow the sheet height (collapsed → mid → expanded),
   * same as the recenter FAB. zIndex above category masonry so taps still
   * work if the bar rises into that band at max sheet height.
   */
  const radiusBarStyle = useAnimatedStyle(() => ({
    bottom: sheetHeight.value + FLUTTER_FAB.edgeMargin,
  }));

  const onSheetHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      headerHeight.value = e.nativeEvent.layout.height;
    },
    [headerHeight],
  );

  const scrollToSelected = useCallback((serviceId: string, animated = true) => {
    const y = rowOffsets.current[serviceId];
    if (y == null) return;
    listScrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated });
  }, []);

  const restoreListScroll = useCallback(() => {
    if (!pendingScrollRestoreRef.current) return;
    const y = listScrollYRef.current;
    if (y > 0) {
      listScrollRef.current?.scrollTo({ y, animated: false });
    }
    pendingScrollRestoreRef.current = false;
  }, []);

  const focusTalent = useCallback(
    (serviceId: string, lat: number, lng: number) => {
      pendingFocusId.current = serviceId;
      setSelectedId(serviceId);
      setShowCallout(false);
      mapRef.current?.setPadding(focusPadding);
      mapRef.current?.flyTo(lat, lng, MAP_FOCUS_ZOOM, serviceId);
      sheetHeight.value = withSpring(SHEET_MID, { damping: 20, stiffness: 200 });
      persistSheetHeight(SHEET_MID);
      // Scroll after sheet spring starts + row layouts settle.
      requestAnimationFrame(() => scrollToSelected(serviceId));
      setTimeout(() => scrollToSelected(serviceId), 320);
    },
    [sheetHeight, focusPadding, scrollToSelected, persistSheetHeight],
  );

  const onFocusComplete = useCallback(
    (id: string) => {
      if (pendingFocusId.current !== id) return;
      setShowCallout(true);
      scrollToSelected(id);
    },
    [scrollToSelected],
  );

  const onCameraChange = useCallback((cam: MapCamera) => {
    cameraRef.current = cam;
    patchMapCamera(cam);
  }, []);

  const onMapReady = useCallback(() => {
    if (!restoringRef.current) return;
    const cam = cameraRef.current;
    mapRef.current?.setPadding(focusPadding);
    if (cam) {
      // Quiet rehydrate — no flyTo, so focusComplete / callout spam is avoided.
      mapRef.current?.setView(cam.lat, cam.lng, cam.zoom);
    }
    requestAnimationFrame(() => restoreListScroll());
    setTimeout(() => restoreListScroll(), 80);
    restoringRef.current = false;
  }, [focusPadding, restoreListScroll]);

  // Offsets go stale when the list reshuffles — clear, then scroll after layout.
  useEffect(() => {
    rowOffsets.current = {};
  }, [filtered]);

  useEffect(() => {
    if (!selectedId || !filtered?.length) return;
    // Don't fight session scroll restore with select-into-view.
    if (pendingScrollRestoreRef.current) {
      restoreListScroll();
      return;
    }
    const t = setTimeout(() => scrollToSelected(selectedId), 80);
    return () => clearTimeout(t);
  }, [selectedId, filtered, scrollToSelected, restoreListScroll]);

  const openService = useCallback(
    (id: string) => {
      flushMapSession({
        radiusKm: radiusKmRef.current,
        search,
        selectedCategory,
        selectedId,
        showCallout,
        sheetHeight: sheetHeight.value,
        listScrollY: listScrollYRef.current,
        camera: cameraRef.current,
      });
      router.push(`/service/${id}`);
    },
    [router, search, selectedCategory, selectedId, showCallout, sheetHeight],
  );

  const deselectService = useCallback(() => {
    pendingFocusId.current = null;
    setSelectedId(null);
    setShowCallout(false);
    sheetHeight.value = withSpring(SHEET_COLLAPSED, { damping: 20, stiffness: 200 });
    persistSheetHeight(SHEET_COLLAPSED);
  }, [sheetHeight, persistSheetHeight]);

  const handleBack = useCallback(() => {
    if (selectedId) {
      deselectService();
      return;
    }
    flushMapSession({
      radiusKm: radiusKmRef.current,
      search,
      selectedCategory,
      selectedId: null,
      showCallout: false,
      sheetHeight: sheetHeight.value,
      listScrollY: listScrollYRef.current,
      camera: cameraRef.current,
    });
    router.back();
  }, [
    selectedId,
    deselectService,
    router,
    search,
    selectedCategory,
    sheetHeight,
  ]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        if (selectedId) {
          deselectService();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [selectedId, deselectService]),
  );

  // When returning from service while still mounted, re-apply sheet + list scroll
  // in case native detach briefly reset layout (backup for WebView remount).
  useFocusEffect(
    useCallback(() => {
      const session = getMapSession();
      if (!session.hasSession) return;
      sheetHeight.value = session.sheetHeight;
      listScrollYRef.current = session.listScrollY;
      if (session.camera) {
        cameraRef.current = session.camera;
      }
      requestAnimationFrame(() => {
        if (session.listScrollY > 0) {
          listScrollRef.current?.scrollTo({
            y: session.listScrollY,
            animated: false,
          });
        }
      });
    }, [sheetHeight]),
  );

  const recenter = useCallback(() => {
    restoringRef.current = false;
    refresh();
    if (isFallback) {
      mapRef.current?.fitRadiusKm(latitude, longitude, MAP_FALLBACK_RADIUS_KM);
    } else {
      mapRef.current?.setView(latitude, longitude, MAP_USER_ZOOM);
    }
  }, [refresh, latitude, longitude, isFallback]);

  const onListScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    listScrollYRef.current = y;
    patchMapSession({ listScrollY: y });
  }, []);

  const count = filtered?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <LeafletMapView
        ref={mapRef}
        style={{ flex: 1 }}
        center={mapCenter}
        zoom={mapZoom}
        fitRadiusKm={mapFitRadiusKm}
        markers={leafletMarkers}
        userLocation={{ lat: latitude, lng: longitude }}
        orbitColor={orbitColor}
        theme={mapTheme}
        focusPadding={focusPadding}
        onTooltipPress={openService}
        onFocusComplete={onFocusComplete}
        onCameraChange={onCameraChange}
        onReady={onMapReady}
        onMarkerPress={(id) => {
          const t = filtered?.find((x) => x.serviceId === id);
          if (!t) return;
          // Second tap only opens detail once the callout is visible.
          if (selectedId === id && showCallout) {
            openService(id);
            return;
          }
          if (selectedId === id && !showCallout) {
            // Same pin mid-flight — ignore (wait for focusComplete).
            return;
          }
          focusTalent(t.serviceId, t.latitude, t.longitude);
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: Spacing.three,
          left: Spacing.four,
          right: Spacing.four,
          zIndex: 30,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.two,
        }}
      >
        <Pressable onPress={handleBack} style={{ width: 44, height: 44 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceCard,
              alignItems: 'center',
              justifyContent: 'center',
              ...Shadows.elevated,
            }}
          >
            <CaretLeft size={20} color={colors.ink} weight="bold" />
          </View>
        </Pressable>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un talent, une catégorie..."
          height={44}
          style={{ flex: 1 }}
        />
      </View>

      <CategoryChipMasonry
        style={{ position: 'absolute', top: 68, left: 0, right: 0, zIndex: 30 }}
        categories={categories?.slice(0, 12).map((cat) => ({
          id: cat._id,
          label: cat.nameFr,
          icon: cat.icon,
        }))}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <Animated.View
        pointerEvents="box-none"
        style={[{ position: 'absolute', left: Spacing.four, zIndex: 35 }, radiusBarStyle]}
      >
        <View style={Shadows.nav}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: panelBg,
              borderRadius: Radius.pill,
              overflow: 'hidden',
              padding: 4,
              gap: 2,
            }}
          >
            {RADIUS_OPTIONS.map((r) => {
              const selected = radiusKm === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => selectRadius(r)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${r} kilomètres`}
                  hitSlop={6}
                  style={({ pressed }) => [{ minWidth: 44, height: 32 }, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <View
                    style={{
                      minWidth: 44,
                      height: 32,
                      paddingHorizontal: 10,
                      borderRadius: Radius.pill,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors.orbit : 'transparent',
                    }}
                  >
                    <Text
                      style={[
                        textStyle('micro'),
                        {
                          fontFamily: fontFamily('body', 'medium'),
                          color: selected ? colors.onOrbit : colors.ink,
                        },
                      ]}
                    >
                      {r} km
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[{ position: 'absolute', right: FLUTTER_FAB.edgeMargin, zIndex: 20 }, recenterStyle]}
      >
        <FlutterFab
          size="small"
          onPressed={recenter}
          accessibilityLabel="Recentrer sur ma position"
          backgroundColor={panelBg}
          foregroundColor={colors.ink}
          borderColor={colors.border}
          icon={<Crosshair size={FLUTTER_FAB.smallIconSize} color={colors.ink} weight="bold" />}
        />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: sheetBg,
            borderTopLeftRadius: PANEL_RADIUS,
            borderTopRightRadius: PANEL_RADIUS,
            overflow: 'hidden',
            ...Shadows.elevated,
          },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={pan}>
          <Animated.View onLayout={onSheetHeaderLayout}>
            <View style={{ alignItems: 'center', paddingTop: Spacing.three, paddingBottom: Spacing.two }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: Spacing.four,
                paddingBottom: Spacing.three,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color={colors.orbit} weight="fill" />
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 15,
                    color: colors.ink,
                  }}
                >
                  {locLoading
                    ? 'Localisation...'
                    : `${count} talent${count !== 1 ? 's' : ''} à proximité`}
                </Text>
              </View>
              {selectedId ? (
                <Pressable onPress={() => openService(selectedId)}>
                  <Text style={[textStyle('button'), { color: colors.orbit }]}>Voir →</Text>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        </GestureDetector>

        <Animated.View style={listWrapStyle}>
          <ScrollView
            ref={listScrollRef}
            style={{ flex: 1 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces
            onScroll={onListScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: PAGE_H_PAD,
              paddingBottom: Spacing.eight,
              gap: Spacing.two,
            }}
          >
            {filtered === undefined ? (
              <>
                <ServiceCardSkeleton />
                <ServiceCardSkeleton />
              </>
            ) : filtered.length === 0 ? (
              <EmptyState
                compact
                icon={MapPin}
                title="Aucun talent dans ce rayon"
                description={
                  search.trim() || selectedCategory
                    ? 'Modifiez votre recherche ou vos filtres, ou élargissez le rayon.'
                    : 'Élargissez le rayon de recherche pour découvrir plus de talents.'
                }
                actions={
                  radiusKm < 50
                    ? [{ label: 'Élargir à 50 km', onPress: () => selectRadius(50), variant: 'outline' }]
                    : undefined
                }
              />
            ) : (
              filtered.map((t) => {
                const isSelected = selectedId === t.serviceId;
                const ringColor = categoryAccent(t.categoryIcon, t.categoryLabel);
                return (
                  <View
                    key={t.serviceId}
                    onLayout={(e) => {
                      const y = e.nativeEvent.layout.y;
                      const hadOffset = rowOffsets.current[t.serviceId] != null;
                      rowOffsets.current[t.serviceId] = y;
                      // First layout after selection — scroll once offsets exist.
                      if (isSelected && !hadOffset && !pendingScrollRestoreRef.current) {
                        scrollToSelected(t.serviceId);
                      }
                    }}
                    style={
                      isSelected
                        ? {
                            borderRadius: Radius.md,
                            borderWidth: 2,
                            borderColor: ringColor,
                          }
                        : undefined
                    }
                  >
                    <ServiceCard
                      title={t.title}
                      description={t.description}
                      price={t.price}
                      pricingType={t.pricingType}
                      photo={t.photos[0]}
                      rating={t.rating}
                      reviewCount={t.reviewCount ?? 0}
                      providerName={t.providerName}
                      providerAvatar={t.avatarUrl}
                      city={t.city}
                      isVerified={t.isVerified}
                      isPremium={t.isPremium}
                      categoryIcon={t.categoryIcon}
                      categoryLabel={t.categoryLabel}
                      layout={t.isPremium ? 'card' : 'list'}
                      onPress={() => {
                        if (isSelected && showCallout) {
                          openService(t.serviceId);
                          return;
                        }
                        if (isSelected && !showCallout) return;
                        focusTalent(t.serviceId, t.latitude, t.longitude);
                      }}
                    />
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
