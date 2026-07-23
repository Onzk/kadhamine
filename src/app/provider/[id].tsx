import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CaretLeft,
  ChatCircleDots,
  CheckCircle,
  Clock,
  Crown,
  MapPin,
  Package,
  Briefcase,
  Star,
  ShareNetwork,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { Badge } from '@/components/ui/Badge';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { SheetActionRow, SheetActionSlot } from '@/components/ui/SheetActions';
import { StarRating } from '@/components/ui/StarRating';
import { ServiceCard } from '@/components/cards/ServiceCard';
import {
  PortfolioDetailSheet,
  type PortfolioDetailItem,
} from '@/components/portfolio/PortfolioDetailSheet';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatRating } from '@/types';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const ACTION_BTN_H = 54;
const NAV_SIZE = 44;

function categoryLabel(
  category: { nameFr: string; nameAr?: string; nameSara?: string } | null | undefined,
  lang: string,
) {
  if (!category) return null;
  if (lang === 'ar' && category.nameAr) return category.nameAr;
  if (lang === 'sara' && category.nameSara) return category.nameSara;
  return category.nameFr;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={{
        fontFamily: fontFamily('body', 'medium'),
        fontSize: 18,
        color: colors.ink,
        marginBottom: Spacing.three,
      }}
    >
      {children}
    </Text>
  );
}

function MetaChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Radius.pill,
        backgroundColor: colors.surfaceStrong,
        borderWidth: BorderWidth.default,
        borderColor: colors.border,
      }}
    >
      {icon}
      <Text style={[textStyle('caption'), { color: colors.ink, fontSize: 13 }]}>{label}</Text>
    </View>
  );
}

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contactLoading, setContactLoading] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetailItem | null>(null);

  const data = useQuery(
    api.profiles.getPublicProvider,
    id ? { profileId: id as Id<'profiles'> } : 'skip',
  );
  const incrementView = useMutation(api.profiles.incrementView);
  const getOrCreateConversation = useMutation(api.messages.getOrCreate);

  useEffect(() => {
    if (id) incrementView({ profileId: id as Id<'profiles'> }).catch(() => {});
  }, [id, incrementView]);

  const footerPad = Math.max(insets.bottom, Spacing.two) + Spacing.three;
  const footerBlockH = ACTION_BTN_H + Spacing.three + footerPad;
  const scrollBottomPad = footerBlockH + Spacing.six;

  const requireLogin = (actionLabel: string) => {
    confirm({
      title: t('auth.loginRequiredTitle'),
      message: t('auth.loginRequiredBody', { action: actionLabel }),
      confirmLabel: t('auth.signIn'),
      onConfirm: () => router.push('/(auth)/login' as never),
    });
  };

  const handleShare = async () => {
    if (!data?.profile) return;
    const name = `${data.profile.firstName} ${data.profile.lastName}`;
    try {
      await Share.share({
        message: t('provider.shareMessage', { name }),
      });
    } catch {
      // dismissed
    }
  };

  const handleContact = async () => {
    if (!data?.userId) return;
    if (!user?._id) {
      requireLogin(t('service.contact'));
      return;
    }
    setContactLoading(true);
    try {
      const conversationId = await getOrCreateConversation({
        participantId: data.userId,
      });
      router.push(`/chat/${conversationId}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('common.error');
      if (/non authentifié/i.test(message)) {
        requireLogin(t('service.contact'));
      } else {
        alert({ title: t('common.error'), message });
      }
    } finally {
      setContactLoading(false);
    }
  };

  if (data === undefined) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.orbit} />
      </View>
    );
  }

  if (data === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <View
          style={{
            paddingTop: Spacing.five,
            paddingHorizontal: PAGE_H_PAD,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.three,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({
              width: NAV_SIZE,
              height: NAV_SIZE,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: NAV_SIZE,
                height: NAV_SIZE,
                borderRadius: NAV_SIZE / 2,
                backgroundColor: colors.iconWash,
                borderWidth: BorderWidth.default,
                borderColor: colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CaretLeft size={20} color={colors.ink} weight="bold" />
            </View>
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: PAGE_H_PAD }}>
          <Text style={[textStyle('featureHeading'), { color: colors.ink, textAlign: 'center' }]}>
            {t('provider.notFound')}
          </Text>
          <Text
            style={[
              textStyle('body'),
              { color: colors.muted, textAlign: 'center', marginTop: Spacing.two },
            ]}
          >
            {t('provider.notFoundDesc')}
          </Text>
        </View>
      </View>
    );
  }

  const { profile, services, portfolio, reviews } = data;
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initial = profile.firstName.charAt(0).toUpperCase();
  const locationLabel = [profile.city, profile.region].filter(Boolean).join(', ');
  const portfolioItems = portfolio.filter((item) => item.mediaUrl);
  const availabilityKey =
    profile.availability === 'available' ||
    profile.availability === 'busy' ||
    profile.availability === 'unavailable'
      ? `common.${profile.availability}`
      : 'common.available';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
      >
        {/* Top nav */}
        <View
          style={{
            paddingTop: Spacing.three,
            paddingHorizontal: PAGE_H_PAD,
            paddingBottom: Spacing.two,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.two,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={({ pressed }) => ({
              width: NAV_SIZE,
              height: NAV_SIZE,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: NAV_SIZE,
                height: NAV_SIZE,
                borderRadius: NAV_SIZE / 2,
                backgroundColor: colors.iconWash,
                borderWidth: BorderWidth.default,
                borderColor: colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CaretLeft size={20} color={colors.ink} weight="bold" />
            </View>
          </Pressable>
          <Text
            numberOfLines={1}
            style={[
              textStyle('featureHeading'),
              { color: colors.ink, flex: 1, fontSize: 17, lineHeight: 22 },
            ]}
          >
            {t('provider.title')}
          </Text>
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('service.share')}
            style={({ pressed }) => ({
              width: NAV_SIZE,
              height: NAV_SIZE,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: NAV_SIZE,
                height: NAV_SIZE,
                borderRadius: NAV_SIZE / 2,
                backgroundColor: colors.iconWash,
                borderWidth: BorderWidth.default,
                borderColor: colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShareNetwork size={20} color={colors.ink} weight="bold" />
            </View>
          </Pressable>
        </View>

        {/* Hero identity */}
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
          <View style={{ alignItems: 'center', marginBottom: Spacing.five }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                overflow: 'hidden',
                backgroundColor: colors.surfaceStrong,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: profile.isPremium ? 2 : BorderWidth.default,
                borderColor: profile.isPremium ? colors.accent : colors.border,
                marginBottom: Spacing.three,
              }}
            >
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text style={[textStyle('productDisplay'), { color: colors.ink, fontSize: 36 }]}>
                  {initial}
                </Text>
              )}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  textStyle('productDisplay'),
                  { color: colors.ink, fontSize: 26, textAlign: 'center' },
                ]}
              >
                {fullName}
              </Text>
              {profile.isVerified ? (
                <CheckCircle size={22} color={colors.orbit} weight="fill" />
              ) : null}
              {profile.isPremium ? (
                <Crown size={20} color={colors.accent} weight="fill" />
              ) : null}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: Spacing.two,
              }}
            >
              <MapPin size={14} color={colors.muted} />
              <Text style={[textStyle('caption'), { color: colors.muted }]}>{locationLabel}</Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: Spacing.two,
                justifyContent: 'center',
                marginTop: Spacing.three,
              }}
            >
              {profile.isVerified ? (
                <Badge label={t('common.verified')} variant="verified" />
              ) : null}
              {profile.isPremium ? (
                <Badge label={t('common.premium')} variant="premium" />
              ) : null}
              <Badge label={t(availabilityKey)} variant="accent" />
            </View>

            {(profile.averageRating > 0 || profile.reviewCount > 0) && (
              <View style={{ marginTop: Spacing.three, alignItems: 'center', gap: 6 }}>
                <StarRating rating={profile.averageRating} size={18} />
                <Text style={[textStyle('caption'), { color: colors.muted }]}>
                  {formatRating(profile.averageRating)} · {profile.reviewCount}{' '}
                  {t('service.reviews').toLowerCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {profile.bio ? (
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.md,
                padding: Spacing.five,
                marginBottom: Spacing.five,
                borderWidth: BorderWidth.default,
                borderColor: colors.border,
              }}
            >
              <SectionLabel>{t('service.aboutProvider')}</SectionLabel>
              <Text
                style={[
                  textStyle('body'),
                  { color: colors.ink, lineHeight: 26, fontSize: 15 },
                ]}
              >
                {profile.bio}
              </Text>
            </View>
          ) : null}

          {/* Stats chips */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacing.two,
              marginBottom: Spacing.five,
            }}
          >
            {profile.experienceYears != null && profile.experienceYears > 0 ? (
              <MetaChip
                icon={<Briefcase size={13} color={colors.ink} weight="bold" />}
                label={t('service.experienceYears', { count: profile.experienceYears })}
              />
            ) : null}
            {profile.completedOrders > 0 ? (
              <MetaChip
                icon={<Package size={13} color={colors.ink} weight="bold" />}
                label={t('service.completedOrders', { count: profile.completedOrders })}
              />
            ) : null}
            {profile.responseTimeMinutes != null && profile.responseTimeMinutes > 0 ? (
              <MetaChip
                icon={<Clock size={13} color={colors.ink} weight="bold" />}
                label={t('service.responseTime', { minutes: profile.responseTimeMinutes })}
              />
            ) : null}
            <MetaChip
              icon={<Star size={13} color={colors.ink} weight="bold" />}
              label={t('provider.servicesCount', { count: services.length })}
            />
          </View>

          {/* Skills */}
          {profile.skills?.length > 0 ? (
            <View style={{ marginBottom: Spacing.five }}>
              <SectionLabel>{t('service.skills')}</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                {profile.skills.map((skill) => (
                  <Badge key={skill} label={skill} variant="accent" />
                ))}
              </View>
            </View>
          ) : null}

          {/* Trust score */}
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: Radius.md,
              padding: Spacing.five,
              marginBottom: Spacing.five,
              borderWidth: BorderWidth.default,
              borderColor: colors.border,
            }}
          >
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
                {profile.trustScore}/100
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
                  width: `${Math.max(0, Math.min(100, profile.trustScore))}%`,
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: colors.orbit,
                }}
              />
            </View>
          </View>

          {/* Services */}
          <View style={{ marginBottom: Spacing.five }}>
            <SectionLabel>{t('common.services')}</SectionLabel>
            {services.length === 0 ? (
              <Text style={[textStyle('caption'), { color: colors.muted }]}>
                {t('provider.noServices')}
              </Text>
            ) : (
              <View style={{ gap: Spacing.three }}>
                {services.map((service) => {
                  const catLabel = categoryLabel(service.category, i18n.language);
                  return (
                    <ServiceCard
                      key={service._id}
                      layout="list"
                      title={service.title}
                      description={service.description}
                      price={service.price}
                      pricingType={service.pricingType}
                      photo={service.photos?.[0]}
                      rating={service.averageRating}
                      reviewCount={service.reviewCount}
                      providerName={fullName}
                      providerAvatar={profile.avatarUrl}
                      city={service.city}
                      isVerified={profile.isVerified}
                      isPremium={profile.isPremium}
                      categoryIcon={service.category?.icon}
                      categoryLabel={catLabel ?? undefined}
                      onPress={() => router.push(`/service/${service._id}`)}
                      showChevron
                    />
                  );
                })}
              </View>
            )}
          </View>

          {/* Portfolio grid */}
          {portfolioItems.length > 0 ? (
            <View style={{ marginBottom: Spacing.five }}>
              <SectionLabel>{t('service.portfolio')}</SectionLabel>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: Spacing.two,
                }}
              >
                {portfolioItems.map((item) => (
                  <Pressable
                    key={item._id}
                    onPress={() => setSelectedPortfolio(item)}
                    style={({ pressed }) => [
                      { width: '48%', flexGrow: 1 },
                      { opacity: pressed ? 0.92 : 1 },
                    ]}
                  >
                    <View
                      style={{
                        borderRadius: Radius.sm,
                        overflow: 'hidden',
                        backgroundColor: colors.surfaceCard,
                        borderWidth: BorderWidth.default,
                        borderColor: colors.border,
                      }}
                    >
                      <Image
                        source={{ uri: item.thumbnailUrl || item.mediaUrl! }}
                        style={{ width: '100%', aspectRatio: 1 }}
                        contentFit="cover"
                      />
                      <View style={{ padding: Spacing.two }}>
                        <Text
                          style={[
                            textStyle('caption'),
                            {
                              color: colors.ink,
                              fontFamily: fontFamily('body', 'medium'),
                              fontSize: 12,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Reviews */}
          <View style={{ marginBottom: Spacing.four }}>
            <SectionLabel>{t('service.reviews')}</SectionLabel>
            {reviews.length === 0 ? (
              <Text style={[textStyle('caption'), { color: colors.muted }]}>
                {t('service.noReviews')}
              </Text>
            ) : (
              <View style={{ gap: Spacing.three }}>
                {reviews.map((review) => (
                  <View
                    key={review._id}
                    style={{
                      backgroundColor: colors.surfaceCard,
                      borderRadius: Radius.md,
                      padding: Spacing.four,
                      borderWidth: BorderWidth.default,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: Spacing.two,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fontFamily('body', 'medium'),
                          fontSize: 14,
                          color: colors.ink,
                        }}
                      >
                        {review.clientName ?? t('provider.anonymousClient')}
                      </Text>
                      <StarRating rating={review.rating} size={14} />
                    </View>
                    {review.comment ? (
                      <Text
                        style={[
                          textStyle('caption'),
                          { color: colors.ink, lineHeight: 20, fontSize: 14 },
                        ]}
                      >
                        {review.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: PAGE_H_PAD,
          paddingTop: Spacing.three,
          paddingBottom: footerPad,
          backgroundColor: colors.canvas,
          borderTopWidth: BorderWidth.default,
          borderTopColor: colors.border,
        }}
      >
        <SheetActionRow>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('service.contact')}
              onPress={handleContact}
              loading={contactLoading}
              tone="ink"
              flat
              fill
              backgroundColor={isDark ? colors.ink : undefined}
              textColor={isDark ? colors.onPrimary : undefined}
              icon={<ChatCircleDots size={18} weight="fill" />}
            />
          </SheetActionSlot>
          {services[0] ? (
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('provider.seeServices')}
                onPress={() => router.push(`/service/${services[0]!._id}`)}
                tone="orbit"
                flat
                fill
              />
            </SheetActionSlot>
          ) : null}
        </SheetActionRow>
      </View>

      <PortfolioDetailSheet
        visible={!!selectedPortfolio}
        onClose={() => setSelectedPortfolio(null)}
        item={selectedPortfolio}
        onOpenService={(serviceId) => router.push(`/service/${serviceId}`)}
      />
    </View>
  );
}
