import React, { useEffect, useState } from 'react';
import { View, TextInput, ScrollView, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { MagnifyingGlass as SearchIcon, MapPin } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { ServiceCard } from '@/components/cards/ServiceCard';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useLocation } from '@/hooks/useLocation';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const { latitude, longitude } = useLocation();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'price_desc' | 'popular' | 'recent' | 'distance'>('recent');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [useDistance, setUseDistance] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(params.categoryId);

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const mapTalents = useQuery(api.services.listForMap, {
    latitude,
    longitude,
    radiusKm: 50,
  });

  useEffect(() => {
    if (params.categoryId) setSelectedCategory(params.categoryId);
  }, [params.categoryId]);

  const services = useQuery(api.services.list, {
    categoryId: selectedCategory as Id<'categories'> | undefined,
    search: search || undefined,
    sortBy: useDistance ? 'distance' : sortBy,
    verifiedOnly: verifiedOnly || undefined,
    latitude: useDistance ? latitude : undefined,
    longitude: useDistance ? longitude : undefined,
    radiusKm: useDistance ? 50 : undefined,
    limit: 50,
  });

  const resultCount = services?.length;
  const mapCount = mapTalents?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('search.title')}
        headerActions={
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceCard,
              borderRadius: Radius.pill,
              paddingHorizontal: Spacing.five,
              height: 48,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 10,
              ...Shadows.nav,
            }}
          >
            <SearchIcon size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 0 }}
              returnKeyType="search"
            />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      >
        {/* Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: PAGE_H_PAD,
            gap: Spacing.two,
            paddingTop: Spacing.four,
            paddingBottom: Spacing.three,
          }}
        >
          <FilterChip
            label={t('search.rating')}
            selected={sortBy === 'rating' && !useDistance}
            onPress={() => {
              setUseDistance(false);
              setSortBy('rating');
            }}
          />
          <FilterChip
            label={t('search.priceAsc')}
            selected={sortBy === 'price_asc' && !useDistance}
            onPress={() => {
              setUseDistance(false);
              setSortBy('price_asc');
            }}
          />
          <FilterChip
            label={t('search.verifiedOnly')}
            selected={verifiedOnly}
            onPress={() => setVerifiedOnly((v) => !v)}
          />
          <FilterChip
            label="Près de moi"
            selected={useDistance}
            onPress={() => setUseDistance((v) => !v)}
          />
        </ScrollView>

        {/* Catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: PAGE_H_PAD,
            gap: Spacing.two,
            paddingBottom: Spacing.five,
          }}
        >
          <FilterChip
            label="Toutes"
            selected={!selectedCategory}
            onPress={() => setSelectedCategory(undefined)}
          />
          {categories?.map((cat) => (
            <FilterChip
              key={cat._id}
              label={cat.nameFr}
              icon={cat.icon}
              selected={selectedCategory === cat._id}
              onPress={() => setSelectedCategory(cat._id)}
            />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: Spacing.four }}>
          {resultCount !== undefined ? (
            <Text
              style={[
                textStyle('caption'),
                { fontFamily: fontFamily('body', 'medium'), color: colors.muted },
              ]}
            >
              {resultCount} résultat{resultCount !== 1 ? 's' : ''} trouvé{resultCount !== 1 ? 's' : ''}
            </Text>
          ) : null}

          {services === undefined ? (
            <>
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
            </>
          ) : services.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title={t('search.noResults')}
              description={t('search.tryDifferent')}
            />
          ) : (
            services.map((item) => (
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
                  item.profile ? `${item.profile.firstName} ${item.profile.lastName}` : 'Prestataire'
                }
                providerAvatar={item.profile?.avatarUrl}
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
      </PageScaffold>

      <Pressable
        onPress={() => router.push('/map' as never)}
        style={({ pressed }) => ({
          position: 'absolute',
          right: Spacing.four,
          bottom: Spacing.four,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.orbit,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          ...Shadows.elevated,
        })}
      >
        <MapPin size={24} color={colors.onPrimary} weight="fill" />
        {mapCount > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 5,
              borderWidth: 2,
              borderColor: colors.canvas,
            }}
          >
            <Text style={[textStyle('micro'), { color: colors.onPrimary, fontSize: 10 }]}>
              {mapCount > 99 ? '99+' : mapCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
