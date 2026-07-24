import React, { useEffect, useState } from 'react';
import { View, Text, Platform, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Article,
  CurrencyCircleDollar,
  CalendarBlank,
  MapPin,
  CheckCircle,
  TextAlignLeft,
  ArrowRight,
  ArrowLeft,
  WarningCircle,
} from 'phosphor-react-native';
import type { Id } from '../../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { AuthStepper, CityChips } from '@/components/auth/AuthExtras';
import { CategoryPickerField } from '@/components/ui/CategoryPickerSheet';
import {
  LocationMapField,
  LocationPickerSheet,
} from '@/components/map/LocationPickerSheet';
import { PillGroup } from '@/components/ui/PillGroup';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  MVP_CITIES,
  MVP_CITY_COORDS,
  MVP_CITY_REGION,
  type MvpCity,
} from '@/constants/chad';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

type PricingType = 'fixed' | 'negotiable';
type Availability = 'available' | 'busy' | 'unavailable';
type LocationMode = 'provider' | 'custom';
type FormStep = 1 | 2 | 3 | 4;

const TOTAL_STEPS = 4;
const MAX_PHOTOS = 5;
const COORD_EPS = 0.0001;

function sameCoord(a?: number, b?: number): boolean {
  if (a === undefined || b === undefined) return a === b;
  return Math.abs(a - b) < COORD_EPS;
}

function isMvpCity(city: string): city is MvpCity {
  return (MVP_CITIES as readonly string[]).includes(city);
}

function applyCityDefaults(
  city: MvpCity,
  setters: {
    setCity: (v: string) => void;
    setRegion: (v: string) => void;
    setLatitude: (v: string) => void;
    setLongitude: (v: string) => void;
  },
) {
  const coords = MVP_CITY_COORDS[city];
  setters.setCity(city);
  setters.setRegion(MVP_CITY_REGION[city]);
  setters.setLatitude(String(coords.lat));
  setters.setLongitude(String(coords.lng));
}

function parseCoord(value: string): number | null {
  const n = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function ProviderServiceFormScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const serviceId = params.id as Id<'services'> | undefined;
  const isEditing = !!serviceId;

  const myProfile = useQuery(api.profiles.getMyProfile);
  const existing = useQuery(
    api.services.getById,
    serviceId ? { serviceId } : 'skip',
  );
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);

  const [step, setStep] = useState<FormStep>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('fixed');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [deliveryDays, setDeliveryDays] = useState('');
  const [availability, setAvailability] = useState<Availability>('available');
  const [locationMode, setLocationMode] = useState<LocationMode>('provider');
  const [city, setCity] = useState<string>(MVP_CITIES[0]);
  const [region, setRegion] = useState(MVP_CITY_REGION[MVP_CITIES[0]]);
  const [latitude, setLatitude] = useState(String(MVP_CITY_COORDS[MVP_CITIES[0]].lat));
  const [longitude, setLongitude] = useState(String(MVP_CITY_COORDS[MVP_CITIES[0]].lng));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photos, setPhotos] = useState<ImagePickerValueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(!isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !existing?.service) return;
    if (existing.service.providerId !== user?._id) return;
    // Wait for profile so we can detect inherit vs custom location.
    if (myProfile === undefined) return;

    const s = existing.service;
    setTitle(s.title);
    setDescription(s.description);
    setPrice(s.price != null ? String(s.price) : '');
    setPricingType(s.pricingType);
    setCategoryId(s.categoryId);
    setDeliveryDays(s.deliveryDays != null ? String(s.deliveryDays) : '');
    setAvailability(s.availability);

    const inheritsProvider =
      !!myProfile &&
      s.city === myProfile.city &&
      s.region === myProfile.region &&
      sameCoord(s.latitude, myProfile.latitude) &&
      sameCoord(s.longitude, myProfile.longitude);

    if (inheritsProvider) {
      setLocationMode('provider');
      if (isMvpCity(myProfile.city)) {
        applyCityDefaults(myProfile.city, {
          setCity,
          setRegion,
          setLatitude,
          setLongitude,
        });
      } else {
        setCity(myProfile.city);
        setRegion(myProfile.region);
        setLatitude(
          myProfile.latitude != null ? String(myProfile.latitude) : '',
        );
        setLongitude(
          myProfile.longitude != null ? String(myProfile.longitude) : '',
        );
      }
    } else {
      setLocationMode('custom');
      if (isMvpCity(s.city)) {
        setCity(s.city);
        setRegion(s.region || MVP_CITY_REGION[s.city]);
      } else {
        setCity(s.city);
        setRegion(s.region);
      }
      setLatitude(s.latitude != null ? String(s.latitude) : '');
      setLongitude(s.longitude != null ? String(s.longitude) : '');
    }

    setPhotos(
      (s.photos ?? []).map((uri, i) => ({
        uri,
        storageId: s.photoStorageIds?.[i],
      })),
    );
    setHydrated(true);
  }, [existing, isEditing, user?._id, myProfile]);

  const parsedLat = parseCoord(latitude);
  const parsedLng = parseCoord(longitude);
  const customLocationValid =
    city.trim().length > 0 &&
    region.trim().length > 0 &&
    parsedLat !== null &&
    parsedLng !== null;

  const step1Valid =
    hydrated &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !!categoryId;
  const step2Valid =
    hydrated && (pricingType === 'negotiable' || !!price.trim());
  const step3Valid = hydrated;
  const step4Valid =
    hydrated && (locationMode === 'provider' || customLocationValid);

  const canSave = step1Valid && step2Valid && step4Valid;

  const stepMeta: Record<FormStep, { title: string; subtitle: string }> = {
    1: {
      title: t('services.stepInfosTitle'),
      subtitle: t('services.stepInfosSubtitle'),
    },
    2: {
      title: t('services.stepPricingTitle'),
      subtitle: t('services.stepPricingSubtitle'),
    },
    3: {
      title: t('services.stepMediaTitle'),
      subtitle: t('services.stepMediaSubtitle'),
    },
    4: {
      title: t('services.stepLocationTitle'),
      subtitle: t('services.stepLocationSubtitle'),
    },
  };

  const pageTitle = isEditing ? t('services.edit') : t('services.new');
  const headerTitle = `${pageTitle} · ${stepMeta[step].title}`;

  const goBack = () => {
    setError('');
    if (step > 1) {
      setStep((s) => (s - 1) as FormStep);
    } else {
      router.back();
    }
  };

  const goNext = () => {
    if (step === 1) {
      if (!step1Valid) {
        setError(t('services.stepInfosError'));
        return;
      }
      setError('');
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!step2Valid) {
        setError(t('services.stepPricingError'));
        return;
      }
      setError('');
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!step3Valid) return;
      setError('');
      setStep(4);
    }
  };

  const handleLocationModeChange = (value: string) => {
    const mode = value as LocationMode;
    setLocationMode(mode);
    if (mode === 'custom') {
      if (isMvpCity(city)) {
        applyCityDefaults(city, {
          setCity,
          setRegion,
          setLatitude,
          setLongitude,
        });
      } else if (myProfile && isMvpCity(myProfile.city)) {
        applyCityDefaults(myProfile.city, {
          setCity,
          setRegion,
          setLatitude,
          setLongitude,
        });
      } else if (!city.trim()) {
        applyCityDefaults(MVP_CITIES[0], {
          setCity,
          setRegion,
          setLatitude,
          setLongitude,
        });
      }
    }
  };

  const handleCityChange = (next: string) => {
    if (isMvpCity(next)) {
      applyCityDefaults(next, {
        setCity,
        setRegion,
        setLatitude,
        setLongitude,
      });
      return;
    }
    setCity(next);
  };

  const handlePickerConfirm = (lat: number, lng: number) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
  };

  const handleSave = async () => {
    if (!canSave || !categoryId) return;
    if (locationMode === 'custom' && !customLocationValid) {
      setError(t('services.stepLocationError'));
      alert({
        title: t('common.error'),
        message: t('services.coordsHint'),
      });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const photoStorageIds = photos
        .map((p) => p.storageId)
        .filter((id): id is Id<'_storage'> => !!id);
      const photoUrls = photos.map((p) => p.uri);
      const parsedPrice =
        pricingType === 'fixed' && price.trim()
          ? parseInt(price, 10)
          : undefined;
      const parsedDays = deliveryDays.trim()
        ? parseInt(deliveryDays, 10)
        : undefined;

      const allPhotosHaveStorage =
        photos.length > 0 && photos.every((p) => !!p.storageId);
      const photoPayload =
        photos.length === 0
          ? { photos: [] as string[], photoStorageIds: [] as Id<'_storage'>[] }
          : allPhotosHaveStorage
            ? { photoStorageIds }
            : { photos: photoUrls };

      const customLocationPayload =
        locationMode === 'custom'
          ? {
              city: city.trim(),
              region: region.trim(),
              latitude: parsedLat!,
              longitude: parsedLng!,
            }
          : null;

      if (isEditing && serviceId) {
        const locationPatch =
          locationMode === 'custom'
            ? customLocationPayload!
            : myProfile
              ? {
                  city: myProfile.city,
                  region: myProfile.region,
                  latitude: myProfile.latitude,
                  longitude: myProfile.longitude,
                }
              : {};

        await updateService({
          serviceId,
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId as Id<'categories'>,
          pricingType,
          price: parsedPrice,
          deliveryDays: parsedDays,
          availability,
          ...locationPatch,
          ...photoPayload,
        });
        alert({
          title: t('services.updatedTitle'),
          message: t('services.updatedBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
        router.back();
      } else {
        await createService({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId as Id<'categories'>,
          pricingType,
          price: parsedPrice,
          deliveryDays: parsedDays,
          availability,
          useProviderLocation: locationMode === 'provider',
          ...(locationMode === 'custom' ? customLocationPayload! : {}),
          ...photoPayload,
        });
        alert({
          title: t('services.createdTitle'),
          message: t('services.createdBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
        router.back();
      }
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (isEditing && existing === null) {
    return (
      <PageScaffold
        title={t('services.edit')}
        subtitle={t('services.detailUnavailable')}
        showBack
      >
        <View style={{ padding: PAGE_H_PAD }}>
          <Text style={{ color: colors.muted }}>{t('services.detailUnavailable')}</Text>
        </View>
      </PageScaffold>
    );
  }

  if (isEditing && existing?.service && existing.service.providerId !== user?._id) {
    return (
      <PageScaffold
        title={t('services.edit')}
        subtitle={t('services.detailUnavailable')}
        showBack
      >
        <View style={{ padding: PAGE_H_PAD }}>
          <Text style={{ color: colors.muted }}>{t('services.detailUnavailable')}</Text>
        </View>
      </PageScaffold>
    );
  }

  const nextDisabled =
    (step === 1 && !step1Valid) ||
    (step === 2 && !step2Valid) ||
    (step === 3 && !step3Valid);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={headerTitle}
        subtitle={stepMeta[step].subtitle}
        showBack
        onBack={goBack}
        bottomInset={false}
        contentContainerStyle={{ paddingBottom: Spacing.twelve }}
      >
        <View
          style={{
            paddingHorizontal: PAGE_H_PAD,
            paddingTop: Spacing.four,
            gap: Spacing.one,
          }}
        >
          <AuthStepper step={step} total={TOTAL_STEPS} />

          {error ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.error + '12',
                  borderColor: colors.error + '30',
                },
              ]}
            >
              <WarningCircle size={18} color={colors.error} weight="fill" />
              <Text style={[textStyle('caption'), { color: colors.error, flex: 1 }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <AuthField
                label={t('services.fieldTitle')}
                value={title}
                onChangeText={setTitle}
                placeholder={t('services.titlePlaceholder')}
                leftIcon={<Article size={20} />}
              />

              <AuthField
                label={t('services.fieldDescription')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                placeholder={t('services.descriptionPlaceholder')}
                leftIcon={<TextAlignLeft size={20} />}
                style={{
                  minHeight: 120,
                  textAlignVertical: 'top',
                  ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
                }}
              />

              <CategoryPickerField
                label={t('services.fieldCategory')}
                placeholder={t('services.categoryPlaceholder')}
                sheetTitle={t('services.fieldCategory')}
                value={categoryId}
                onChange={setCategoryId}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
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
                {t('services.fieldPricing')}
              </Text>
              <PillGroup
                options={[
                  { label: t('service.fixedPrice'), value: 'fixed' },
                  { label: t('common.negotiable'), value: 'negotiable' },
                ]}
                value={pricingType}
                onChange={(v) => {
                  setPricingType(v as PricingType);
                  if (v === 'negotiable') setPrice('');
                }}
                style={{ marginBottom: Spacing.three }}
              />

              {pricingType === 'fixed' ? (
                <AuthField
                  label={t('services.fieldPrice')}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="25000"
                  leftIcon={<CurrencyCircleDollar size={20} />}
                />
              ) : null}

              <AuthField
                label={t('services.fieldDeliveryDays')}
                value={deliveryDays}
                onChangeText={setDeliveryDays}
                keyboardType="numeric"
                placeholder="3"
                leftIcon={<CalendarBlank size={20} />}
              />

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
                {t('services.fieldAvailability')}
              </Text>
              <PillGroup
                options={[
                  { label: t('common.available'), value: 'available' },
                  { label: t('common.busy'), value: 'busy' },
                  { label: t('common.unavailable'), value: 'unavailable' },
                ]}
                value={availability}
                onChange={(v) => setAvailability(v as Availability)}
                style={{ marginBottom: Spacing.three }}
              />
            </>
          ) : null}

          {step === 3 ? (
            <ImagePickerField
              label={t('services.fieldPhotos')}
              value={photos}
              onChange={setPhotos}
              maxCount={MAX_PHOTOS}
              mode="both"
              mediaTypes="images"
              style={{ marginBottom: Spacing.four }}
            />
          ) : null}

          {step === 4 ? (
            <>
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
                {t('services.fieldLocation')}
              </Text>
              <PillGroup
                options={[
                  { label: t('services.locationModeProvider'), value: 'provider' },
                  { label: t('services.locationModeCustom'), value: 'custom' },
                ]}
                value={locationMode}
                onChange={handleLocationModeChange}
                style={{ marginBottom: Spacing.three }}
              />

              {locationMode === 'provider' ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.muted,
                    marginBottom: Spacing.three,
                    lineHeight: 18,
                  }}
                >
                  {t('services.useProfileLocationHint')}
                </Text>
              ) : (
                <>
                  <CityChips
                    cities={MVP_CITIES}
                    value={isMvpCity(city) ? city : ''}
                    onChange={handleCityChange}
                  />
                  <AuthField
                    label={t('services.fieldRegion')}
                    value={region}
                    onChangeText={setRegion}
                    placeholder="ndjamena"
                    leftIcon={<MapPin size={20} />}
                    editable={false}
                  />
                  <LocationMapField
                    label={t('services.fieldCoords')}
                    latitude={parsedLat}
                    longitude={parsedLng}
                    onPress={() => setPickerOpen(true)}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.muted,
                      marginBottom: Spacing.three,
                      lineHeight: 16,
                    }}
                  >
                    {t('services.coordsHint')}
                  </Text>
                </>
              )}
            </>
          ) : null}

          {step < TOTAL_STEPS ? (
            <AuthPrimaryButton
              title={t('common.continue')}
              onPress={goNext}
              disabled={nextDisabled}
              icon={<ArrowRight size={18} weight="bold" />}
              tone="orbit"
            />
          ) : (
            <AuthPrimaryButton
              title={t('services.save')}
              onPress={handleSave}
              loading={loading}
              disabled={!canSave}
              tone="orbit"
            />
          )}

          {step > 1 ? (
            <View style={{ marginTop: Spacing.three }}>
              <Pressable
                onPress={goBack}
                style={({ pressed }) => ({
                  minHeight: 44,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.two,
                    paddingVertical: Spacing.three,
                  }}
                >
                  <ArrowLeft size={16} color={colors.muted} weight="bold" />
                  <Text style={[textStyle('button'), { color: colors.muted }]}>
                    {t('common.back')}
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>
      </PageScaffold>

      <LocationPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialLat={parsedLat}
        initialLng={parsedLng}
        onConfirm={handlePickerConfirm}
        orbitColor={colors.orbit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 0.1,
  },
});
