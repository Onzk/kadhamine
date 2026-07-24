import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { MapPin } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { AuthPrimaryButton } from '@/components/auth/AuthField';
import {
  LeafletMapView,
  MAP_PICKER_ZOOM,
  type LeafletMapTheme,
} from '@/components/map/LeafletMapView';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { NDJAMENA } from '@/utils/geo';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

export type LocationPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (lat: number, lng: number) => void;
  orbitColor?: string;
  title?: string;
  subtitle?: string;
};

function formatCoord(n: number): string {
  return n.toFixed(5);
}

/**
 * Bottom sheet with Leaflet map — tap or drag pin to pick lat/lng.
 */
export function LocationPickerSheet({
  visible,
  onClose,
  initialLat,
  initialLng,
  onConfirm,
  orbitColor,
  title,
  subtitle,
}: LocationPickerSheetProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();

  const fallbackLat = NDJAMENA.latitude;
  const fallbackLng = NDJAMENA.longitude;

  const seedLat =
    typeof initialLat === 'number' && Number.isFinite(initialLat) ? initialLat : fallbackLat;
  const seedLng =
    typeof initialLng === 'number' && Number.isFinite(initialLng) ? initialLng : fallbackLng;

  const [sessionKey, setSessionKey] = useState(0);
  const [draftLat, setDraftLat] = useState(seedLat);
  const [draftLng, setDraftLng] = useState(seedLng);
  const [center, setCenter] = useState({ lat: seedLat, lng: seedLng });

  useEffect(() => {
    if (!visible) return;
    const lat =
      typeof initialLat === 'number' && Number.isFinite(initialLat) ? initialLat : fallbackLat;
    const lng =
      typeof initialLng === 'number' && Number.isFinite(initialLng) ? initialLng : fallbackLng;
    setDraftLat(lat);
    setDraftLng(lng);
    setCenter({ lat, lng });
    setSessionKey((k) => k + 1);
  }, [visible, initialLat, initialLng, fallbackLat, fallbackLng]);

  const snapHeight = Math.round(windowHeight * 0.85);
  const mapHeight = Math.max(260, Math.round(snapHeight * 0.52));

  const mapTheme = useMemo<LeafletMapTheme>(
    () => ({
      surface: colors.surface,
      surfaceStrong: colors.surfaceStrong,
      ink: colors.ink,
      muted: colors.muted,
      border: colors.borderStrong,
      orbit: orbitColor ?? colors.orbit,
      rating: colors.warning,
      info: colors.info,
    }),
    [colors, orbitColor],
  );

  const handleConfirm = () => {
    onConfirm(draftLat, draftLng);
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={title ?? t('services.locationPickerTitle')}
      subtitle={subtitle ?? t('services.locationPickerSubtitle')}
      scrollable={false}
      stickyHeader={false}
      maxHeightRatio={0.85}
      snapHeight={snapHeight}
      contentContainerStyle={{ paddingHorizontal: 0 }}
    >
      <View style={{ width: '100%', gap: Spacing.three }}>
        <View
          style={{
            marginHorizontal: PAGE_H_PAD,
            height: mapHeight,
            borderRadius: Radius.lg,
            overflow: 'hidden',
            borderWidth: BorderWidth.default,
            borderColor: colors.borderStrong,
            backgroundColor: colors.surfaceStrong,
          }}
        >
          {visible ? (
            <LeafletMapView
              key={sessionKey}
              picker
              center={center}
              zoom={MAP_PICKER_ZOOM}
              markers={[]}
              orbitColor={orbitColor ?? colors.orbit}
              theme={mapTheme}
              onPickerPosition={({ lat, lng }) => {
                setDraftLat(lat);
                setDraftLng(lng);
              }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
        </View>

        <View
          style={{
            marginHorizontal: PAGE_H_PAD,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.two,
            paddingVertical: Spacing.two,
            paddingHorizontal: Spacing.three,
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            borderWidth: BorderWidth.default,
            borderColor: colors.border,
          }}
        >
          <MapPin size={18} color={colors.orbit} weight="fill" />
          <Text style={[textStyle('caption'), { color: colors.ink, flex: 1 }]}>
            {t('services.coordsSummary', {
              lat: formatCoord(draftLat),
              lng: formatCoord(draftLng),
            })}
          </Text>
        </View>

        <View style={{ paddingHorizontal: PAGE_H_PAD }}>
          <SheetActionsFooter>
            <SheetSingleAction>
              <AuthPrimaryButton
                title={t('services.useThisLocation')}
                onPress={handleConfirm}
                tone="orbit"
                flat
                fill
              />
            </SheetSingleAction>
          </SheetActionsFooter>
        </View>
      </View>
    </AppBottomSheet>
  );
}

export type LocationMapFieldProps = {
  label: string;
  latitude: number | null;
  longitude: number | null;
  onPress: () => void;
  disabled?: boolean;
};

/** Read-only coords summary + open-map action for service form. */
export function LocationMapField({
  label,
  latitude,
  longitude,
  onPress,
  disabled = false,
}: LocationMapFieldProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const hasCoords =
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude);

  return (
    <View style={{ marginBottom: Spacing.three }}>
      <Text
        style={[
          textStyle('caption'),
          {
            color: colors.ink,
            fontWeight: '600',
            marginBottom: Spacing.two,
          },
        ]}
      >
        {label}
      </Text>

      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        })}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 52,
            paddingHorizontal: Spacing.four,
            paddingVertical: Spacing.three,
            backgroundColor: colors.surfaceCard,
            borderRadius: 12,
            borderWidth: BorderWidth.default,
            borderColor: colors.borderStrong,
            gap: Spacing.three,
          }}
        >
          <MapPin size={20} color={colors.orbit} weight="fill" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={[
                textStyle('body'),
                { color: hasCoords ? colors.ink : colors.muted },
              ]}
              numberOfLines={1}
            >
              {hasCoords
                ? t('services.coordsSummary', {
                    lat: formatCoord(latitude),
                    lng: formatCoord(longitude),
                  })
                : t('services.pickOnMap')}
            </Text>
            <Text style={[textStyle('caption'), { color: colors.muted }]}>
              {hasCoords ? t('services.editOnMap') : t('services.pickOnMapHint')}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
