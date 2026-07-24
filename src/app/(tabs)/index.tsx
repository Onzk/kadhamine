import React, { useCallback, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import {
  Bell,
  Moon,
  Sun,
  MapPin,
  Storefront,
  Crown,
  CreditCard,
} from 'phosphor-react-native';

import { ServiceCarousel } from '@/components/cards/ServiceCarousel';
import { ProviderPodium } from '@/components/cards/ProviderPodium';
import { Logo } from '@/components/brand/Logo';
import { CategoryHorizontalMasonry } from '@/components/ui/CategoryHorizontalMasonry';
import { PromoSearchHero, type PromoSlideData } from '@/components/ui/PromoCarousel';
import { PremiumRingFrame } from '@/components/ui/PremiumRingFrame';
import { TrustStrip } from '@/components/ui/TrustStrip';
import { Text } from '@/components/ui/ThemedText';
import { getWelcomeAlertOptions } from '@/lib/welcomeAlert';
import { useAuth } from '@/providers/AuthProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { consumePendingWelcome } from '@/services/pendingWelcome';
import { Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

/** Espacement vertical unique entre les grandes sections. */
const SECTION_GAP = Spacing.eight;

/**
 * Slides du carrousel promo (conservés).
 * Accueil : seul le dernier est affiché via `PromoSearchHero`.
 * Pour réactiver le carrousel : `import { PromoCarousel }` + `<PromoCarousel slides={promoSlides} />`.
 */
function useHomePromoSlides(): PromoSlideData[] {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();

  return [
    {
      id: 'premium',
      eyebrow: t('common.premium'),
      title: 'Gagnez en visibilité',
      description: 'Badge Premium, priorité dans les recherches et profil mis en avant.',
      icon: Crown,
      variant: 'dark',
      ctaLabel: 'Découvrir',
      onPress: () => router.push('/premium'),
    },
    {
      id: 'payment',
      eyebrow: 'Paiement sécurisé',
      title: 'Payez en toute confiance',
      description: 'Règlement en ligne pour débloquer les avis officiels et sécuriser la prestation.',
      icon: CreditCard,
      variant: 'light',
    },
    {
      id: 'nearby',
      eyebrow: t('home.nearYou'),
      title: 'Talents près de chez vous',
      description: 'Repérez les prestataires disponibles autour de vous, en direct sur la carte.',
      icon: MapPin,
      variant: 'warm',
      gradient: [...colors.orbitGradient],
      onPress: () => router.push('/map' as never),
    },
  ];
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, toggle, isDark } = useAppTheme();
  const { user } = useAuth();
  const { alert } = useAppDialog();
  const router = useRouter();

  const categories = useQuery(api.categories.listWithCounts, { activeOnly: true });
  const featured = useQuery(api.services.getFeatured, { limit: 10 });
  const topRated = useQuery(api.services.list, { sortBy: 'rating', limit: 10 });
  const homeProviders = useQuery(api.profiles.listHome, { limit: 6 });
  const unreadNotifications = useQuery(
    api.notifications.unreadCount,
    user?._id ? {} : 'skip',
  );
  const seedCategories = useMutation(api.seed.seedCategories);
  const seedSettings = useMutation(api.seed.seedSettings);

  useEffect(() => {
    seedCategories({}).catch(() => {});
    seedSettings({}).catch(() => {});
  }, [seedCategories, seedSettings]);

  useFocusEffect(
    useCallback(() => {
      // Attendre le user pour adapter le message au type de compte.
      if (user === undefined) return;

      let cancelled = false;
      const timer = setTimeout(() => {
        void (async () => {
          const kind = await consumePendingWelcome();
          if (cancelled || !kind) return;
          const role =
            user?.role === 'provider' || user?.role === 'client' ? user.role : null;
          alert(getWelcomeAlertOptions(kind, t, colors.orbit, role));
        })();
      }, 350);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [alert, colors.orbit, t, user]),
  );

  const isGuest = !user;
  const firstName = user?.profile?.firstName ?? '';
  const avatarUrl = user?.profile?.avatarUrl;
  const isPremium = !!user?.profile?.isPremium;
  const initial = (firstName || 'T').charAt(0).toUpperCase();
  const notificationsBadgeLabel =
    typeof unreadNotifications === 'number' && unreadNotifications > 0
      ? unreadNotifications > 99
        ? '99+'
        : String(unreadNotifications)
      : null;

  const goToSearch = (params?: Record<string, string>) =>
    router.navigate(
      params
        ? { pathname: '/(tabs)/search', params: { ...params, applyCategory: '1' } }
        : '/(tabs)/search',
    );

  const promoSlides = useHomePromoSlides();
  const featuredPromo = promoSlides[promoSlides.length - 1]!;

  const iconBtnSize = { width: 44, height: 44 };
  const iconBtnInner = {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 0.1,
    borderColor: colors.ink,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header — respiration type « Votre espace » */}
      <View
        style={{
          paddingHorizontal: Spacing.six,
          paddingTop: Spacing.five,
          paddingBottom: Spacing.three,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1 }}>
          {isGuest ? (
            <Logo size={44} />
          ) : (
            <PremiumRingFrame size={44} isPremium={isPremium} backgroundColor={colors.ink}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Text style={[textStyle('featureHeading'), { color: colors.onPrimary }]}>{initial}</Text>
              )}
            </PremiumRingFrame>
          )}
          <View style={{ flex: 1 }}>
            {!isGuest ? (
              <Text style={{ color: colors.muted }} variant="micro">
                {t('home.greeting')}
              </Text>
            ) : null}
            <Text numberOfLines={1} style={{ color: colors.ink }} variant="featureHeading" display>
              {isGuest ? 'Kadhamine' : firstName || 'Kadhamine'}
            </Text>
            <Text numberOfLines={2} style={{ color: colors.muted, marginTop: 2 }} variant="micro">
              {t('home.headerSubtitle')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Pressable onPress={toggle} style={iconBtnSize}>
            <View style={iconBtnInner}>
              {isDark ? <Sun size={18} color={colors.ink} /> : <Moon size={18} color={colors.ink} />}
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={
              notificationsBadgeLabel
                ? t('home.unreadNotifications', { count: unreadNotifications })
                : t('notifications.title')
            }
            style={({ pressed }) => [iconBtnSize, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[iconBtnInner, { position: 'relative' }]}>
              <Bell size={18} color={colors.ink} />
              {notificationsBadgeLabel ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    borderRadius: 8,
                    backgroundColor: colors.signal,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: colors.surfaceCard,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 9,
                      lineHeight: 11,
                      fontFamily: fontFamily('body', 'bold'),
                    }}
                  >
                    {notificationsBadgeLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.eight }}>
        {/* Dernier slide promo + recherche (carrousel conservé dans PromoCarousel) */}
        <PromoSearchHero
          slide={featuredPromo}
          searchPlaceholder={t('home.searchPlaceholder')}
          onSearchPress={() => goToSearch()}
        />

        <ServiceCarousel
          title={t('home.topRated')}
          actionLabel={t('common.seeAll')}
          onAction={() => goToSearch()}
          items={topRated}
          emptyMessage={'Aucun service noté pour le moment.'}
          onPressItem={(id) => router.push(`/service/${id}`)}
        />

        <ProviderPodium
          title={t('home.topTalents')}
          actionLabel={t('common.seeAll')}
          onAction={() => router.push('/talents' as never)}
          items={homeProviders}
          onPressProvider={(profileId) =>
            router.push({ pathname: '/provider/[id]', params: { id: profileId } })
          }
        />

        {/* Catégories — masonry horizontal */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: Spacing.six,
              marginBottom: Spacing.four,
            }}
          >
            <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>
              {t('home.categories')}
            </Text>
            <Pressable onPress={() => router.navigate('/(tabs)/categories')} hitSlop={8}>
              <Text style={[textStyle('button'), { color: colors.ink }]}>{t('common.seeAll')} →</Text>
            </Pressable>
          </View>

          <CategoryHorizontalMasonry
            categories={categories?.map((cat) => ({
              id: cat._id,
              label: cat.nameFr,
              icon: cat.icon,
              slug: cat.slug,
              serviceCount: cat.serviceCount,
            }))}
            limit={12}
            onPressCategory={(id) => goToSearch({ categoryId: id })}
          />
        </View>

        {/* Services en vedette — liste verticale */}
        <ServiceCarousel
          title={t('home.featured')}
          actionLabel={t('common.seeAll')}
          onAction={() => goToSearch()}
          items={featured}
          layout="vertical"
          emptyTitle="Aucun service pour le moment"
          emptyDescription="Soyez le premier prestataire !"
          onPressItem={(id) => router.push(`/service/${id}`)}
        />

        {/* Réassurance */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <TrustStrip />
        </View>

        {/* Pied éditorial */}
        <Pressable onPress={() => router.push('/premium')} style={{ alignSelf: 'stretch' }}>
          <View
            style={{
              marginHorizontal: Spacing.four,
              alignItems: 'center',
              gap: Spacing.two,
            }}
          >
            <Storefront size={22} color={colors.muted} />
            <Text style={[textStyle('caption'), { color: colors.muted, textAlign: 'center' }]}>
              {t('app.tagline')}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
