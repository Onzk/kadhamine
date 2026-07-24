import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'convex/react';
import {
  Briefcase,
  CheckCircle,
  CurrencyCircleDollar,
  Eye,
  MapPin,
  Phone,
  TextAlignLeft,
} from 'phosphor-react-native';

import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { CityChips } from '@/components/auth/AuthExtras';
import {
  LocationMapField,
  LocationPickerSheet,
  type LocationPickerResult,
} from '@/components/map/LocationPickerSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { PillGroup } from '@/components/ui/PillGroup';
import {
  MVP_CITIES,
  MVP_CITY_COORDS,
  MVP_CITY_REGION,
  type MvpCity,
} from '@/constants/chad';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

type Availability = 'available' | 'busy' | 'unavailable';

function isMvpCity(city: string): city is MvpCity {
  return (MVP_CITIES as readonly string[]).includes(city);
}

function parseOptionalInt(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const n = Number(trimmed.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

/** Gestion du profil public prestataire (édition) — vitrine via aperçu. */
export default function ProviderProfileManageScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const updateProfile = useMutation(api.profiles.update);

  const profile = user?.profile;
  const isProvider = user?.role === 'provider';

  const [hydrated, setHydrated] = useState(false);
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availability, setAvailability] = useState<Availability>('available');
  const [city, setCity] = useState<string>(MVP_CITIES[0]);
  const [region, setRegion] = useState(MVP_CITY_REGION[MVP_CITIES[0]]);
  const [latitude, setLatitude] = useState(MVP_CITY_COORDS[MVP_CITIES[0]].lat);
  const [longitude, setLongitude] = useState(MVP_CITY_COORDS[MVP_CITIES[0]].lng);
  const [addressLabel, setAddressLabel] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile || hydrated) return;
    setBio(profile.bio ?? '');
    setExperienceYears(
      profile.experienceYears != null && profile.experienceYears > 0
        ? String(profile.experienceYears)
        : '',
    );
    setHourlyRate(
      profile.hourlyRate != null && profile.hourlyRate > 0 ? String(profile.hourlyRate) : '',
    );
    setAvailability(
      profile.availability === 'busy' || profile.availability === 'unavailable'
        ? profile.availability
        : 'available',
    );
    if (isMvpCity(profile.city)) {
      setCity(profile.city);
      setRegion(profile.region || MVP_CITY_REGION[profile.city]);
    } else {
      setCity(profile.city);
      setRegion(profile.region);
    }
    setLatitude(
      typeof profile.latitude === 'number' && Number.isFinite(profile.latitude)
        ? profile.latitude
        : isMvpCity(profile.city)
          ? MVP_CITY_COORDS[profile.city].lat
          : MVP_CITY_COORDS[MVP_CITIES[0]].lat,
    );
    setLongitude(
      typeof profile.longitude === 'number' && Number.isFinite(profile.longitude)
        ? profile.longitude
        : isMvpCity(profile.city)
          ? MVP_CITY_COORDS[profile.city].lng
          : MVP_CITY_COORDS[MVP_CITIES[0]].lng,
    );
    setAddressLabel(profile.address ?? null);
    setPhone(profile.phone ?? user?.phone ?? '');
    setHydrated(true);
  }, [profile, user?.phone, hydrated]);

  const availabilityOptions = useMemo(
    () => [
      { label: t('common.available'), value: 'available' },
      { label: t('common.busy'), value: 'busy' },
      { label: t('common.unavailable'), value: 'unavailable' },
    ],
    [t],
  );

  const handleCityChange = (next: string) => {
    if (!isMvpCity(next)) return;
    setCity(next);
    setRegion(MVP_CITY_REGION[next]);
    setLatitude(MVP_CITY_COORDS[next].lat);
    setLongitude(MVP_CITY_COORDS[next].lng);
    setAddressLabel(null);
  };

  const handlePickerConfirm = (result: LocationPickerResult) => {
    setLatitude(result.lat);
    setLongitude(result.lng);
    setAddressLabel(result.addressLabel ?? null);
    if (result.city && isMvpCity(result.city)) {
      setCity(result.city);
      setRegion(result.region || MVP_CITY_REGION[result.city]);
    } else if (result.region) {
      setRegion(result.region);
    }
    setPickerOpen(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    const exp = parseOptionalInt(experienceYears);
    const rate = parseOptionalInt(hourlyRate);
    if (exp === undefined) {
      setError(t('providerProfile.experienceInvalid'));
      return;
    }
    if (rate === undefined) {
      setError(t('providerProfile.hourlyRateInvalid'));
      return;
    }
    if (!city.trim()) {
      setError(t('providerProfile.cityRequired'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateProfile({
        bio: bio.trim(),
        experienceYears: exp,
        hourlyRate: rate,
        availability,
        city: city.trim(),
        region: region.trim(),
        address: addressLabel?.trim() || undefined,
        phone: phone.trim(),
        latitude,
        longitude,
      });
      alert({
        title: t('providerProfile.savedTitle'),
        message: t('providerProfile.savedBody'),
        icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <PageScaffold
        title={t('providerProfile.title')}
        subtitle={t('providerProfile.subtitle')}
        showBack
      >
        <EmptyState
          title={t('auth.loginRequiredTitle')}
          description={t('orders.loginRequired')}
          actionLabel={t('auth.signIn')}
          onAction={() => router.push('/(auth)/login')}
        />
      </PageScaffold>
    );
  }

  if (!isProvider || !profile) {
    return (
      <PageScaffold
        title={t('providerProfile.title')}
        subtitle={t('providerProfile.subtitle')}
        showBack
      >
        <EmptyState
          title={t('skills.providersOnlyTitle')}
          description={t('skills.providersOnlyBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </PageScaffold>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('providerProfile.title')}
        subtitle={t('providerProfile.subtitle')}
        showBack
        contentContainerStyle={{ paddingBottom: Spacing.eight }}
      >
        <View
          style={{
            paddingHorizontal: PAGE_H_PAD,
            paddingTop: Spacing.five,
            gap: Spacing.five,
          }}
        >
          <Pressable
            onPress={() =>
              router.push({ pathname: '/provider/[id]', params: { id: profile._id } })
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t('providerProfile.preview')}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.two,
                alignSelf: 'flex-start',
              }}
            >
              <Eye size={18} color={colors.orbit} weight="bold" />
              <Text
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 14,
                  color: colors.orbit,
                }}
              >
                {t('providerProfile.preview')}
              </Text>
            </View>
          </Pressable>

          {error ? (
            <Text style={[textStyle('caption'), { color: colors.error }]}>{error}</Text>
          ) : null}

          <Section title={t('providerProfile.sectionPresentation')}>
            <AuthField
              label={t('providerProfile.bio')}
              value={bio}
              onChangeText={setBio}
              placeholder={t('providerProfile.bioPlaceholder')}
              hint={t('providerProfile.bioHint')}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 96 }}
              leftIcon={<TextAlignLeft size={20} />}
            />
            <AuthField
              label={t('providerProfile.experience')}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="5"
              keyboardType="number-pad"
              hint={t('providerProfile.experienceHint')}
              leftIcon={<Briefcase size={20} />}
            />
            <AuthField
              label={t('providerProfile.hourlyRate')}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="15000"
              keyboardType="number-pad"
              hint={t('providerProfile.hourlyRateHint')}
              leftIcon={<CurrencyCircleDollar size={20} />}
            />
          </Section>

          <Section title={t('providerProfile.sectionAvailability')}>
            <PillGroup
              options={availabilityOptions}
              value={availability}
              onChange={(v) => setAvailability(v as Availability)}
            />
          </Section>

          <Section title={t('providerProfile.sectionLocation')}>
            <CityChips
              cities={MVP_CITIES}
              value={isMvpCity(city) ? city : ''}
              onChange={handleCityChange}
            />
            <AuthField
              label={t('services.fieldRegion')}
              value={region}
              onChangeText={setRegion}
              placeholder={t('services.fieldRegion')}
              leftIcon={<MapPin size={20} />}
              editable={false}
            />
            <LocationMapField
              label={t('providerProfile.coords')}
              latitude={latitude}
              longitude={longitude}
              addressLabel={addressLabel}
              city={city}
              region={region}
              onPress={() => setPickerOpen(true)}
            />
            <Text style={[textStyle('micro'), { color: colors.slate }]}>
              {t('providerProfile.coordsHint')}
            </Text>
          </Section>

          <Section title={t('providerProfile.sectionContact')}>
            <AuthField
              label={t('providerProfile.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder="+235 66 00 00 00"
              keyboardType="phone-pad"
              hint={t('providerProfile.phoneHint')}
              leftIcon={<Phone size={20} />}
            />
          </Section>

          <AuthPrimaryButton
            title={t('common.save')}
            onPress={handleSave}
            loading={loading}
            disabled={!hydrated || loading}
            tone="orbit"
          />
        </View>
      </PageScaffold>

      <LocationPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        initialAddressLabel={addressLabel}
        onConfirm={handlePickerConfirm}
        orbitColor={colors.orbit}
        title={t('providerProfile.pickerTitle')}
        subtitle={t('providerProfile.pickerSubtitle')}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: Spacing.three }}>
      <Text
        style={{
          fontFamily: fontFamily('body', 'medium'),
          fontSize: 15,
          color: colors.ink,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: Spacing.three }}>{children}</View>
    </View>
  );
}
