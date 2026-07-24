import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
  AppState,
  Share,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  Clock,
  Crown,
  Eye,
  MapPin,
  CheckCircle,
  Package,
  SealCheck,
  ShareNetwork,
  ShieldCheck,
  Star,
  Briefcase,
  CalendarBlank,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { Badge } from '@/components/ui/Badge';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { OwnAccountSheet } from '@/components/ui/OwnAccountSheet';
import { FlutterFab, FLUTTER_FAB } from '@/components/ui/FlutterFab';
import { SheetActionRow, SheetActionSlot } from '@/components/ui/SheetActions';
import { StarRating } from '@/components/ui/StarRating';
import {
  PortfolioDetailSheet,
  type PortfolioDetailItem,
} from '@/components/portfolio/PortfolioDetailSheet';
import { CategoryIcon } from '@/lib/categoryIcons';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice, formatRating } from '@/types';
import { BorderWidth, BrandColors, Radius, Shadows, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_H * 0.42);
const PAGE_PAD = Spacing.six;
const ACTION_BTN_H = 54;
const STICKY_THRESHOLD = Math.round(HERO_H * 0.55);
const NAV_SIZE = 44;
const PHOTO_AUTOPLAY_MS = 3500;
const PHOTO_RESUME_MS = 4000;

function formatDate(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
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
          paddingHorizontal: PAGE_PAD,
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
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Radius.sm,
        backgroundColor: colors.surfaceStrong,
        borderWidth: BorderWidth.default,
        borderColor: colors.border,
      }}
    >
      {icon}
      <Text
        style={[
          textStyle('caption'),
          { color: colors.ink, fontFamily: fontFamily('body', 'medium'), fontSize: 12 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[
        textStyle('micro'),
        {
          color: colors.muted,
          marginBottom: Spacing.three,
          letterSpacing: 0.6,
          fontFamily: fontFamily('body', 'medium'),
          textTransform: 'uppercase',
        },
      ]}
    >
      {children}
    </Text>
  );
}

function TrustInfoBlock({
  icon,
  iconColor,
  washColor,
  title,
  body,
}: {
  icon: React.ReactNode;
  iconColor: string;
  washColor: string;
  title: string;
  body: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.three,
        padding: Spacing.four,
        borderRadius: Radius.md,
        backgroundColor: colors.surfaceCard,
        borderWidth: BorderWidth.default,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: Radius.sm,
          backgroundColor: washColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: BorderWidth.default,
          borderColor: colors.border,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fontFamily('body', 'medium'),
            fontSize: 16,
            lineHeight: 22,
            color: iconColor,
            marginBottom: Spacing.one,
          }}
        >
          {title}
        </Text>
        <Text
          style={[
            textStyle('caption'),
            { color: colors.ink, lineHeight: 22, fontSize: 14 },
          ]}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contactLoading, setContactLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [stickyActive, setStickyActive] = useState(false);
  const [trustSheetOpen, setTrustSheetOpen] = useState(false);
  const [ownAccountSheet, setOwnAccountSheet] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioDetailItem | null>(null);
  const scrollY = useSharedValue(0);
  const photoScrollRef = useRef<ScrollView>(null);
  const photoIndexRef = useRef(0);
  const autoplayPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenFocusedRef = useRef(true);

  const data = useQuery(api.services.getById, {
    serviceId: id as Id<'services'>,
  });
  const portfolio = useQuery(
    api.portfolio.listByProfile,
    data?.profile?._id ? { profileId: data.profile._id } : 'skip',
  );
  const incrementView = useMutation(api.services.incrementView);
  const getOrCreateConversation = useMutation(api.messages.getOrCreate);

  const photoCount = data?.service?.photos?.length ?? 0;

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pauseAutoplay = useCallback(() => {
    autoplayPausedRef.current = true;
    clearResumeTimer();
  }, [clearResumeTimer]);

  const scheduleResumeAutoplay = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      if (screenFocusedRef.current) {
        autoplayPausedRef.current = false;
      }
      resumeTimerRef.current = null;
    }, PHOTO_RESUME_MS);
  }, [clearResumeTimer]);

  useEffect(() => {
    photoIndexRef.current = photoIndex;
  }, [photoIndex]);

  useFocusEffect(
    useCallback(() => {
      screenFocusedRef.current = true;
      autoplayPausedRef.current = false;
      return () => {
        screenFocusedRef.current = false;
        pauseAutoplay();
      };
    }, [pauseAutoplay]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        pauseAutoplay();
      } else if (screenFocusedRef.current) {
        scheduleResumeAutoplay();
      }
    });
    return () => sub.remove();
  }, [pauseAutoplay, scheduleResumeAutoplay]);

  useEffect(() => {
    if (photoCount < 2) return;
    const timer = setInterval(() => {
      if (autoplayPausedRef.current || !screenFocusedRef.current) return;
      const next = (photoIndexRef.current + 1) % photoCount;
      photoScrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
      photoIndexRef.current = next;
      setPhotoIndex(next);
    }, PHOTO_AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [photoCount]);

  useEffect(() => {
    if (id) incrementView({ serviceId: id as Id<'services'> }).catch(() => {});
  }, [id, incrementView]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(setStickyActive)(e.contentOffset.y > STICKY_THRESHOLD - 8);
    },
  });

  const heroChromeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [STICKY_THRESHOLD - 40, STICKY_THRESHOLD + 8],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

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
    if (!data?.service) return;
    try {
      await Share.share({
        message: t('service.shareMessage', { title: data.service.title }),
      });
    } catch {
      // user dismissed
    }
  };

  if (!data) {
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

  const { service, profile, category, reviews } = data;
  const photos = service.photos?.length ? service.photos : [];
  const catLabel = categoryLabel(category, i18n.language);
  const providerInitial = profile ? profile.firstName.charAt(0).toUpperCase() : 'T';
  const trustScore = profile?.trustScore ?? 0;
  const ratingValue = Number(service.averageRating ?? 0);
  const locationLabel = [service.city, service.region].filter(Boolean).join(', ');
  const isVerified = !!profile?.isVerified;
  const isPremium = !!profile?.isPremium;
  const showTrustFab = isVerified || isPremium;
  const availabilityKey =
    service.availability === 'available' ||
    service.availability === 'busy' ||
    service.availability === 'unavailable'
      ? `common.${service.availability}`
      : 'common.available';
  const portfolioItems = (portfolio ?? []).filter((item) => item.mediaUrl).slice(0, 8);

  const trustFabIcon =
    isVerified && isPremium ? (
      <SealCheck size={FLUTTER_FAB.iconSize} color="#FFFFFF" weight="fill" />
    ) : isVerified ? (
      <ShieldCheck size={FLUTTER_FAB.iconSize} color="#FFFFFF" weight="fill" />
    ) : (
      <Crown size={FLUTTER_FAB.iconSize} color="#FFFFFF" weight="fill" />
    );

  const trustFabBottom = footerBlockH + FLUTTER_FAB.edgeMargin;

  const handleOrder = () => {
    if (user?._id && service.providerId === user._id) {
      setOwnAccountSheet(true);
      return;
    }
    if (!user?._id) {
      requireLogin(t('service.order'));
      return;
    }
    router.push(`/order/create?serviceId=${service._id}`);
  };

  const handleContact = async () => {
    if (user?._id && service.providerId === user._id) {
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
        participantId: service.providerId,
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

  const handleWriteReview = () => {
    alert({
      title: t('service.writeReview'),
      message: t('service.writeReviewHint'),
    });
  };

  const syncPhotoIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index !== photoIndexRef.current) {
      photoIndexRef.current = index;
      setPhotoIndex(index);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StickyTopBar
        title={service.title}
        rating={ratingValue}
        isPremium={isPremium}
        isVerified={isVerified}
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
        {/* Hero media */}
        <View style={{ width: '100%', height: HERO_H, backgroundColor: colors.surfaceStrong }}>
          {photos.length > 0 ? (
            <ScrollView
              ref={photoScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={syncPhotoIndex}
              onScrollBeginDrag={pauseAutoplay}
              onMomentumScrollEnd={(e) => {
                syncPhotoIndex(e);
                scheduleResumeAutoplay();
              }}
              scrollEventThrottle={16}
            >
              {photos.map((uri, i) => (
                <Image
                  key={`${uri}-${i}`}
                  source={{ uri }}
                  style={{ width: SCREEN_W, height: HERO_H }}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon
                icon={category?.icon}
                slug={category?.slug}
                label={catLabel ?? undefined}
                size={64}
                color={colors.muted}
              />
            </View>
          )}

          <LinearGradient
            colors={[
              'transparent',
              isDark ? 'rgba(20,20,19,0.5)' : 'rgba(243,240,238,0.35)',
              colors.canvas,
            ]}
            locations={[0.35, 0.75, 1]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: HERO_H * 0.48,
            }}
            pointerEvents="none"
          />

          {/* Floating hero chrome — fades as sticky bar reveals (share only in sticky + footer) */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: Spacing.four,
                left: PAGE_PAD,
                right: PAGE_PAD,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
              heroChromeStyle,
            ]}
            pointerEvents={stickyActive ? 'none' : 'box-none'}
          >
            <Pressable
              onPress={() => router.back()}
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
                  backgroundColor: 'rgba(20,20,19,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...Shadows.nav,
                }}
              >
                <CaretLeft size={22} color="#F3F0EE" weight="bold" />
              </View>
            </Pressable>

            {photos.length > 1 ? (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: Radius.sm,
                  backgroundColor: 'rgba(20,20,19,0.55)',
                }}
              >
                <Text
                  style={[
                    textStyle('micro'),
                    {
                      color: '#F3F0EE',
                      fontFamily: fontFamily('body', 'medium'),
                    },
                  ]}
                >
                  {t('service.photoOf', {
                    current: photoIndex + 1,
                    total: photos.length,
                  })}
                </Text>
              </View>
            ) : (
              <View style={{ width: NAV_SIZE, height: NAV_SIZE }} />
            )}
          </Animated.View>

          {/* Hero badges */}
          <View
            style={{
              position: 'absolute',
              bottom: Spacing.five,
              left: PAGE_PAD,
              right: PAGE_PAD,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacing.two,
            }}
          >
            {catLabel ? <Badge label={catLabel} variant="taxonomy" /> : null}
            <Badge label={t(availabilityKey)} variant="default" />
            {profile?.isVerified ? (
              <Badge label={t('common.verified')} variant="verified" />
            ) : null}
            {profile?.isPremium ? (
              <Badge label={t('common.premium')} variant="premium" />
            ) : null}
          </View>
        </View>

        <View style={{ paddingHorizontal: PAGE_PAD, marginTop: Spacing.two }}>
          {/* Title */}
          <Text
            style={{
              fontFamily: fontFamily('body', 'bold'),
              fontSize: 24,
              lineHeight: 30,
              letterSpacing: -0.4,
              color: colors.ink,
              marginBottom: Spacing.three,
            }}
          >
            {service.title}
          </Text>

          {/* Rating */}
          <View style={{ marginBottom: Spacing.four }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <StarRating rating={ratingValue} size={18} />
              <Text
                style={{
                  fontFamily: fontFamily('body', 'bold'),
                  fontSize: 20,
                  lineHeight: 24,
                  color: colors.ink,
                }}
              >
                {formatRating(ratingValue)}
              </Text>
              <Text style={[textStyle('caption'), { color: colors.muted }]}>
                ({service.reviewCount} {t('service.reviews').toLowerCase()})
              </Text>
            </View>
            <Pressable
              onPress={handleWriteReview}
              hitSlop={8}
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                opacity: pressed ? 0.7 : 1,
                marginTop: Spacing.oneHalf,
              })}
            >
              <View>
                <Text
                  style={[
                    textStyle('caption'),
                    {
                      color: colors.link,
                      fontFamily: fontFamily('body', 'medium'),
                      textDecorationLine: 'underline',
                    },
                  ]}
                >
                  {t('service.writeReview')}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Price */}
          <View style={{ marginBottom: Spacing.five }}>
            <Text
              style={[
                textStyle('micro'),
                {
                  color: colors.muted,
                  letterSpacing: 0.5,
                  marginBottom: Spacing.one,
                  fontFamily: fontFamily('body', 'medium'),
                  textTransform: 'uppercase',
                },
              ]}
            >
              {t('service.pricing')}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily('body', 'bold'),
                fontSize: 28,
                lineHeight: 34,
                letterSpacing: -0.5,
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
              <Text style={[textStyle('caption'), { color: colors.muted, marginTop: 4 }]}>
                {t('service.fixedPrice')}
              </Text>
            ) : null}
          </View>

          {/* Meta chips */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacing.two,
              marginBottom: Spacing.six,
            }}
          >
            {locationLabel ? (
              <MetaChip
                icon={<MapPin size={14} color={colors.ink} weight="bold" />}
                label={locationLabel}
              />
            ) : null}
            {service.deliveryDays ? (
              <MetaChip
                icon={<Clock size={14} color={colors.ink} weight="bold" />}
                label={`${service.deliveryDays} ${t('service.days')}`}
              />
            ) : null}
            <MetaChip
              icon={<Eye size={14} color={colors.ink} weight="bold" />}
              label={t('service.views', { count: service.viewCount })}
            />
            <MetaChip
              icon={<Package size={14} color={colors.ink} weight="bold" />}
              label={t('service.ordersCount', { count: service.orderCount })}
            />
          </View>

          {/* Description */}
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
            <SectionLabel>{t('service.description')}</SectionLabel>
            <Text
              style={[
                textStyle('body'),
                { color: colors.ink, lineHeight: 26, fontSize: 15 },
              ]}
            >
              {service.description}
            </Text>
          </View>

          {/* Provider */}
          {profile ? (
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
              <SectionLabel>{t('service.provider')}</SectionLabel>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/provider/[id]', params: { id: profile._id } })
                }
                style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.92 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={t('provider.viewProfile')}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.three,
                    marginBottom: Spacing.four,
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      overflow: 'hidden',
                      backgroundColor: colors.surfaceStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: BorderWidth.default,
                      borderColor: colors.border,
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
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
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
                      {profile.isPremium ? (
                        <Crown size={16} color={colors.accent} weight="fill" />
                      ) : null}
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      <MapPin size={13} color={colors.muted} />
                      <Text style={[textStyle('caption'), { color: colors.muted }]} numberOfLines={1}>
                        {[profile.city, profile.region].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                    {(profile.averageRating > 0 || profile.reviewCount > 0) && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <Star size={13} color={colors.rating} weight="fill" />
                        <Text style={[textStyle('caption'), { color: colors.muted }]}>
                          {formatRating(profile.averageRating)} · {profile.reviewCount}{' '}
                          {t('service.reviews').toLowerCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        textStyle('micro'),
                        {
                          color: colors.orbit,
                          marginTop: 6,
                          fontFamily: fontFamily('body', 'medium'),
                        },
                      ]}
                    >
                      {t('provider.viewProfile')} →
                    </Text>
                  </View>
                </View>
              </Pressable>

              {profile.bio ? (
                <View style={{ marginBottom: Spacing.four }}>
                  <Text
                    style={[
                      textStyle('caption'),
                      {
                        color: colors.muted,
                        marginBottom: Spacing.one,
                        fontFamily: fontFamily('body', 'medium'),
                      },
                    ]}
                  >
                    {t('service.aboutProvider')}
                  </Text>
                  <Text
                    style={[
                      textStyle('caption'),
                      { color: colors.ink, lineHeight: 22, fontSize: 14 },
                    ]}
                  >
                    {profile.bio}
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: Spacing.two,
                  marginBottom: Spacing.four,
                }}
              >
                {profile.experienceYears != null && profile.experienceYears > 0 ? (
                  <MetaChip
                    icon={<Briefcase size={13} color={colors.ink} weight="bold" />}
                    label={t('service.experienceYears', {
                      count: profile.experienceYears,
                    })}
                  />
                ) : null}
                {profile.completedOrders > 0 ? (
                  <MetaChip
                    icon={<Package size={13} color={colors.ink} weight="bold" />}
                    label={t('service.completedOrders', {
                      count: profile.completedOrders,
                    })}
                  />
                ) : null}
                {profile.responseTimeMinutes != null && profile.responseTimeMinutes > 0 ? (
                  <MetaChip
                    icon={<Clock size={13} color={colors.ink} weight="bold" />}
                    label={t('service.responseTime', {
                      minutes: profile.responseTimeMinutes,
                    })}
                  />
                ) : null}
              </View>

              {profile.skills?.length > 0 ? (
                <View style={{ marginBottom: Spacing.four }}>
                  <Text
                    style={[
                      textStyle('caption'),
                      {
                        color: colors.muted,
                        marginBottom: Spacing.two,
                        fontFamily: fontFamily('body', 'medium'),
                      },
                    ]}
                  >
                    {t('service.skills')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
                    {profile.skills.slice(0, 8).map((skill) => (
                      <Badge key={skill} label={skill} variant="accent" />
                    ))}
                  </View>
                </View>
              ) : null}

              <View>
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

          {/* Portfolio snippets */}
          {portfolioItems.length > 0 ? (
            <View style={{ marginBottom: Spacing.five }}>
              <SectionLabel>{t('service.portfolio')}</SectionLabel>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.two }}
              >
                {portfolioItems.map((item) => (
                  <Pressable
                    key={item._id}
                    onPress={() => setSelectedPortfolio(item)}
                    style={({ pressed }) => [{ width: 140 }, { opacity: pressed ? 0.92 : 1 }]}
                  >
                    <View
                      style={{
                        width: 140,
                        borderRadius: Radius.sm,
                        overflow: 'hidden',
                        backgroundColor: colors.surfaceCard,
                        borderWidth: BorderWidth.default,
                        borderColor: colors.border,
                      }}
                    >
                      <Image
                        source={{ uri: item.thumbnailUrl || item.mediaUrl! }}
                        style={{ width: 140, height: 100 }}
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
              </ScrollView>
            </View>
          ) : null}

          {/* Payment note */}
          <View
            style={{
              backgroundColor: colors.surfaceStrong,
              borderRadius: Radius.md,
              padding: Spacing.five,
              marginBottom: Spacing.five,
              borderWidth: BorderWidth.default,
              borderColor: colors.border,
            }}
          >
            <Text
              style={[
                textStyle('caption'),
                { color: colors.ink, lineHeight: 22, fontSize: 14 },
              ]}
            >
              {t('payment.integratedBenefit')}
            </Text>
            <Text
              style={[
                textStyle('micro'),
                { color: colors.muted, marginTop: 8, lineHeight: 20 },
              ]}
            >
              {t('payment.offPlatformWarning')}
            </Text>
          </View>

          {/* Reviews */}
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
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <View
                  key={review._id}
                  style={{
                    backgroundColor: colors.surfaceCard,
                    borderRadius: Radius.md,
                    padding: Spacing.four,
                    marginBottom: Spacing.two,
                    borderWidth: BorderWidth.default,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: Spacing.two,
                    }}
                  >
                    <StarRating rating={review.rating} size={14} />
                    <Text style={[textStyle('micro'), { color: colors.muted }]}>
                      {formatDate(review.createdAt, i18n.language)}
                    </Text>
                  </View>
                  {review.comment ? (
                    <Text
                      style={[
                        textStyle('caption'),
                        { color: colors.ink, lineHeight: 22 },
                      ]}
                    >
                      {review.comment}
                    </Text>
                  ) : null}
                  {review.providerResponse ? (
                    <View
                      style={{
                        marginTop: Spacing.three,
                        paddingTop: Spacing.three,
                        borderTopWidth: BorderWidth.default,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Text
                        style={[
                          textStyle('micro'),
                          {
                            color: colors.muted,
                            marginBottom: 4,
                            fontFamily: fontFamily('body', 'medium'),
                          },
                        ]}
                      >
                        {t('reviews.respond')}
                      </Text>
                      <Text
                        style={[
                          textStyle('caption'),
                          { color: colors.ink, lineHeight: 20 },
                        ]}
                      >
                        {review.providerResponse}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={[textStyle('caption'), { color: colors.muted }]}>
                {t('service.noReviews')}
              </Text>
            )}
          </View>

          {/* Dates */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacing.three,
              marginBottom: Spacing.two,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CalendarBlank size={14} color={colors.muted} />
              <Text style={[textStyle('micro'), { color: colors.muted }]}>
                {t('service.published', {
                  date: formatDate(service.createdAt, i18n.language),
                })}
              </Text>
            </View>
            {service.updatedAt && service.updatedAt !== service.createdAt ? (
              <Text style={[textStyle('micro'), { color: colors.muted }]}>
                {t('service.updated', {
                  date: formatDate(service.updatedAt, i18n.language),
                })}
              </Text>
            ) : null}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Sticky 50/50 actions + safe area */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          paddingHorizontal: PAGE_PAD,
          paddingTop: Spacing.three,
          paddingBottom: footerPad,
          backgroundColor: colors.canvas,
          borderTopWidth: BorderWidth.default,
          borderTopColor: colors.border,
        }}
      >
        <SheetActionRow>
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel={t('service.share')}
            style={({ pressed }) => ({
              width: ACTION_BTN_H,
              height: ACTION_BTN_H,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: ACTION_BTN_H,
                height: ACTION_BTN_H,
                borderRadius: Radius.lg,
                backgroundColor: colors.success,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShareNetwork size={22} color="#FFFFFF" weight="bold" />
            </View>
          </Pressable>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('service.contact')}
              onPress={handleContact}
              loading={contactLoading}
              tone="orbit"
              flat
              fill
              icon={<ChatCircleDots size={18} weight="fill" />}
            />
          </SheetActionSlot>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('service.order')}
              onPress={handleOrder}
              tone="ink"
              backgroundColor={isDark ? '#FFFFFF' : undefined}
              textColor={isDark ? BrandColors.ink : undefined}
              flat
              fill
            />
          </SheetActionSlot>
        </SheetActionRow>
      </View>

      {showTrustFab ? (
        <FlutterFab
          absolute
          bottom={trustFabBottom}
          right={FLUTTER_FAB.edgeMargin}
          onPressed={() => setTrustSheetOpen(true)}
          icon={trustFabIcon}
          backgroundColor={colors.orbit}
          foregroundColor="#FFFFFF"
          accessibilityLabel={t('service.trustFabLabel')}
        />
      ) : null}

      <AppBottomSheet
        visible={trustSheetOpen}
        onClose={() => setTrustSheetOpen(false)}
        title={t('service.trustSheetTitle')}
        subtitle={t('service.trustSheetSubtitle')}
        maxHeightRatio={0.72}
        scrollable
      >
        <View style={{ gap: Spacing.three, paddingBottom: Spacing.four }}>
          {isVerified ? (
            <TrustInfoBlock
              icon={<ShieldCheck size={22} color={colors.orbit} weight="fill" />}
              iconColor={colors.orbit}
              washColor={colors.orbitWash}
              title={t('service.verifiedTitle')}
              body={t('service.verifiedExplain')}
            />
          ) : null}
          {isPremium ? (
            <TrustInfoBlock
              icon={<Crown size={22} color={colors.accent} weight="fill" />}
              iconColor={colors.accent}
              washColor={isDark ? 'rgba(225,29,72,0.16)' : 'rgba(225,29,72,0.1)'}
              title={t('service.premiumTitle')}
              body={t('service.premiumExplain')}
            />
          ) : null}
        </View>
      </AppBottomSheet>

      <OwnAccountSheet
        visible={ownAccountSheet}
        onClose={() => setOwnAccountSheet(false)}
        message={t('common.ownServiceBody')}
      />

      <PortfolioDetailSheet
        visible={!!selectedPortfolio}
        onClose={() => setSelectedPortfolio(null)}
        item={selectedPortfolio}
        onOpenService={(serviceId) => {
          if (serviceId !== service._id) {
            router.push(`/service/${serviceId}`);
          }
        }}
      />
    </View>
  );
}
