import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import {
  MagnifyingGlass as SearchIcon,
  MapPin,
  SquaresFour,
  ArrowsDownUp,
  X,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { ServiceCard } from '@/components/cards/ServiceCard';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { FLUTTER_FAB, FlutterFab } from '@/components/ui/FlutterFab';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useLocation } from '@/hooks/useLocation';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const FAB_STACK_GAP = 12;
const FAB_MAP_BOTTOM = FLUTTER_FAB.edgeMargin;
const FAB_CATEGORIES_BOTTOM =
  FLUTTER_FAB.edgeMargin + FLUTTER_FAB.height + FAB_STACK_GAP;

const SORT_BTN_SIZE = 48;
const GRID_GAP = Spacing.three;
const PILL_MIN_HEIGHT = 52;

type SortKey = 'rating' | 'price_asc' | 'price_desc' | 'popular' | 'recent' | 'distance';

type SortOption = { key: SortKey; label: string };

type FilterPillProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  fullWidth?: boolean;
};

function FilterPill({ label, description, selected, onPress, fullWidth }: FilterPillProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={({ pressed }) => ({
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? '100%' : undefined,
        minHeight: description ? 64 : PILL_MIN_HEIGHT,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          minHeight: description ? 64 : PILL_MIN_HEIGHT,
          paddingVertical: Spacing.three,
          paddingHorizontal: Spacing.four,
          borderRadius: Radius.pill,
          backgroundColor: selected ? colors.orbit : colors.surfaceCard,
          borderWidth: 0.1,
          borderColor: selected ? colors.orbit : colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Text
          numberOfLines={2}
          style={[
            textStyle('button'),
            {
              color: selected ? '#FFFFFF' : colors.ink,
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 20,
            },
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text
            numberOfLines={2}
            style={[
              textStyle('micro'),
              {
                color: selected ? 'rgba(255,255,255,0.82)' : colors.muted,
                textAlign: 'center',
                fontSize: 11,
                lineHeight: 14,
              },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; applyCategory?: string }>();
  const { latitude, longitude } = useLocation();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('recent');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [useDistance, setUseDistance] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const categories = useQuery(api.categories.list, { activeOnly: true });

  useFocusEffect(
    useCallback(() => {
      if (params.applyCategory !== '1') return;

      const raw = params.categoryId;
      const categoryId =
        typeof raw === 'string' && raw.length > 0
          ? raw
          : Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].length > 0
            ? raw[0]
            : undefined;

      if (!categoryId) return;

      setSelectedCategory(categoryId);
      queueMicrotask(() => {
        router.setParams({ categoryId: undefined, applyCategory: undefined });
      });
    }, [params.applyCategory, params.categoryId, router]),
  );

  const selectedCategoryLabel = useMemo(
    () => categories?.find((c) => c._id === selectedCategory)?.nameFr,
    [categories, selectedCategory],
  );

  const sortOptions: SortOption[] = useMemo(
    () => [
      { key: 'recent', label: t('search.recent') },
      { key: 'rating', label: t('search.rating') },
      { key: 'price_asc', label: t('search.priceAsc') },
      { key: 'price_desc', label: t('search.priceDesc') },
      { key: 'popular', label: t('search.popular') },
    ],
    [t],
  );

  const activeSortLabel = useMemo(
    () => sortOptions.find((o) => o.key === sortBy)?.label ?? t('search.sortBy'),
    [sortBy, sortOptions, t],
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
  const hasActiveFilters = verifiedOnly || useDistance || sortBy !== 'recent';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('search.title')}
        subtitle="Trouvez le talent qu'il vous faut près de chez vous."
        bottomInset={false}
        headerActions={
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
              width: '100%',
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={t('home.searchPlaceholder')}
              />
            </View>
            <Pressable
              onPress={() => setSortSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('search.sortBy')}
              style={({ pressed }) => ({
                width: SORT_BTN_SIZE,
                height: SORT_BTN_SIZE,
                flexShrink: 0,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <View
                style={{
                  width: SORT_BTN_SIZE,
                  height: SORT_BTN_SIZE,
                  borderRadius: Radius.pill,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 0.1,
                  borderColor: colors.borderStrong,
                }}
              >
                <ArrowsDownUp
                  size={22}
                  color={hasActiveFilters ? colors.orbit : BrandColors.ink}
                  weight="bold"
                />
              </View>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {selectedCategory && selectedCategoryLabel ? (
          <View
            style={{
              paddingHorizontal: PAGE_H_PAD,
              paddingTop: Spacing.four,
              paddingBottom: Spacing.three,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Pressable
              onPress={() => setSelectedCategory(undefined)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: Spacing.twoHalf,
                  paddingHorizontal: Spacing.three,
                  borderRadius: Radius.pill,
                  backgroundColor: colors.orbit,
                }}
              >
                <Text
                  style={[
                    textStyle('caption'),
                    { fontFamily: fontFamily('body', 'medium'), color: '#FFFFFF' },
                  ]}
                >
                  {selectedCategoryLabel}
                </Text>
                <X size={14} color="#FFFFFF" weight="bold" />
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={{ height: Spacing.four }} />
        )}

        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: Spacing.four }}>
          {resultCount !== undefined ? (
            <Text
              style={[
                textStyle('caption'),
                { fontFamily: fontFamily('body', 'medium'), color: colors.body },
              ]}
            >
              {resultCount} résultat{resultCount !== 1 ? 's' : ''} trouvé
              {resultCount !== 1 ? 's' : ''}
              {sortBy !== 'recent' || useDistance
                ? ` · ${useDistance ? t('search.nearMe') : activeSortLabel}`
                : ''}
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

      <AppBottomSheet
        visible={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title={t('search.filterSheetTitle')}
        subtitle={t('search.filterSheetSubtitle')}
        maxHeightRatio={0.78}
      >
        <View style={{ gap: Spacing.six, paddingBottom: Spacing.four }}>
          <View style={{ gap: Spacing.three }}>
            <Text
              style={[
                textStyle('caption'),
                {
                  fontFamily: fontFamily('body', 'medium'),
                  color: colors.ink,
                  letterSpacing: 0.2,
                },
              ]}
            >
              {t('search.sortSectionTitle')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: GRID_GAP,
              }}
            >
              {sortOptions.map((opt) => (
                <View key={opt.key} style={{ width: '47%', flexGrow: 1, maxWidth: '48.5%' }}>
                  <FilterPill
                    label={opt.label}
                    selected={!useDistance && sortBy === opt.key}
                    fullWidth
                    onPress={() => {
                      setUseDistance(false);
                      setSortBy(opt.key);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.three }}>
            <Text
              style={[
                textStyle('caption'),
                {
                  fontFamily: fontFamily('body', 'medium'),
                  color: colors.ink,
                  letterSpacing: 0.2,
                },
              ]}
            >
              {t('search.filtersSectionTitle')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: GRID_GAP,
              }}
            >
              <View style={{ width: '47%', flexGrow: 1, maxWidth: '48.5%' }}>
                <FilterPill
                  label={t('search.verifiedOnly')}
                  selected={verifiedOnly}
                  fullWidth
                  onPress={() => setVerifiedOnly((v) => !v)}
                />
              </View>
              <View style={{ width: '47%', flexGrow: 1, maxWidth: '48.5%' }}>
                <FilterPill
                  label={t('search.nearMe')}
                  selected={useDistance}
                  fullWidth
                  onPress={() => setUseDistance((v) => !v)}
                />
              </View>
            </View>
          </View>
        </View>
      </AppBottomSheet>

      <FlutterFab
        absolute
        bottom={FAB_CATEGORIES_BOTTOM}
        onPressed={() => router.navigate('/(tabs)/categories')}
        icon={<SquaresFour size={24} color="#FFFFFF" weight="fill" />}
        backgroundColor={colors.orbit}
        foregroundColor="#FFFFFF"
        accessibilityLabel="Voir les catégories"
      />
      <FlutterFab
        absolute
        bottom={FAB_MAP_BOTTOM}
        onPressed={() => router.push('/map' as never)}
        icon={<MapPin size={24} color="#FFFFFF" weight="fill" />}
        backgroundColor={BrandColors.crimson}
        foregroundColor="#FFFFFF"
        accessibilityLabel="Voir la carte"
      />
    </View>
  );
}
