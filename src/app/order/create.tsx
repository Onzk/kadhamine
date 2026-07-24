import React, { useMemo, useState } from 'react';
import { View, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, ArrowRight, MapPin, WarningCircle } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/ThemedText';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import {
  LocationMapField,
  LocationPickerSheet,
} from '@/components/map/LocationPickerSheet';
import {
  VoiceRecorderField,
  type VoiceRecordingValue,
} from '@/components/orders/VoiceRecorderField';
import { ImageZoomModal } from '@/components/chat/ImageZoomModal';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useUpload } from '@/hooks/useUpload';
import { formatPrice } from '@/types';
import { formatLocationLabel } from '@/utils/locationDisplay';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

type Step = 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 5;
const MAX_PHOTOS = 4;
const REVIEW_PHOTO_GAP = Spacing.two;
const REVIEW_PHOTO_COLS = 2;

export default function OrderCreateScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { uploadFromUri } = useUpload();
  const createOrder = useMutation(api.orders.create);

  const [step, setStep] = useState<Step>(1);
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [addressLabel, setAddressLabel] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [locationRegion, setLocationRegion] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [photos, setPhotos] = useState<ImagePickerValueItem[]>([]);
  const [voice, setVoice] = useState<VoiceRecordingValue>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const reviewPhotoSize = Math.max(
    96,
    Math.floor(
      (Math.max(width - PAGE_H_PAD * 2, 1) - REVIEW_PHOTO_GAP * (REVIEW_PHOTO_COLS - 1)) /
        REVIEW_PHOTO_COLS,
    ),
  );

  const data = useQuery(
    api.services.getById,
    serviceId ? { serviceId: serviceId as Id<'services'> } : 'skip',
  );

  const service = data?.service;
  const providerName = data?.profile
    ? `${data.profile.firstName} ${data.profile.lastName}`.trim()
    : data?.provider?.name ?? t('profile.defaultName');

  const titles = useMemo(
    () => ({
      1: t('order.stepSummaryTitle'),
      2: t('order.stepDescriptionTitle'),
      3: t('order.stepLocationTitle'),
      4: t('order.stepMediaTitle'),
      5: t('order.stepReviewTitle'),
    }),
    [t],
  );

  const subtitles = useMemo(
    () => ({
      1: t('order.stepSummarySubtitle'),
      2: t('order.stepDescriptionSubtitle'),
      3: t('order.stepLocationSubtitle'),
      4: t('order.stepMediaSubtitle'),
      5: t('order.stepReviewSubtitle'),
    }),
    [t],
  );

  const goBack = () => {
    setError('');
    if (step === 1) {
      router.back();
      return;
    }
    setStep((s) => (s - 1) as Step);
  };

  const goNext = () => {
    setError('');
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as Step);
  };

  const handleSubmit = async () => {
    if (!serviceId || !service) return;
    setLoading(true);
    setError('');
    try {
      let photoStorageIds = photos
        .map((p) => p.storageId)
        .filter((id): id is Id<'_storage'> => Boolean(id));

      const pendingPhotos = photos.filter((p) => !p.storageId && p.uri);
      if (pendingPhotos.length) {
        const uploaded = await Promise.all(
          pendingPhotos.map((p) => uploadFromUri(p.uri, p.mimeType ?? 'image/jpeg')),
        );
        photoStorageIds = [...photoStorageIds, ...uploaded].slice(0, MAX_PHOTOS);
      }

      let voiceStorageId: Id<'_storage'> | undefined;
      let voiceDurationMs: number | undefined;
      if (voice?.uri) {
        voiceStorageId = await uploadFromUri(voice.uri, voice.mimeType ?? 'audio/m4a');
        voiceDurationMs = voice.durationMs;
      }

      const orderId = await createOrder({
        serviceId: serviceId as Id<'services'>,
        description: description.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        city: locationCity ?? service.city,
        region: locationRegion ?? service.region,
        addressLabel: addressLabel ?? undefined,
        photoStorageIds: photoStorageIds.length ? photoStorageIds : undefined,
        voiceStorageId,
        voiceDurationMs,
      });

      router.replace(`/order/${orderId}`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t('order.submitError');
      setError(message);
      alert({ title: t('common.error'), message });
    } finally {
      setLoading(false);
    }
  };

  if (!serviceId) {
    return (
      <PageScaffold title={t('order.createTitle')} subtitle={t('order.createSubtitle')} showBack>
        <EmptyState
          title={t('order.missingService')}
          description={t('order.missingServiceBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </PageScaffold>
    );
  }

  if (data === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.orbit} />
      </View>
    );
  }

  if (!service) {
    return (
      <PageScaffold title={t('order.createTitle')} subtitle={t('order.createSubtitle')} showBack>
        <EmptyState
          title={t('order.serviceNotFound')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </PageScaffold>
    );
  }

  if (user?._id && service.providerId === user._id) {
    return (
      <PageScaffold title={t('order.createTitle')} subtitle={t('order.createSubtitle')} showBack>
        <EmptyState
          title={t('common.ownAccountTitle')}
          description={t('common.ownServiceBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </PageScaffold>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={titles[step]}
        subtitle={subtitles[step]}
        showBack
        onBack={goBack}
        contentContainerStyle={{ paddingBottom: Spacing.twelve }}
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.five }}>
          {error ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.two,
                padding: Spacing.three,
                borderRadius: Radius.lg,
                backgroundColor: colors.error + '12',
                borderWidth: BorderWidth.default,
                borderColor: colors.error + '30',
              }}
            >
              <WarningCircle size={18} color={colors.error} weight="fill" />
              <Text style={[textStyle('caption'), { color: colors.error, flex: 1 }]}>{error}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.lg,
                borderWidth: BorderWidth.default,
                borderColor: colors.borderStrong,
                overflow: 'hidden',
              }}
            >
              {service.photos?.[0] ? (
                <Image
                  source={{ uri: service.photos[0] }}
                  style={{ width: '100%', aspectRatio: 16 / 9 }}
                  contentFit="cover"
                />
              ) : null}
              <View style={{ padding: Spacing.five, gap: Spacing.two }}>
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 18,
                    color: colors.ink,
                  }}
                >
                  {service.title}
                </Text>
                <Text style={[textStyle('caption'), { color: colors.muted }]} numberOfLines={3}>
                  {service.description}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: Spacing.two,
                  }}
                >
                  <Text style={[textStyle('caption'), { color: colors.muted }]}>{providerName}</Text>
                  <Text
                    style={{
                      fontFamily: fontFamily('body', 'medium'),
                      fontSize: 16,
                      color: colors.ink,
                    }}
                  >
                    {service.pricingType === 'negotiable'
                      ? t('common.negotiable')
                      : service.price != null
                        ? formatPrice(service.price)
                        : '—'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <Input
              label={t('order.descriptionLabel')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('order.descriptionPlaceholder')}
              multiline
              style={{ minHeight: 140 }}
            />
          ) : null}

          {step === 3 ? (
            <View style={{ gap: Spacing.three }}>
              <LocationMapField
                label={t('order.locationLabel')}
                latitude={latitude}
                longitude={longitude}
                addressLabel={addressLabel}
                city={locationCity}
                region={locationRegion}
                onPress={() => setPickerOpen(true)}
              />
              <Text style={[textStyle('micro'), { color: colors.muted }]}>
                {t('order.locationOptional')}
              </Text>
              {latitude != null && longitude != null ? (
                <Pressable
                  onPress={() => {
                    setLatitude(null);
                    setLongitude(null);
                    setAddressLabel(null);
                    setLocationCity(null);
                    setLocationRegion(null);
                  }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, minHeight: 44 })}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two }}>
                    <Text style={[textStyle('button'), { color: colors.muted }]}>
                      {t('order.clearLocation')}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={{ gap: Spacing.five }}>
              <ImagePickerField
                label={t('order.photosLabel')}
                value={photos}
                onChange={setPhotos}
                maxCount={MAX_PHOTOS}
                mode="both"
              />
              <VoiceRecorderField
                label={t('order.voiceLabel')}
                value={voice}
                onChange={setVoice}
              />
            </View>
          ) : null}

          {step === 5 ? (
            <View style={{ gap: Spacing.four }}>
              <ReviewRow label={t('order.reviewService')} value={service.title} />
              <ReviewRow
                label={t('order.reviewDescription')}
                value={description.trim() || t('order.notProvided')}
              />
              <ReviewRow
                label={t('order.reviewLocation')}
                value={
                  latitude != null && longitude != null
                    ? formatLocationLabel(
                        {
                          addressLabel,
                          city: locationCity,
                          region: locationRegion,
                          latitude,
                          longitude,
                        },
                        (lat, lng) => t('services.coordsSummary', { lat, lng }),
                      ) ?? t('order.notProvided')
                    : t('order.notProvided')
                }
                icon
              />
              <ReviewRow
                label={t('order.reviewPhotos')}
                value={
                  photos.length
                    ? t('order.photosCount', { count: photos.length })
                    : t('order.notProvided')
                }
              />
              <ReviewRow
                label={t('order.reviewVoice')}
                value={voice ? t('order.voiceReady') : t('order.notProvided')}
              />
              {photos.length > 0 ? (
                <View
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: REVIEW_PHOTO_GAP,
                  }}
                >
                  {photos.map((p, index) => (
                    <Pressable
                      key={`review-photo-${index}`}
                      onPress={() => setZoomUri(p.uri)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={t('order.photosSection')}
                      style={({ pressed }) => [
                        { width: reviewPhotoSize, height: reviewPhotoSize },
                        { opacity: pressed ? 0.9 : 1 },
                      ]}
                    >
                      <View
                        style={{
                          width: reviewPhotoSize,
                          height: reviewPhotoSize,
                          borderRadius: Radius.lg,
                          overflow: 'hidden',
                          borderWidth: BorderWidth.default,
                          borderColor: colors.borderStrong,
                          backgroundColor: colors.surfaceStrong,
                        }}
                      >
                        <Image
                          source={{ uri: p.uri }}
                          style={{ width: reviewPhotoSize, height: reviewPhotoSize }}
                          contentFit="cover"
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {step < TOTAL_STEPS ? (
            <AuthPrimaryButton
              title={t('common.continue')}
              onPress={goNext}
              tone="orbit"
              icon={<ArrowRight size={18} weight="bold" />}
            />
          ) : (
            <AuthPrimaryButton
              title={t('order.submit')}
              onPress={handleSubmit}
              loading={loading}
              tone="orbit"
            />
          )}

          {step > 1 ? (
            <Pressable
              onPress={goBack}
              style={({ pressed }) => ({ minHeight: 44, opacity: pressed ? 0.7 : 1 })}
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
                <Text style={[textStyle('button'), { color: colors.muted }]}>{t('common.back')}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </PageScaffold>

      <LocationPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        initialAddressLabel={addressLabel}
        onConfirm={(result) => {
          setLatitude(result.lat);
          setLongitude(result.lng);
          setAddressLabel(result.addressLabel ?? null);
          setLocationCity(result.city ?? null);
          setLocationRegion(result.region ?? null);
        }}
        orbitColor={colors.orbit}
        title={t('order.locationPickerTitle')}
        subtitle={t('order.locationPickerSubtitle')}
      />

      <ImageZoomModal uri={zoomUri} onClose={() => setZoomUri(null)} />
    </View>
  );
}

function ReviewRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceCard,
        borderRadius: Radius.lg,
        borderWidth: BorderWidth.default,
        borderColor: colors.borderStrong,
        padding: Spacing.four,
        gap: Spacing.one,
      }}
    >
      <Text style={[textStyle('micro'), { color: colors.muted }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        {icon ? <MapPin size={16} color={colors.orbit} weight="fill" /> : null}
        <Text
          style={{
            fontFamily: fontFamily('body', 'medium'),
            fontSize: 15,
            color: colors.ink,
            flex: 1,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
