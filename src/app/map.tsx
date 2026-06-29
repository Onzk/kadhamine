import React, { useState } from 'react';
import { View, Text, Platform, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Navigation } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useLocation } from '@/hooks/useLocation';
import { NDJAMENA, formatDistance, openInMaps } from '@/utils/geo';
import { api } from '../../convex/_generated/api';

let MapView: React.ComponentType<any> | null = null;
let Marker: React.ComponentType<any> | null = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

export default function MapScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { latitude, longitude, loading: locLoading } = useLocation();
  const [radiusKm, setRadiusKm] = useState(25);

  const talents = useQuery(api.services.listForMap, {
    latitude,
    longitude,
    radiusKm,
  });

  const region = {
    latitude,
    longitude,
    latitudeDelta: NDJAMENA.latitudeDelta,
    longitudeDelta: NDJAMENA.longitudeDelta,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Carte des talents" showBack />

      <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', gap: 8 }}>
        {[5, 15, 25, 50].map((r) => (
          <CategoryChip
            key={r}
            label={`${r} km`}
            selected={radiusKm === r}
            onPress={() => setRadiusKm(r)}
          />
        ))}
      </View>

      {Platform.OS === 'web' || !MapView ? (
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ color: colors.muted, marginBottom: 12 }}>
            La carte est disponible sur iOS et Android.
          </Text>
          {talents?.map((t) => t && (
            <Pressable
              key={t.serviceId}
              onPress={() => router.push(`/service/${t.serviceId}`)}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontWeight: '600', color: colors.ink }}>{t.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                {t.providerName}
                {t.distanceKm !== undefined ? ` · ${formatDistance(t.distanceKm)}` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <MapView style={{ flex: 1 }} region={region} showsUserLocation showsMyLocationButton>
            {Marker &&
              talents?.map(
                (t) =>
                  t && (
                    <Marker
                    key={t.serviceId}
                    coordinate={{ latitude: t.latitude, longitude: t.longitude }}
                    title={t.title}
                    description={t.providerName}
                    pinColor={t.isPremium ? '#FECB00' : '#002664'}
                    onCalloutPress={() => router.push(`/service/${t.serviceId}`)}
                  />
                ),
              )}
          </MapView>

          <View
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              backgroundColor: colors.surfaceCard,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>
                {locLoading ? 'Localisation...' : `${talents?.length ?? 0} talents à proximité`}
              </Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(openInMaps(latitude, longitude, 'Ma position'))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
            >
              <Navigation size={14} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.primary }}>Ouvrir dans Google Maps</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
