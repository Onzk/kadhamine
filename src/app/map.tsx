import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import {
  CaretLeft,
  Crosshair,
  MapPin,
} from 'phosphor-react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
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
  type LeafletMapHandle,
  type LeafletMapTheme,
  type LeafletMarkerData,
} from '@/components/map/LeafletMapView';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useLocation } from '@/hooks/useLocation';
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
/** Search bar + chips + in-map callout — leave room above pin. */
const MAP_FOCUS_TOP_PAD = 160;
const FOCUS_ZOOM = 15;

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

export default function MapScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { latitude, longitude, loading: locLoading, refresh } = useLocation();
  const [radiusKm, setRadiusKm] = useState(25);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<LeafletMapHandle>(null);
  const appliedLocKey = useRef<string | null>(null);

  const panelBg = colors.surfaceCard;
  const orbitColor = colors.orbit;

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

  // When GPS becomes available after the N'Djamena fallback, move the map once.
  useEffect(() => {
    if (locLoading) return;
    const key = `${latitude},${longitude}`;
    if (appliedLocKey.current === null) {
      appliedLocKey.current = key;
      return;
    }
    if (appliedLocKey.current === key) return;
    appliedLocKey.current = key;
    mapRef.current?.setView(latitude, longitude, 12);
  }, [latitude, longitude, locLoading]);

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
          isPremium: t.isPremium,
          tooltip: selected
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
    [filtered, selectedId],
  );

  const sheetHeight = useSharedValue(SHEET_COLLAPSED);
  const dragStart = useSharedValue(SHEET_COLLAPSED);
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
      sheetHeight.value = withSpring(nearestSnap(sheetHeight.value), {
        damping: 20,
        stiffness: 200,
      });
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

  const onSheetHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => {
      headerHeight.value = e.nativeEvent.layout.height;
    },
    [headerHeight],
  );

  const focusTalent = useCallback(
    (serviceId: string, lat: number, lng: number) => {
      setSelectedId(serviceId);
      mapRef.current?.setPadding(focusPadding);
      mapRef.current?.flyTo(lat, lng, FOCUS_ZOOM);
      sheetHeight.value = withSpring(SHEET_MID, { damping: 20, stiffness: 200 });
    },
    [sheetHeight, focusPadding],
  );

  const openService = useCallback(
    (id: string) => {
      router.push(`/service/${id}`);
    },
    [router],
  );

  const recenter = useCallback(() => {
    refresh();
    mapRef.current?.setView(latitude, longitude, 12);
  }, [refresh, latitude, longitude]);

  const count = filtered?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <LeafletMapView
        ref={mapRef}
        style={{ flex: 1 }}
        center={{ lat: latitude, lng: longitude }}
        zoom={12}
        markers={leafletMarkers}
        userLocation={{ lat: latitude, lng: longitude }}
        orbitColor={orbitColor}
        theme={mapTheme}
        focusPadding={focusPadding}
        onTooltipPress={openService}
        onMarkerPress={(id) => {
          const t = filtered?.find((x) => x.serviceId === id);
          if (!t) return;
          if (selectedId === id) {
            openService(id);
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
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44 }}>
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
        style={[
          {
            position: 'absolute',
            left: Spacing.four,
            flexDirection: 'row',
            backgroundColor: panelBg,
            borderRadius: Radius.pill,
            padding: 4,
            gap: 2,
            zIndex: 20,
            ...Shadows.nav,
          },
          recenterStyle,
        ]}
      >
        {[5, 15, 25, 50].map((r) => (
          <Pressable key={r} onPress={() => setRadiusKm(r)}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: Radius.pill,
                backgroundColor: radiusKm === r ? colors.orbit : 'transparent',
              }}
            >
              <Text
                style={[
                  textStyle('micro'),
                  {
                    fontFamily: fontFamily('body', 'medium'),
                    color: radiusKm === r ? colors.onOrbit : colors.ink,
                  },
                ]}
              >
                {r} km
              </Text>
            </View>
          </Pressable>
        ))}
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
            backgroundColor: panelBg,
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
            style={{ flex: 1 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces
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
                    ? [{ label: 'Élargir à 50 km', onPress: () => setRadiusKm(50), variant: 'outline' }]
                    : undefined
                }
              />
            ) : (
              filtered.map((t) => {
                const isSelected = selectedId === t.serviceId;
                return (
                  <View
                    key={t.serviceId}
                    style={
                      isSelected
                        ? {
                            borderRadius: Radius.md,
                            borderWidth: 0.1,
                            borderColor: colors.orbit,
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
                        if (isSelected) {
                          openService(t.serviceId);
                          return;
                        }
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
