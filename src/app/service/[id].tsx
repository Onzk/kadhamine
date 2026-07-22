import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { ChatCircleDots } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BrandColors } from '@/theme/tokens';
import { CategoryPlaceholder } from '@/components/ui/CategoryPlaceholder';
import { api } from '../../../convex/_generated/api';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();

  const data = useQuery(api.services.getById, {
    serviceId: id as Id<'services'>,
  });
  const incrementView = useMutation(api.services.incrementView);
  const createOrder = useMutation(api.orders.create);
  const getOrCreateConversation = useMutation(api.messages.getOrCreate);

  useEffect(() => {
    if (id) incrementView({ serviceId: id as Id<'services'> }).catch(() => {});
  }, [id, incrementView]);

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScreenHeader title={t('common.loading')} showBack />
      </View>
    );
  }

  const { service, profile, category, reviews } = data;

  const handleOrder = async () => {
    const orderId = await createOrder({ serviceId: service._id });
    router.push(`/checkout/${orderId}`);
  };

  const handleContact = async () => {
    const conversationId = await getOrCreateConversation({
      participantId: service.providerId,
    });
    router.push(`/chat/${conversationId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title={t('service.details')} showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
          <View
            style={{
              width: 260,
              height: 260,
              borderRadius: 130,
              overflow: 'hidden',
              backgroundColor: colors.surfaceStrong,
            }}
          >
            {service.photos[0] ? (
              <Image
                source={{ uri: service.photos[0] }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CategoryPlaceholder size={64} />
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {category && <Badge label={category.nameFr} />}
            {profile?.isVerified && <Badge label={t('common.verified')} variant="verified" />}
            {profile?.isPremium && <Badge label={t('common.premium')} variant="premium" />}
          </View>

          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>
            {service.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <StarRating rating={service.averageRating} showValue />
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              ({service.reviewCount} {t('service.reviews').toLowerCase()})
            </Text>
          </View>

          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 16 }}>
            {service.pricingType === 'negotiable'
              ? t('common.negotiable')
              : service.price
                ? formatPrice(service.price)
                : '—'}
          </Text>

          <Text style={{ fontSize: 15, color: colors.body, lineHeight: 22, marginBottom: 20 }}>
            {service.description}
          </Text>

          {service.deliveryDays && (
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>
              {t('service.delivery')}: {service.deliveryDays} {t('service.days')}
            </Text>
          )}

          {profile && (
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
                {t('service.provider')}
              </Text>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                {profile.city} · {t('service.trustScore')}: {profile.trustScore}/100
              </Text>
            </View>
          )}

          <View
            style={{
              backgroundColor: BrandColors.crimson + '20',
              borderRadius: 20,
              padding: 14,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: BrandColors.crimson + '60',
            }}
          >
            <Text style={{ fontSize: 13, color: colors.ink, lineHeight: 18 }}>
              {t('payment.integratedBenefit')}
            </Text>
            <Text style={{ fontSize: 12, color: colors.body, marginTop: 6, lineHeight: 17 }}>
              {t('payment.offPlatformWarning')}
            </Text>
          </View>

          {reviews && reviews.length > 0 && (
            <View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 12 }}>
                {t('service.reviews')}
              </Text>
              {reviews.map((review) => (
                <View
                  key={review._id}
                  style={{
                    backgroundColor: colors.surfaceCard,
                    borderRadius: 20,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <StarRating rating={review.rating} size={14} />
                  {review.comment && (
                    <Text style={{ fontSize: 13, color: colors.body, marginTop: 8 }}>
                      {review.comment}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          gap: 12,
          padding: 16,
          paddingBottom: 24,
          backgroundColor: colors.canvas,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Button
          title={t('service.contact')}
          variant="outline"
          onPress={handleContact}
          icon={<ChatCircleDots size={18} color={colors.primary} />}
          style={{ flex: 1 }}
        />
        <Button title={t('service.order')} onPress={handleOrder} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
