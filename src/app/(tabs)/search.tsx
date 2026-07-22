import React, { useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { MagnifyingGlass as SearchIcon } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { ServiceCard } from '@/components/cards/ServiceCard';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLocation } from '@/hooks/useLocation';
import { useAppTheme } from '@/providers/ThemeProvider';
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

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(params.categoryId);

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title={t('search.title')} />

      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceCard,
            borderRadius: 999,
            paddingHorizontal: 24,
            height: 48,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 10,
          }}
        >
          <SearchIcon size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.ink, fontSize: 15 }}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <CategoryChip
          label={t('search.recent')}
          selected={sortBy === 'recent'}
          onPress={() => setSortBy('recent')}
        />
        <CategoryChip
          label={t('search.rating')}
          selected={sortBy === 'rating'}
          onPress={() => setSortBy('rating')}
        />
        <CategoryChip
          label={t('search.priceAsc')}
          selected={sortBy === 'price_asc'}
          onPress={() => setSortBy('price_asc')}
        />
        <CategoryChip
          label={t('search.verifiedOnly')}
          selected={verifiedOnly}
          onPress={() => setVerifiedOnly(!verifiedOnly)}
        />
        <CategoryChip
          label="Près de moi"
          selected={useDistance}
          onPress={() => setUseDistance(!useDistance)}
        />
      </ScrollView>

      {categories && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <CategoryChip
            label="Toutes"
            selected={!selectedCategory}
            onPress={() => setSelectedCategory(undefined)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat._id}
              label={cat.nameFr}
              icon={cat.icon}
              selected={selectedCategory === cat._id}
              onPress={() => setSelectedCategory(cat._id)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
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
              city={item.service.city}
              isVerified={item.profile?.isVerified}
              isPremium={item.profile?.isPremium}
              categoryIcon={item.category?.icon}
              onPress={() => router.push(`/service/${item.service._id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
