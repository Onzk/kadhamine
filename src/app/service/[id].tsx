import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CaretLeft,
  ChatCircleDots,
  Clock,
  SealCheck,
  Crown,
  MapPin,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { CategoryIcon } from '@/lib/categoryIcons';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BrandColors, Radius, Shadows, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const { height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_H * 0.46);
const FOOTER_H = 88;

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const [contactLoading, setContactLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

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
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.orbit} />
      </View>
    );
  }

  const { service, profile, category, reviews } = data;
  const photo = service.photos[0];
  const providerInitial = profile
    ? profile.firstName.charAt(0).toUpperCase()
    : 'T';
  const trustScore = profile?.trustScore ?? 0;

  const handleOrder = async () => {
    setOrderLoading(true);
    try {
      const orderId = await createOrder({ serviceId: service._id });
      router.push(`/checkout/${orderId}`);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleContact = async () => {
    setContactLoading(true);
    try {
      const conversationId = await getOrCreateConversation({
        participantId: service.providerId,
      });
      router.push(`/chat/${conversationId}`);
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: FOOTER_H + Spacing.six }}
      >
        {/* Héros plein largeur */}
        <View style={{ width: '100%', height: HERO_H, backgroundColor: colors.surfaceStrong }}>
          {photo ? (
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon
                icon={category?.icon}
                slug={category?.slug}
                label={category?.nameFr}
                size={64}
                color={colors.muted}
              />
            </View>
          )}

          <LinearGradient
            colors={['transparent', isDark ? 'rgba(20,20,19,0.55)' : 'rgba(243,240,238,0.35)', colors.canvas]}
            locations={[0.35, 0.72, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_H * 0.55 }}
          />

          {/* Retour flottant */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              position: 'absolute',
              top: Spacing.four,
              left: Spacing.four,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(20,20,19,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
              ...Shadows.nav,
            })}
          >
            <CaretLeft size={22} color="#F3F0EE" weight="bold" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.four, marginTop: -Spacing.two }}>
          {/* Badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.four }}>
            {category ? (
              <Badge label={category.nameFr} variant="default" />
            ) : null}
            {profile?.isVerified ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: Radius.pill,
                  borderWidth: 1.5,
                  borderColor: BrandColors.gold,
                  backgroundColor: BrandColors.gold + '22',
                }}
              >
                <SealCheck size={12} color={BrandColors.gold} weight="fill" />
                <Text
                  style={[
                    textStyle('micro'),
                    { fontFamily: fontFamily('body', 'medium'), color: colors.ink },
                  ]}
                >
                  {t('common.verified')}
                </Text>
              </View>
            ) : null}
            {profile?.isPremium ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: Radius.pill,
                  backgroundColor: colors.accent,
                }}
              >
                <Crown size={12} color={colors.onAccent} weight="fill" />
                <Text
                  style={[
                    textStyle('micro'),
                    { fontFamily: fontFamily('body', 'medium'), color: colors.onAccent },
                  ]}
                >
                  {t('common.premium')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Titre */}
          <Text
            style={{
              fontFamily: fontFamily('body', 'medium'),
              fontSize: 26,
              lineHeight: 32,
              letterSpacing: -0.5,
              color: colors.ink,
              marginBottom: Spacing.three,
            }}
          >
            {service.title}
          </Text>

          {/* Note */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.four }}>
            <StarRating rating={service.averageRating} showValue />
            <Text style={[textStyle('caption'), { color: colors.muted }]}>
              ({service.reviewCount} {t('service.reviews').toLowerCase()})
            </Text>
          </View>

          {/* Prix */}
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: colors.orbit + '18',
              borderRadius: Radius.pill,
              paddingHorizontal: Spacing.four,
              paddingVertical: Spacing.two,
              marginBottom: Spacing.five,
              borderWidth: 1,
              borderColor: colors.orbit + '40',
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 18,
                color: colors.orbit,
              }}
            >
              {service.pricingType === 'negotiable'
                ? t('common.negotiable')
                : service.price
                  ? formatPrice(service.price)
                  : '—'}
            </Text>
          </View>

          {/* Description */}
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 16,
              padding: Spacing.four,
              marginBottom: Spacing.four,
              ...Shadows.nav,
            }}
          >
            <Text style={[textStyle('body'), { color: colors.body, lineHeight: 24 }]}>
              {service.description}
            </Text>
          </View>

          {/* Délai */}
          {service.deliveryDays ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.two,
                marginBottom: Spacing.five,
              }}
            >
              <Clock size={16} color={colors.muted} />
              <Text style={[textStyle('caption'), { color: colors.muted }]}>
                {t('service.delivery')} · {service.deliveryDays} {t('service.days')}
              </Text>
            </View>
          ) : null}

          {/* Card prestataire */}
          {profile ? (
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 16,
                padding: Spacing.four,
                marginBottom: Spacing.five,
                ...Shadows.nav,
              }}
            >
              <Text style={[textStyle('micro'), { color: colors.muted, marginBottom: Spacing.three }]}>
                {t('service.provider').toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    overflow: 'hidden',
                    backgroundColor: colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {profile.avatarUrl ? (
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={[textStyle('featureHeading'), { color: colors.onPrimary }]}>
                      {providerInitial}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 17,
                        color: colors.ink,
                      }}
                    >
                      {profile.firstName} {profile.lastName}
                    </Text>
                    {profile.isVerified ? (
                      <SealCheck size={16} color={BrandColors.gold} weight="fill" />
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={12} color={colors.muted} />
                    <Text style={[textStyle('caption'), { color: colors.muted }]}>{profile.city}</Text>
                  </View>
                </View>
              </View>

              {/* Score de confiance — barre */}
              <View style={{ marginTop: Spacing.four }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: Spacing.two,
                  }}
                >
                  <Text style={[textStyle('caption'), { color: colors.muted }]}>
                    {t('service.trustScore')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamily('body', 'medium'),
                      fontSize: 13,
                      color: colors.ink,
                    }}
                  >
                    {trustScore}/100
                  </Text>
                </View>
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.surfaceStrong,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.max(0, Math.min(100, trustScore))}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: colors.orbit,
                    }}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* Info paiement */}
          <View
            style={{
              backgroundColor: colors.surfaceStrong,
              borderRadius: 16,
              padding: Spacing.four,
              marginBottom: Spacing.five,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={[textStyle('caption'), { color: colors.ink, lineHeight: 20 }]}>
              {t('payment.integratedBenefit')}
            </Text>
            <Text style={[textStyle('micro'), { color: colors.muted, marginTop: 6, lineHeight: 18 }]}>
              {t('payment.offPlatformWarning')}
            </Text>
          </View>

          {/* Avis */}
          {reviews && reviews.length > 0 ? (
            <View style={{ marginBottom: Spacing.four }}>
              <Text
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 18,
                  color: colors.ink,
                  marginBottom: Spacing.three,
                }}
              >
                {t('service.reviews')}
              </Text>
              {reviews.map((review) => (
                <View
                  key={review._id}
                  style={{
                    backgroundColor: colors.surfaceCard,
                    borderRadius: 16,
                    padding: Spacing.four,
                    marginBottom: Spacing.two,
                    ...Shadows.nav,
                  }}
                >
                  <StarRating rating={review.rating} size={14} />
                  {review.comment ? (
                    <Text style={[textStyle('caption'), { color: colors.body, marginTop: Spacing.two }]}>
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky footer — Contacter principal */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.three,
          paddingBottom: Spacing.four,
          backgroundColor: colors.canvas,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          gap: Spacing.three,
        }}
      >
        <Pressable
          onPress={handleContact}
          disabled={contactLoading}
          style={({ pressed }) => ({
            flex: 1.4,
            height: 52,
            borderRadius: Radius.button,
            backgroundColor: colors.orbit,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: contactLoading || pressed ? 0.88 : 1,
            ...Shadows.elevated,
          })}
        >
          {contactLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <ChatCircleDots size={20} color={colors.onPrimary} weight="fill" />
              <Text style={[textStyle('button'), { color: colors.onPrimary }]}>
                {t('service.contact')}
              </Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={handleOrder}
          disabled={orderLoading}
          style={({ pressed }) => ({
            flex: 1,
            height: 52,
            borderRadius: Radius.button,
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: orderLoading || pressed ? 0.88 : 1,
          })}
        >
          {orderLoading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[textStyle('button'), { color: colors.onPrimary }]}>
              {t('service.order')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
