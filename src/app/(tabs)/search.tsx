import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, ScrollView, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { MagnifyingGlass as SearchIcon, MapPin, SquaresFour, X } from 'phosphor-react-native';
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

const FAB_SIZE = 56;
const FAB_GAP = 12;

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const { latitude, longitude } = useLocation();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<
    'rating' | 'price_asc' | 'price_desc' | 'popular' | 'recent' | 'distance'
  >('recent');
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

  const selectedCategoryLabel = useMemo(
    () => categories?.find((c) => c._id === selectedCategory)?.nameFr,
    [categories, selectedCategory],
  );

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
        subtitle="Trouvez le talent qu'il vous faut près de chez vous."
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
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Filtres — pills py-2.5 / px-3 */}
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
            compact
            label={t('search.rating')}
            selected={sortBy === 'rating' && !useDistance}
            onPress={() => {
              setUseDistance(false);
              setSortBy('rating');
            }}
          />
          <FilterChip
            compact
            label={t('search.priceAsc')}
            selected={sortBy === 'price_asc' && !useDistance}
            onPress={() => {
              setUseDistance(false);
              setSortBy('price_asc');
            }}
          />
          <FilterChip
            compact
            label={t('search.verifiedOnly')}
            selected={verifiedOnly}
            onPress={() => setVerifiedOnly((v) => !v)}
          />
          <FilterChip
            compact
            label="Près de moi"
            selected={useDistance}
            onPress={() => setUseDistance((v) => !v)}
          />
        </ScrollView>

        {/* Catégorie active (si filtrée via la page Catégories) */}
        {selectedCategory && selectedCategoryLabel ? (
          <View
            style={{
              paddingHorizontal: PAGE_H_PAD,
              paddingBottom: Spacing.four,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Pressable
              onPress={() => setSelectedCategory(undefined)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: Spacing.twoHalf,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.pill,
                backgroundColor: colors.orbit,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text
                style={[
                  textStyle('caption'),
                  { fontFamily: fontFamily('body', 'medium'), color: colors.onPrimary },
                ]}
              >
                {selectedCategoryLabel}
              </Text>
              <X size={14} color={colors.onPrimary} weight="bold" />
            </Pressable>
          </View>
        ) : (
          <View style={{ height: Spacing.two }} />
        )}

        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: Spacing.four }}>
          {resultCount !== undefined ? (
            <Text
              style={[
                textStyle('caption'),
                { fontFamily: fontFamily('body', 'medium'), color: colors.muted },
              ]}
            >
              {resultCount} résultat{resultCount !== 1 ? 's' : ''} trouvé
              {resultCount !== 1 ? 's' : ''}
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

      {/* FAB Catégories — au-dessus de la carte */}
      <Pressable
        onPress={() =>
          router.push({ pathname: '/(tabs)/categories', params: { from: 'search' } })
        }
        accessibilityLabel="Ouvrir les catégories"
        style={({ pressed }) => ({
          position: 'absolute',
          right: Spacing.four,
          bottom: Spacing.four + FAB_SIZE + FAB_GAP,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          ...Shadows.elevated,
        })}
      >
        <SquaresFour size={24} color={colors.onPrimary} weight="fill" />
      </Pressable>

      {/* FAB Carte */}
      <Pressable
        onPress={() => router.push('/map' as never)}
        accessibilityLabel="Ouvrir la carte"
        style={({ pressed }) => ({
          position: 'absolute',
          right: Spacing.four,
          bottom: Spacing.four,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
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
