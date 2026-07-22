import React, { useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { MagnifyingGlass, Bell, Moon, Sun, MapPin, HandWaving, Wrench } from 'phosphor-react-native';

import { ServiceCard } from '@/components/cards/ServiceCard';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/ThemedText';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, toggle, isDark } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const featured = useQuery(api.services.getFeatured, { limit: 10 });
  const seedCategories = useMutation(api.seed.seedCategories);
  const seedSettings = useMutation(api.seed.seedSettings);

  useEffect(() => {
    seedCategories({}).catch(() => {});
    seedSettings({}).catch(() => {});
  }, [seedCategories, seedSettings]);

  const firstName = user?.profile?.firstName ?? '';

  const iconBtn = {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: colors.ink,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.four,
          }}
        >
          <View>
            <Text style={{ color: colors.muted }} variant="caption">
              {t('home.greeting')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colors.ink }} variant="cardHeading" display>
                {firstName || 'TalentTchad'}
              </Text>
              <HandWaving size={22} color={colors.orbit} style={{ marginLeft: 6 }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Pressable onPress={() => router.push('/map' as never)} style={iconBtn}>
              <MapPin size={18} color={colors.ink} />
            </Pressable>
            <Pressable onPress={toggle} style={iconBtn}>
              {isDark ? <Sun size={18} color={colors.ink} /> : <Moon size={18} color={colors.ink} />}
            </Pressable>
            <Pressable onPress={() => router.push('/notifications')} style={iconBtn}>
              <Bell size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/search')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: Radius.pill,
            paddingHorizontal: Spacing.six,
            height: 48,
            borderWidth: 1,
            borderColor: 'rgba(20, 20, 19, 0.5)',
            gap: 10,
            ...Shadows.nav,
          }}
        >
          <MagnifyingGlass size={18} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 15 }}>{t('home.searchPlaceholder')}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Pressable
          onPress={() => router.push('/premium')}
          style={{
            marginHorizontal: Spacing.four,
            marginBottom: Spacing.four,
            backgroundColor: colors.ink,
            borderRadius: Radius.stadium,
            padding: Spacing.eight,
            minHeight: 160,
            justifyContent: 'flex-end',
          }}
        >
          <Eyebrow label={t('common.premium')} color={colors.onPrimary} />
          <Text
            style={[
              textStyle('sectionHeading'),
              { color: colors.onPrimary, marginBottom: Spacing.two },
            ]}
          >
            Passez Premium
          </Text>
          <Text style={[textStyle('caption'), { color: colors.dust }]}>
            Badge Premium + mise en avant dans les recherches pour les prestataires.
          </Text>
        </Pressable>

        <View
          style={{
            marginHorizontal: Spacing.four,
            marginBottom: Spacing.eight,
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.stadium,
            padding: Spacing.eight,
            borderWidth: 1.5,
            borderColor: colors.ink,
          }}
        >
          <Eyebrow label="FedaPay" />
          <Text
            style={[
              textStyle('featureHeading'),
              { color: colors.ink, marginBottom: Spacing.two },
            ]}
          >
            {t('payment.integratedBenefit')}
          </Text>
          <Text style={[textStyle('caption'), { color: colors.muted }]}>
            Payez via FedaPay pour débloquer les avis officiels et sécuriser la prestation.
          </Text>
        </View>

        <View style={{ marginBottom: Spacing.eight }}>
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
            <Pressable onPress={() => router.push('/map' as never)}>
              <Text style={[textStyle('button'), { color: colors.link }]}>
                {t('home.nearYou')} →
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.four }}
          >
            {categories === undefined
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={{ width: 100, height: 40, marginRight: 8 }} />
                ))
              : categories.map((cat) => (
                  <CategoryChip
                    key={cat._id}
                    label={cat.nameFr}
                    icon={cat.icon}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/search', params: { categoryId: cat._id } })
                    }
                  />
                ))}
          </ScrollView>
        </View>

        <View
          style={{
            paddingHorizontal: Spacing.four,
            marginBottom: Spacing.four,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>
            {t('home.featured')}
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/search')}>
            <Text style={[textStyle('button'), { color: colors.ink }]}>{t('common.seeAll')}</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.four, paddingBottom: Spacing.eight }}>
          {featured === undefined ? (
            <>
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
            </>
          ) : featured.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.nine }}>
              <Wrench size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12 }}>
                Aucun service pour le moment.{'\n'}Soyez le premier prestataire !
              </Text>
            </View>
          ) : (
            featured.map((item) => (
              <ServiceCard
                key={item.service._id}
                title={item.service.title}
                description={item.service.description}
                price={item.service.price}
                pricingType={item.service.pricingType}
                photo={item.service.photos[0]}
                rating={item.service.averageRating}
                reviewCount={item.service.reviewCount}
                providerName={
                  item.profile
                    ? `${item.profile.firstName} ${item.profile.lastName}`
                    : 'Prestataire'
                }
                city={item.service.city}
                isVerified={item.profile?.isVerified}
                isPremium={item.profile?.isPremium}
                categoryIcon={item.category?.icon}
                categoryLabel={item.category?.nameFr}
                onPress={() => router.push(`/service/${item.service._id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
