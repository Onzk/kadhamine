import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { ArrowRight, MapPin, PaperPlaneTilt } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Badge } from '@/components/ui/Badge';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { ImageZoomModal } from '@/components/chat/ImageZoomModal';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const PHOTO_GAP = Spacing.two;
/** Miniatures compactes — évite les tuiles trop grandes dans le sheet. */
const PHOTO_THUMB = 72;

function categoryLabel(
  category: { nameFr: string; nameAr?: string; nameSara?: string } | null | undefined,
  lang: string,
) {
  if (!category) return null;
  if (lang === 'ar' && category.nameAr) return category.nameAr;
  if (lang === 'sara' && category.nameSara) return category.nameSara;
  return category.nameFr;
}

export interface ServiceDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  serviceId: Id<'services'> | null;
  onViewFull?: (serviceId: Id<'services'>) => void;
  /** When set, shows a primary “send” action (chat attach confirmation). */
  onSend?: (serviceId: Id<'services'>, title: string) => void;
  sendLoading?: boolean;
  /** Override default subtitle (e.g. chat attach copy). */
  subtitle?: string;
}

/** Bottom sheet — détails du service uniquement (sans métadonnées de commande). */
export function ServiceDetailSheet({
  visible,
  onClose,
  serviceId,
  onViewFull,
  onSend,
  sendLoading = false,
  subtitle,
}: ServiceDetailSheetProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const data = useQuery(
    api.services.getById,
    visible && serviceId ? { serviceId } : 'skip',
  );

  const service = data?.service ?? null;
  const category = data?.category ?? null;
  const photos = service?.photos?.length ? service.photos : [];
  const catLabel = categoryLabel(category, i18n.language);
  const locationLabel = service
    ? [service.city, service.region].filter(Boolean).join(', ')
    : '';

  const availabilityKey = useMemo(() => {
    if (!service) return 'common.available';
    if (
      service.availability === 'available' ||
      service.availability === 'busy' ||
      service.availability === 'unavailable'
    ) {
      return `common.${service.availability}`;
    }
    return 'common.available';
  }, [service]);

  const availabilityVariant =
    service?.availability === 'available'
      ? 'verified'
      : service?.availability === 'busy'
        ? 'accent'
        : 'default';

  return (
    <>
      <AppBottomSheet
        visible={visible && !!serviceId}
        onClose={onClose}
        title={service?.title ?? t('order.serviceDetailsButton')}
        subtitle={
          subtitle ??
          (onSend
            ? t('messages.attachServiceConfirmDesc')
            : t('order.serviceDetailsSubtitle'))
        }
        scrollable
        stickyHeader
        maxHeightRatio={0.88}
      >
        {data === undefined ? (
          <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
            <Text style={[textStyle('body'), { color: colors.muted }]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : data === null || !service ? (
          <Text style={[textStyle('body'), { color: colors.muted }]}>
            {t('order.serviceNotFound')}
          </Text>
        ) : (
          <View style={{ gap: Spacing.five }}>
            {(catLabel || service.availability) && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                {catLabel ? <Badge label={catLabel} variant="taxonomy" /> : null}
                <Badge label={t(availabilityKey)} variant={availabilityVariant} />
              </View>
            )}

            {photos.length > 0 ? (
              <View style={{ gap: Spacing.two }}>
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 14,
                    color: colors.ink,
                  }}
                >
                  {t('order.photosSection')}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: PHOTO_GAP,
                  }}
                >
                  {photos.map((uri) => (
                    <Pressable
                      key={uri}
                      onPress={() => setZoomUri(uri)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={t('order.photosSection')}
                      style={({ pressed }) => [
                        { width: PHOTO_THUMB, height: PHOTO_THUMB },
                        { opacity: pressed ? 0.9 : 1 },
                      ]}
                    >
                      <View
                        style={{
                          width: PHOTO_THUMB,
                          height: PHOTO_THUMB,
                          borderRadius: Radius.md,
                          overflow: 'hidden',
                          borderWidth: BorderWidth.default,
                          borderColor: colors.borderStrong,
                          backgroundColor: colors.surfaceStrong,
                        }}
                      >
                        <Image
                          source={{ uri }}
                          style={{ width: PHOTO_THUMB, height: PHOTO_THUMB }}
                          contentFit="cover"
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={{ gap: Spacing.two }}>
              <Text
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 14,
                  color: colors.ink,
                }}
              >
                {t('service.description')}
              </Text>
              <Text style={[textStyle('body'), { color: colors.body, lineHeight: 24 }]}>
                {service.description?.trim() || t('order.notProvided')}
              </Text>
            </View>

            <View
              style={{
                padding: Spacing.four,
                borderRadius: Radius.lg,
                backgroundColor: colors.surfaceCard,
                borderWidth: BorderWidth.default,
                borderColor: colors.borderStrong,
                gap: Spacing.one,
              }}
            >
              <Text
                style={[
                  textStyle('micro'),
                  {
                    color: colors.muted,
                    letterSpacing: 0.5,
                    fontFamily: fontFamily('body', 'medium'),
                    textTransform: 'uppercase',
                  },
                ]}
              >
                {t('service.pricing')}
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily('display', 'medium'),
                  fontSize: 24,
                  color: colors.orbit,
                }}
              >
                {service.pricingType === 'negotiable'
                  ? t('common.negotiable')
                  : service.price
                    ? formatPrice(service.price, service.currency)
                    : '—'}
              </Text>
              {service.pricingType === 'fixed' && service.price ? (
                <Text style={[textStyle('caption'), { color: colors.muted }]}>
                  {t('service.fixedPrice')}
                </Text>
              ) : null}
            </View>

            {locationLabel ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.two,
                  padding: Spacing.four,
                  borderRadius: Radius.lg,
                  backgroundColor: colors.surfaceStrong,
                  borderWidth: BorderWidth.default,
                  borderColor: colors.borderStrong,
                }}
              >
                <MapPin size={18} color={colors.orbit} weight="fill" />
                <Text style={[textStyle('body'), { color: colors.ink, flex: 1 }]}>
                  {locationLabel}
                </Text>
              </View>
            ) : null}

            {onViewFull && !onSend ? (
              <Pressable
                onPress={() => onViewFull(service._id)}
                style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: Spacing.three,
                    padding: Spacing.four,
                    borderRadius: Radius.lg,
                    backgroundColor: colors.surfaceCard,
                    borderWidth: BorderWidth.default,
                    borderColor: colors.borderStrong,
                  }}
                >
                  <Text
                    style={[
                      textStyle('body'),
                      {
                        color: colors.link,
                        fontFamily: fontFamily('body', 'medium'),
                        flex: 1,
                      },
                    ]}
                  >
                    {t('order.viewFullService')}
                  </Text>
                  <ArrowRight size={18} color={colors.link} weight="bold" />
                </View>
              </Pressable>
            ) : null}

            {onSend ? (
              <SheetActionsFooter>
                <SheetSingleAction>
                  <AuthPrimaryButton
                    title={t('messages.attachServiceSend')}
                    onPress={() => onSend(service._id, service.title)}
                    loading={sendLoading}
                    disabled={sendLoading}
                    tone="orbit"
                    flat
                    icon={<PaperPlaneTilt size={18} weight="fill" />}
                  />
                </SheetSingleAction>
              </SheetActionsFooter>
            ) : null}
          </View>
        )}
      </AppBottomSheet>

      <ImageZoomModal uri={zoomUri} onClose={() => setZoomUri(null)} />
    </>
  );
}
