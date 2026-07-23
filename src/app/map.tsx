import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Platform,
  Pressable,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import {
  CaretLeft,
  MagnifyingGlass,
  Crosshair,
  MapPin,
} from 'phosphor-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { FilterChip } from '@/components/ui/FilterChip';
import { FlutterFab, FLUTTER_FAB } from '@/components/ui/FlutterFab';
import { TalentMapPin } from '@/components/map/TalentMapPin';
import { MapTalentRow } from '@/components/map/MapTalentRow';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useLocation } from '@/hooks/useLocation';
import { NDJAMENA } from '@/utils/geo';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';

let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_COLLAPSED = 110;
const SHEET_MID = Math.round(SCREEN_H * 0.42);
const SHEET_EXPANDED = Math.round(SCREEN_H * 0.72);
const SNAP_POINTS = [SHEET_COLLAPSED, SHEET_MID, SHEET_EXPANDED];

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
  const mapRef = useRef<any>(null);

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
          t.providerName.toLowerCase().includes(q) ||
          (t.categoryLabel?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [talents, selectedCategory, search]);

  const sheetHeight = useSharedValue(SHEET_COLLAPSED);
  const dragStart = useSharedValue(SHEET_COLLAPSED);

  const pan = Gesture.Pan()
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

  // Le mini FAB de recentrage suit le sheet (reste 16px au-dessus).
  const recenterStyle = useAnimatedStyle(() => ({
    bottom: sheetHeight.value + FLUTTER_FAB.edgeMargin,
  }));

  const focusTalent = useCallback(
    (serviceId: string, lat: number, lng: number) => {
      setSelectedId(serviceId);
      mapRef.current?.animateToRegion?.(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        350,
      );
      sheetHeight.value = withSpring(SHEET_MID, { damping: 20, stiffness: 200 });
    },
    [sheetHeight],
  );

  const recenter = useCallback(() => {
    refresh();
    mapRef.current?.animateToRegion?.(
      {
        latitude,
        longitude,
        latitudeDelta: NDJAMENA.latitudeDelta,
        longitudeDelta: NDJAMENA.longitudeDelta,
      },
      400,
    );
  }, [refresh, latitude, longitude]);

  const count = filtered?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Carte plein écran */}
      {Platform.OS === 'web' || !MapView ? (
        <View style={{ flex: 1, paddingTop: 120, paddingHorizontal: Spacing.four }}>
          <Text style={{ color: colors.muted, marginBottom: Spacing.four }}>
            La carte interactive est disponible sur iOS et Android.
          </Text>
          <ScrollView>
            {filtered?.map((t) => (
              <MapTalentRow
                key={t.serviceId}
                item={t}
                selected={selectedId === t.serviceId}
                onPress={() => router.push(`/service/${t.serviceId}`)}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: NDJAMENA.latitudeDelta,
            longitudeDelta: NDJAMENA.longitudeDelta,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {Marker &&
            filtered?.map((t) => (
              <Marker
                key={t.serviceId}
                coordinate={{ latitude: t.latitude, longitude: t.longitude }}
                onPress={() => focusTalent(t.serviceId, t.latitude, t.longitude)}
                tracksViewChanges={false}
              >
                <TalentMapPin
                  categoryIcon={t.categoryIcon}
                  isPremium={t.isPremium}
                  selected={selectedId === t.serviceId}
                />
              </Marker>
            ))}
        </MapView>
      )}

      {/* Header flottant */}
      <View
        style={{
          position: 'absolute',
          top: Spacing.three,
          left: Spacing.four,
          right: Spacing.four,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.two,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceCard,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
            ...Shadows.elevated,
          })}
        >
          <CaretLeft size={20} color={colors.ink} weight="bold" />
        </Pressable>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.pill,
            paddingHorizontal: Spacing.four,
            height: 44,
            gap: 8,
            ...Shadows.elevated,
          }}
        >
          <MagnifyingGlass size={16} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un talent, une catégorie..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 0 }}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Chips catégories flottants */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ position: 'absolute', top: 68, left: 0, right: 0 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          gap: Spacing.two,
          paddingVertical: Spacing.two,
        }}
      >
        <FilterChip
          label="Toutes"
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(undefined)}
        />
        {categories?.slice(0, 10).map((cat) => (
          <FilterChip
            key={cat._id}
            label={cat.nameFr}
            icon={cat.icon}
            selected={selectedCategory === cat._id}
            onPress={() => setSelectedCategory(cat._id)}
          />
        ))}
      </ScrollView>

      {/* Indicateur rayon — bas gauche, suit le sheet */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: Spacing.four,
            flexDirection: 'row',
            backgroundColor: colors.surfaceCard,
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
          <Pressable
            key={r}
            onPress={() => setRadiusKm(r)}
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
                  color: radiusKm === r ? colors.onPrimary : colors.ink,
                },
              ]}
            >
              {r} km
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      {/* Mini FAB recentrage — suit le sheet, reste visible au-dessus */}
      <Animated.View
        pointerEvents="box-none"
        style={[{ position: 'absolute', right: FLUTTER_FAB.edgeMargin, zIndex: 20 }, recenterStyle]}
      >
        <FlutterFab
          size="small"
          onPressed={recenter}
          accessibilityLabel="Recentrer sur ma position"
          backgroundColor={colors.surfaceCard}
          foregroundColor={colors.ink}
          borderColor={colors.border}
          icon={<Crosshair size={FLUTTER_FAB.smallIconSize} color={colors.ink} weight="bold" />}
        />
      </Animated.View>

      {/* Bottom sheet draggable */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.surfaceCard,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
              overflow: 'hidden',
              ...Shadows.elevated,
            },
            sheetStyle,
          ]}
        >
          {/* Poignée */}
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

          {/* En-tête sheet */}
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
              <Pressable onPress={() => router.push(`/service/${selectedId}`)}>
                <Text style={[textStyle('button'), { color: colors.orbit }]}>Voir →</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Liste scrollable */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.eight }}
          >
            {filtered === undefined ? (
              <Text style={{ textAlign: 'center', color: colors.muted, padding: Spacing.six }}>
                Chargement...
              </Text>
            ) : filtered.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.muted, padding: Spacing.six }}>
                Aucun talent dans ce rayon.
              </Text>
            ) : (
              filtered.map((t) => (
                <MapTalentRow
                  key={t.serviceId}
                  item={t}
                  selected={selectedId === t.serviceId}
                  onPress={() => {
                    if (selectedId === t.serviceId) {
                      router.push(`/service/${t.serviceId}`);
                      return;
                    }
                    focusTalent(t.serviceId, t.latitude, t.longitude);
                  }}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
