import React, { useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import {
  MagnifyingGlass,
  Bell,
  Moon,
  Sun,
  MapPin,
  CaretRight,
  Storefront,
  Crown,
  CreditCard,
} from 'phosphor-react-native';

import { ServiceCarousel } from '@/components/cards/ServiceCarousel';
import { CategoryGrid } from '@/components/ui/CategoryGrid';
import { PromoCarousel } from '@/components/ui/PromoCarousel';
import { TrustStrip } from '@/components/ui/TrustStrip';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Text } from '@/components/ui/ThemedText';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

/** Espacement vertical unique entre les grandes sections. */
const SECTION_GAP = Spacing.eight;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, toggle, isDark } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();

  const categories = useQuery(api.categories.listWithCounts, { activeOnly: true });
  const featured = useQuery(api.services.getFeatured, { limit: 10 });
  const topRated = useQuery(api.services.list, { sortBy: 'rating', limit: 10 });
  const seedCategories = useMutation(api.seed.seedCategories);
  const seedSettings = useMutation(api.seed.seedSettings);

  useEffect(() => {
    seedCategories({}).catch(() => {});
    seedSettings({}).catch(() => {});
  }, [seedCategories, seedSettings]);

  const firstName = user?.profile?.firstName ?? '';
  const city = user?.profile?.city ?? "N'Djamena";
  const avatarUrl = user?.profile?.avatarUrl;
  const initial = (firstName || 'T').charAt(0).toUpperCase();

  const goToSearch = (params?: Record<string, string>) =>
    router.push(params ? { pathname: '/(tabs)/search', params } : '/(tabs)/search');

  const iconBtn = {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: colors.ink,
  };

  const promoSlides = [
    <Pressable
      key="premium"
      onPress={() => router.push('/premium')}
      style={{
        backgroundColor: colors.ink,
        borderRadius: Radius.stadium,
        paddingVertical: Spacing.six,
        paddingHorizontal: Spacing.six,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
        ...Shadows.elevated,
      }}
    >
      <View style={{ flex: 1 }}>
        <Eyebrow label={t('common.premium')} color={colors.onPrimary} dotColor={colors.orbit} />
        <Text style={[textStyle('featureHeading'), { color: colors.onPrimary, marginBottom: Spacing.one }]}>
          Passez Premium
        </Text>
        <Text style={[textStyle('caption'), { color: colors.dust }]}>
          Badge Premium + mise en avant dans les recherches.
        </Text>
      </View>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.orbit,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Crown size={20} color={colors.onPrimary} weight="fill" />
      </View>
    </Pressable>,
    <View
      key="fedapay"
      style={{
        backgroundColor: colors.surfaceCard,
        borderRadius: Radius.stadium,
        paddingVertical: Spacing.six,
        paddingHorizontal: Spacing.six,
        borderWidth: 1.5,
        borderColor: colors.ink,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
      }}
    >
      <View style={{ flex: 1 }}>
        <Eyebrow label="FedaPay" />
        <Text style={[textStyle('featureHeading'), { color: colors.ink, marginBottom: Spacing.one }]}>
          {t('payment.integratedBenefit')}
        </Text>
        <Text style={[textStyle('caption'), { color: colors.muted }]}>
          Payez via FedaPay pour débloquer les avis officiels.
        </Text>
      </View>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.iconWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CreditCard size={20} color={colors.ink} weight="bold" />
      </View>
    </View>,
    <Pressable
      key="nearby"
      onPress={() => router.push('/map' as never)}
      style={{
        backgroundColor: colors.surfaceStrong,
        borderRadius: Radius.stadium,
        paddingVertical: Spacing.six,
        paddingHorizontal: Spacing.six,
        borderWidth: 1.5,
        borderColor: colors.ink,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
      }}
    >
      <View style={{ flex: 1 }}>
        <Eyebrow label={t('home.nearYou')} />
        <Text style={[textStyle('featureHeading'), { color: colors.ink, marginBottom: Spacing.one }]}>
          Talents près de chez vous
        </Text>
        <Text style={[textStyle('caption'), { color: colors.muted }]}>
          Découvrez les prestataires autour de vous sur la carte.
        </Text>
      </View>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.iconWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MapPin size={20} color={colors.ink} weight="fill" />
      </View>
    </Pressable>,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header fixe */}
      <View
        style={{
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.two,
          paddingBottom: Spacing.three,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              overflow: 'hidden',
              backgroundColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Text style={[textStyle('featureHeading'), { color: colors.onPrimary }]}>{initial}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.muted }} variant="micro">
              {t('home.greeting')}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.ink }} variant="featureHeading" display>
              {firstName || 'TalentTchad'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Pressable onPress={toggle} style={iconBtn}>
            {isDark ? <Sun size={18} color={colors.ink} /> : <Moon size={18} color={colors.ink} />}
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} style={iconBtn}>
            <Bell size={18} color={colors.ink} />
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 11,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.signal,
                borderWidth: 1.5,
                borderColor: colors.surfaceCard,
              }}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.eight }}>
        {/* Hero éditorial */}
        <View style={{ paddingHorizontal: Spacing.four, marginBottom: SECTION_GAP }}>
          <Pressable
            onPress={() => router.push('/map' as never)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 6,
              paddingVertical: Spacing.one,
              paddingHorizontal: Spacing.three,
              borderRadius: Radius.pill,
              backgroundColor: colors.surfaceStrong,
              marginBottom: Spacing.four,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MapPin size={14} color={colors.ink} weight="fill" />
            <Text style={[textStyle('micro'), { color: colors.ink }]}>{city}</Text>
            <CaretRight size={12} color={colors.muted} />
          </Pressable>

          <Text style={[textStyle('heroDisplay'), { color: colors.ink }]}>
            Le talent tchadien,{'\n'}
            <Text style={[textStyle('heroDisplay'), { color: colors.orbit }]}>à portée de main.</Text>
          </Text>

          <Pressable
            onPress={() => goToSearch()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceCard,
              borderRadius: Radius.pill,
              paddingLeft: Spacing.six,
              paddingRight: Spacing.two,
              height: 56,
              borderWidth: 1.5,
              borderColor: colors.ink,
              gap: 10,
              marginTop: Spacing.six,
              ...Shadows.nav,
            }}
          >
            <MagnifyingGlass size={20} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 15, flex: 1 }}>
              {t('home.searchPlaceholder')}
            </Text>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MagnifyingGlass size={18} color={colors.onPrimary} weight="bold" />
            </View>
          </Pressable>
        </View>

        {/* Services en vedette — avant les catégories */}
        <ServiceCarousel
          title={t('home.featured')}
          actionLabel={t('common.seeAll')}
          onAction={() => goToSearch()}
          items={featured}
          emptyMessage={'Aucun service pour le moment.\nSoyez le premier prestataire !'}
          onPressItem={(id) => router.push(`/service/${id}`)}
        />

        {/* Catégories — grid cards */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: Spacing.four,
              marginBottom: Spacing.four,
            }}
          >
            <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>
              {t('home.categories')}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/categories')} hitSlop={8}>
              <Text style={[textStyle('button'), { color: colors.ink }]}>{t('common.seeAll')} →</Text>
            </Pressable>
          </View>

          <CategoryGrid
            categories={categories?.map((cat) => ({
              id: cat._id,
              label: cat.nameFr,
              icon: cat.icon,
              serviceCount: cat.serviceCount,
            }))}
            limit={10}
            onPressCategory={(id) => goToSearch({ categoryId: id })}
          />
        </View>

        {/* Carrousel promo */}
        <PromoCarousel slides={promoSlides} />

        {/* Mieux notés */}
        <ServiceCarousel
          title={t('home.topRated')}
          actionLabel={t('common.seeAll')}
          onAction={() => goToSearch()}
          items={topRated}
          emptyMessage={'Aucun service noté pour le moment.'}
          onPressItem={(id) => router.push(`/service/${id}`)}
        />

        {/* Réassurance */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <TrustStrip />
        </View>

        {/* Pied éditorial */}
        <Pressable
          onPress={() => router.push('/premium')}
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
        </Pressable>
      </ScrollView>
    </View>
  );
}
