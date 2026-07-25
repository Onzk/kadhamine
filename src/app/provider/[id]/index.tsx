import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import {
  CaretLeft,
  ChatCircleDots,
  CheckCircle,
  Clock,
  Crown,
  MapPin,
  Package,
  Briefcase,
  CurrencyCircleDollar,
  Star,
  ShareNetwork,
  Wrench,
} from 'phosphor-react-native';
import type { Id } from '../../../../convex/_generated/dataModel';

import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/types';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { SheetActionRow, SheetActionSlot } from '@/components/ui/SheetActions';
import { StarRating } from '@/components/ui/StarRating';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import {
  PortfolioDetailSheet,
  type PortfolioDetailItem,
} from '@/components/portfolio/PortfolioDetailSheet';
import { OwnAccountSheet } from '@/components/ui/OwnAccountSheet';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { buildProviderShare, shareContent } from '@/lib/shareContent';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatRating } from '@/types';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

const ACTION_BTN_H = 54;
const NAV_SIZE = 44;
/** Apparition du topbar après le hero identité (avatar + nom). */
const STICKY_THRESHOLD = 168;

interface StickyTopBarProps {
  title: string;
  rating: number;
  isPremium: boolean;
  isVerified: boolean;
  premiumLabel: string;
  verifiedLabel: string;
  progress: SharedValue<number>;
  active: boolean;
  onBack: () => void;
  onShare: () => void;
  shareLabel: string;
}

function StickyTopBar({
  title,
  rating,
  isPremium,
  isVerified,
  premiumLabel,
  verifiedLabel,
  progress,
  active,
  onBack,
  onShare,
  shareLabel,
}: StickyTopBarProps) {
  const { colors } = useAppTheme();

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [STICKY_THRESHOLD - 28, STICKY_THRESHOLD + 16],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [STICKY_THRESHOLD - 28, STICKY_THRESHOLD + 16],
          [-10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={active ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          backgroundColor: colors.canvas,
          borderBottomWidth: BorderWidth.default,
          borderBottomColor: colors.border,
          paddingTop: Spacing.two,
          paddingHorizontal: PAGE_H_PAD,
          paddingBottom: Spacing.two,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.two,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Retour"
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

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          numberOfLines={1}
          style={[
            textStyle('featureHeading'),
            { color: colors.ink, fontSize: 16, lineHeight: 20 },
          ]}
        >
          {title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: Spacing.oneHalf,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Star size={12} color={colors.rating} weight="fill" />
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 12,
                lineHeight: 14,
                color: colors.ink,
              }}
            >
              {formatRating(rating)}
            </Text>
          </View>
          {isPremium ? <Badge label={premiumLabel} variant="premium" /> : null}
          {isVerified ? <Badge label={verifiedLabel} variant="verified" /> : null}
        </View>
      </View>

      <Pressable
        onPress={onShare}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={shareLabel}
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
          <ShareNetwork size={18} color={colors.ink} weight="bold" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

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
  const rawId = useLocalSearchParams<{ id?: string | string[] }>().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contactLoading, setContactLoading] = useState(false);
  const [ownAccountSheet, setOwnAccountSheet] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetailItem | null>(null);
  const [stickyActive, setStickyActive] = useState(false);
  const scrollY = useSharedValue(0);
  const stickyGate = useSharedValue(0);

  const profileId =
    typeof id === 'string' && id.length > 0 ? (id as Id<'profiles'>) : null;

  const data = useQuery(
    api.profiles.getPublicProvider,
    profileId ? { profileId } : 'skip',
  );
  const incrementView = useMutation(api.profiles.incrementView);
  const getOrCreateConversation = useMutation(api.messages.getOrCreate);

  useEffect(() => {
    if (!profileId) return;
    incrementView({ profileId }).catch(() => {});
  }, [profileId, incrementView]);

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
    const { profile, services } = data;
    const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    try {
      await shareContent(
        buildProviderShare(
          {
            profileId: profile._id,
            name,
            bio: profile.bio,
            city: profile.city,
            region: profile.region,
            averageRating: profile.averageRating ?? 0,
            reviewCount: profile.reviewCount ?? 0,
            completedOrders: profile.completedOrders ?? 0,
            servicesCount: services?.length ?? 0,
            skills: profile.skills ?? [],
            isVerified: !!profile.isVerified,
            isPremium: !!profile.isPremium,
          },
          t,
        ),
      );
    } catch {
      // dismissed
    }
  };

  const handleContact = async () => {
    if (!data?.userId) return;
    if (user?._id && data.userId === user._id) {
      setOwnAccountSheet(true);
      return;
    }
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

  const handleOpenServices = () => {
    if (!profileId) return;
    router.push(`/provider/${profileId}/services`);
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      'worklet';
      scrollY.value = e.contentOffset.y;
      const next = e.contentOffset.y > STICKY_THRESHOLD - 8 ? 1 : 0;
      if (stickyGate.value !== next) {
        stickyGate.value = next;
        runOnJS(setStickyActive)(next === 1);
      }
    },
  });

  const heroNavStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [STICKY_THRESHOLD - 40, STICKY_THRESHOLD + 8],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  if (!profileId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: PAGE_H_PAD }}>
        <Text style={[textStyle('featureHeading'), { color: colors.ink, textAlign: 'center' }]}>
          {t('provider.notFound')}
        </Text>
      </View>
    );
  }

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

  const { profile, services = [], portfolio = [], reviews = [] } = data;
  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || t('provider.title');
  const initial = (profile.firstName || fullName || '?').charAt(0).toUpperCase();
  const locationLabel = [profile.city, profile.region].filter(Boolean).join(', ');
  const portfolioItems = (portfolio ?? []).filter((item) => item.mediaUrl);
  const availabilityKey =
    profile.availability === 'available' ||
    profile.availability === 'busy' ||
    profile.availability === 'unavailable'
      ? `common.${profile.availability}`
      : 'common.available';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StickyTopBar
        title={fullName}
        rating={profile.averageRating ?? 0}
        isPremium={!!profile.isPremium}
        isVerified={!!profile.isVerified}
        premiumLabel={t('common.premium')}
        verifiedLabel={t('common.verified')}
        progress={scrollY}
        active={stickyActive}
        onBack={() => router.back()}
        onShare={handleShare}
        shareLabel={t('service.share')}
      />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
      >
        {/* Top nav — fades as sticky bar appears */}
        <Animated.View
          style={[
            {
              paddingTop: Spacing.three,
              paddingHorizontal: PAGE_H_PAD,
              paddingBottom: Spacing.two,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
            },
            heroNavStyle,
          ]}
          pointerEvents={stickyActive ? 'none' : 'auto'}
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
        </Animated.View>

        {data.isPendingPreview ? (
          <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.two }}>
            <View
              style={{
                backgroundColor: colors.warning + '15',
                borderRadius: Radius.lg,
                borderWidth: BorderWidth.default,
                borderColor: colors.warning + '40',
                padding: Spacing.four,
              }}
            >
              <Text style={[textStyle('caption'), { color: colors.ink }]}>
                {t('provider.pendingPreview')}
              </Text>
            </View>
          </View>
        ) : null}

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

            {(profile.averageRating ?? 0) > 0 || (profile.reviewCount ?? 0) > 0 ? (
              <View style={{ marginTop: Spacing.three, alignItems: 'center', gap: 6 }}>
                <StarRating rating={profile.averageRating ?? 0} size={18} />
                <Text style={[textStyle('caption'), { color: colors.muted }]}>
                  {formatRating(profile.averageRating ?? 0)} · {profile.reviewCount ?? 0}{' '}
                  {t('service.reviews').toLowerCase()}
                </Text>
              </View>
            ) : null}
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
            {profile.hourlyRate != null && profile.hourlyRate > 0 ? (
              <MetaChip
                icon={<CurrencyCircleDollar size={13} color={colors.ink} weight="bold" />}
                label={t('service.hourlyRate', { price: formatPrice(profile.hourlyRate) })}
              />
            ) : null}
            {profile.completedOrders != null && profile.completedOrders > 0 ? (
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
          {profile.skills && profile.skills.length > 0 ? (
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
                {profile.trustScore ?? 0}/100
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
                  width: `${Math.max(0, Math.min(100, profile.trustScore ?? 0))}%`,
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
                  <View key={item._id} style={{ width: '48%', flexGrow: 1 }}>
                    <PortfolioCard
                      item={item}
                      compact
                      onPress={() => setSelectedPortfolio(item)}
                    />
                  </View>
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
      </Animated.ScrollView>

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
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('common.services')}
              onPress={handleOpenServices}
              tone="orbit"
              flat
              fill
              icon={<Wrench size={18} weight="fill" />}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </View>

      <OwnAccountSheet
        visible={ownAccountSheet}
        onClose={() => setOwnAccountSheet(false)}
        message={t('common.ownAccountBody')}
      />

      <PortfolioDetailSheet
        visible={!!selectedPortfolio}
        onClose={() => setSelectedPortfolio(null)}
        item={selectedPortfolio}
        onOpenService={(serviceId) => router.push(`/service/${serviceId}`)}
      />
    </View>
  );
}
