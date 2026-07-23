import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
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
  Crown,
  MapPin,
  CheckCircle,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { StarRating } from '@/components/ui/StarRating';
import { CategoryIcon } from '@/lib/categoryIcons';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const { height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_H * 0.46);
const FOOTER_H = 88;
const PAGE_PAD = Spacing.six;

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuth();
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

  const requireLogin = (actionLabel: string) => {
    Alert.alert(t('auth.loginRequiredTitle'), t('auth.loginRequiredBody', { action: actionLabel }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signIn'),
        onPress: () => router.push('/(auth)/login' as never),
      },
    ]);
  };

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
  const ratingValue = Number(service.averageRating ?? 0);

  const handleOrder = async () => {
    if (!user?._id) {
      requireLogin(t('service.order'));
      return;
    }
    setOrderLoading(true);
    try {
      const orderId = await createOrder({ serviceId: service._id });
      router.push(`/checkout/${orderId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('common.error');
      if (/non authentifié/i.test(message)) {
        requireLogin(t('service.order'));
      } else {
        Alert.alert(t('common.error'), message);
      }
    } finally {
      setOrderLoading(false);
    }
  };

  const handleContact = async () => {
    if (!user?._id) {
      requireLogin(t('service.contact'));
      return;
    }
    setContactLoading(true);
    try {
      const conversationId = await getOrCreateConversation({
        participantId: service.providerId,
      });
      router.push(`/chat/${conversationId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('common.error');
      if (/non authentifié/i.test(message)) {
        requireLogin(t('service.contact'));
      } else {
        Alert.alert(t('common.error'), message);
      }
    } finally {
      setContactLoading(false);
    }
  };

  const handleWriteReview = () => {
    Alert.alert(t('service.writeReview'), t('service.writeReviewHint'));
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
            colors={['transparent', isDark ? 'rgba(20,20,19,0.45)' : 'rgba(243,240,238,0.28)', colors.canvas]}
            locations={[0.4, 0.78, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_H * 0.5 }}
          />

          {/* Retour flottant */}
          <View style={{ position: 'absolute', top: Spacing.four, left: PAGE_PAD }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(20,20,19,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...Shadows.nav,
                }}
              >
                <CaretLeft size={22} color="#F3F0EE" weight="bold" />
              </View>
            </Pressable>
          </View>

          {/* Tags haut-droite — catégorie + vérifié */}
          <View
            style={{
              position: 'absolute',
              top: Spacing.four,
              right: PAGE_PAD,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: Spacing.two,
              maxWidth: '58%',
            }}
          >
            {category ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: Radius.md,
                  backgroundColor: isDark ? 'rgba(38,38,39,0.92)' : 'rgba(55,55,52,0.88)',
                }}
              >
                <Text
                  style={[
                    textStyle('micro'),
                    {
                      fontFamily: fontFamily('body', 'medium'),
                      color: '#F3F0EE',
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {category.nameFr}
                </Text>
              </View>
            ) : null}
            {profile?.isVerified ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: Radius.md,
                  backgroundColor: colors.orbit + (isDark ? 'DD' : 'E8'),
                }}
              >
                <CheckCircle size={12} color={colors.onOrbit} weight="fill" />
                <Text
                  style={[
                    textStyle('micro'),
                    {
                      fontFamily: fontFamily('body', 'medium'),
                      color: colors.onOrbit,
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                    },
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
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: Radius.md,
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
        </View>

        <View style={{ paddingHorizontal: PAGE_PAD, marginTop: Spacing.two }}>
          {/* Titre — charcoal bold, légèrement plus compact */}
          <Text
            style={{
              fontFamily: fontFamily('body', 'bold'),
              fontSize: 22,
              lineHeight: 28,
              letterSpacing: -0.35,
              color: colors.ink,
              marginBottom: Spacing.three,
            }}
          >
            {service.title}
          </Text>

          {/* Note — étoiles or, note grande, avis + lien */}
          <View style={{ marginBottom: Spacing.five }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <StarRating rating={ratingValue} size={18} />
              <Text
                style={{
                  fontFamily: fontFamily('body', 'bold'),
                  fontSize: 20,
                  lineHeight: 24,
                  color: colors.ink,
                  marginLeft: 2,
                }}
              >
                {ratingValue.toFixed(1)}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: Spacing.two,
                marginTop: Spacing.oneHalf,
              }}
            >
              <Text style={[textStyle('caption'), { color: colors.muted, fontSize: 13 }]}>
                ({service.reviewCount} {t('service.reviews').toLowerCase()})
              </Text>
              <Pressable
                onPress={handleWriteReview}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text
                  style={[
                    textStyle('caption'),
                    {
                      color: colors.link,
                      fontFamily: fontFamily('body', 'medium'),
                      fontSize: 13,
                      textDecorationLine: 'underline',
                    },
                  ]}
                >
                  {t('service.writeReview')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Prix — sans pill, grand bleu royal */}
          <Text
            style={{
              fontFamily: fontFamily('body', 'bold'),
              fontSize: 26,
              lineHeight: 32,
              letterSpacing: -0.4,
              color: colors.orbit,
              marginBottom: Spacing.five,
            }}
          >
            {service.pricingType === 'negotiable'
              ? t('common.negotiable')
              : service.price
                ? formatPrice(service.price)
                : '—'}
          </Text>

          {/* Description — leading augmenté, texte plus sombre */}
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 16,
              padding: Spacing.five,
              marginBottom: Spacing.five,
              borderWidth: 0.1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={[
                textStyle('body'),
                {
                  color: colors.ink,
                  lineHeight: 28,
                  fontSize: 15,
                },
              ]}
            >
              {service.description}
            </Text>
          </View>

          {/* Délai — icône +150%, texte plus fort */}
          {service.deliveryDays ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                marginBottom: Spacing.six,
              }}
            >
              <Clock size={24} color={colors.ink} weight="bold" />
              <Text
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.ink,
                }}
              >
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
                padding: Spacing.five,
                marginBottom: Spacing.five,
                borderWidth: 0.1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={[
                  textStyle('micro'),
                  {
                    color: colors.muted,
                    marginBottom: Spacing.four,
                    letterSpacing: 0.6,
                    fontFamily: fontFamily('body', 'medium'),
                  },
                ]}
              >
                {t('service.provider').toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    overflow: 'hidden',
                    backgroundColor: colors.surfaceStrong,
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
                    <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>
                      {providerInitial}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 17,
                        color: colors.ink,
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                    >
                      {profile.firstName} {profile.lastName}
                    </Text>
                    {profile.isVerified ? (
                      <CheckCircle size={18} color={colors.orbit} weight="fill" />
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <MapPin size={13} color={colors.muted} />
                    <Text style={[textStyle('caption'), { color: colors.muted }]}>{profile.city}</Text>
                  </View>
                </View>

                {/* Contacter intégré — sans coupure */}
                <Pressable
                  onPress={handleContact}
                  disabled={contactLoading}
                  accessibilityRole="button"
                  accessibilityLabel={t('service.contact')}
                  style={({ pressed }) => ({
                    flexShrink: 0,
                    opacity: contactLoading || pressed ? 0.88 : 1,
                  })}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: Spacing.three,
                      paddingVertical: Spacing.two,
                      borderRadius: Radius.button,
                      backgroundColor: colors.orbit,
                      minHeight: 40,
                    }}
                  >
                    {contactLoading ? (
                      <ActivityIndicator color={colors.onOrbit} size="small" />
                    ) : (
                      <>
                        <ChatCircleDots size={16} color={colors.onOrbit} weight="fill" />
                        <Text
                          style={[
                            textStyle('caption'),
                            {
                              fontFamily: fontFamily('body', 'medium'),
                              color: colors.onOrbit,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {t('service.contact')}
                        </Text>
                      </>
                    )}
                  </View>
                </Pressable>
              </View>

              {/* Score de confiance */}
              <View style={{ marginTop: Spacing.five }}>
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
              padding: Spacing.five,
              marginBottom: Spacing.five,
              borderWidth: 0.1,
              borderColor: colors.border,
            }}
          >
            <Text style={[textStyle('caption'), { color: colors.ink, lineHeight: 22, fontSize: 14 }]}>
              {t('payment.integratedBenefit')}
            </Text>
            <Text style={[textStyle('micro'), { color: colors.muted, marginTop: 8, lineHeight: 20 }]}>
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
                    borderWidth: 0.1,
                    borderColor: colors.border,
                  }}
                >
                  <StarRating rating={review.rating} size={14} />
                  {review.comment ? (
                    <Text
                      style={[
                        textStyle('caption'),
                        { color: colors.ink, marginTop: Spacing.two, lineHeight: 22 },
                      ]}
                    >
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: PAGE_PAD,
          paddingTop: Spacing.three,
          paddingBottom: Spacing.four,
          backgroundColor: colors.canvas,
          borderTopWidth: 0.1,
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
            opacity: contactLoading || pressed ? 0.88 : 1,
          })}
        >
          <View
            style={{
              height: 52,
              borderRadius: Radius.button,
              backgroundColor: colors.orbit,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingHorizontal: Spacing.three,
              ...Shadows.elevated,
            }}
          >
            {contactLoading ? (
              <ActivityIndicator color={colors.onOrbit} />
            ) : (
              <>
                <ChatCircleDots size={20} color={colors.onOrbit} weight="fill" />
                <Text style={[textStyle('button'), { color: colors.onOrbit }]} numberOfLines={1}>
                  {t('service.contact')}
                </Text>
              </>
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={handleOrder}
          disabled={orderLoading}
          style={({ pressed }) => ({
            flex: 1,
            height: 52,
            opacity: orderLoading || pressed ? 0.88 : 1,
          })}
        >
          <View
            style={{
              height: 52,
              borderRadius: Radius.button,
              backgroundColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: Spacing.three,
            }}
          >
            {orderLoading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[textStyle('button'), { color: colors.onPrimary }]} numberOfLines={1}>
                {t('service.order')}
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
