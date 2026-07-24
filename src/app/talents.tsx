import React, { useMemo, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowsDownUp,
  SquaresFour,
  UsersThree,
  X,
} from 'phosphor-react-native';
import type { Id } from '../../convex/_generated/dataModel';

import { ProviderGrid } from '@/components/cards/ProviderGrid';
import { categoryLabel, isProviderPremium } from '@/components/cards/providerShared';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { CategoryPickerSheet } from '@/components/ui/CategoryPickerSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';

const ACTION_BTN = 48;
const PILL_MIN_H = 52;

function FilterPill({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View
        style={{
          minHeight: PILL_MIN_H,
          paddingVertical: Spacing.three,
          paddingHorizontal: Spacing.four,
          borderRadius: Radius.lg,
          backgroundColor: selected ? colors.orbit : colors.surfaceCard,
          borderWidth: BorderWidth.default,
          borderColor: selected ? colors.orbit : colors.borderStrong,
          gap: 2,
        }}
      >
        <Text
          style={[
            textStyle('caption'),
            {
              fontFamily: fontFamily('body', 'medium'),
              color: selected ? colors.onOrbit : colors.ink,
            },
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={[
              textStyle('micro'),
              { color: selected ? colors.onOrbit : colors.muted, opacity: selected ? 0.9 : 1 },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function TalentsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const talents = useQuery(api.profiles.listHome, {
    limit: 60,
    premiumOnly: premiumOnly || undefined,
  });
  const categories = useQuery(api.categories.listWithCounts, { activeOnly: true });

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategory || !categories) return null;
    const cat = categories.find((c) => c._id === selectedCategory);
    if (!cat) return null;
    return categoryLabel(
      {
        nameFr: cat.nameFr,
        nameAr: cat.nameAr,
        nameSara: cat.nameSara,
      },
      i18n.language,
    );
  }, [selectedCategory, categories, i18n.language]);

  const filtered = useMemo(() => {
    if (!talents) return undefined;
    let list = [...talents];

    // Filet client — le serveur filtre déjà quand premiumOnly est actif.
    if (premiumOnly) {
      list = list.filter((item) => isProviderPremium(item.profile));
    }

    if (selectedCategory) {
      list = list.filter((item) => {
        if (item.categoryIds?.includes(selectedCategory as Id<'categories'>)) {
          return true;
        }
        return item.category?._id === selectedCategory;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const { profile, category } = item;
        const hay = [
          profile.firstName,
          profile.lastName,
          profile.city,
          profile.region,
          profile.bio,
          ...(profile.skills ?? []),
          categoryLabel(category, i18n.language) ?? '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // Toujours : Premium en tête, puis mieux notés.
    list.sort((a, b) => {
      const aPremium = isProviderPremium(a.profile) ? 1 : 0;
      const bPremium = isProviderPremium(b.profile) ? 1 : 0;
      if (bPremium !== aPremium) return bPremium - aPremium;
      return (
        b.profile.averageRating - a.profile.averageRating ||
        b.profile.reviewCount - a.profile.reviewCount ||
        b.profile.trustScore - a.profile.trustScore ||
        b.profile.completedOrders - a.profile.completedOrders
      );
    });

    return list;
  }, [talents, premiumOnly, selectedCategory, search, i18n.language]);

  const hasActiveFilters =
    premiumOnly || sortByRating || !!selectedCategory || search.trim().length > 0;
  const listLayout = hasActiveFilters ? 'list' : 'horizontal';
  const bottomPad = Math.max(insets.bottom, Spacing.three) + Spacing.six;
  const iconBtnBg = isDark ? colors.surfaceCard : '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('talents.title')}
        subtitle={t('talents.subtitle')}
        showBack
        bottomInset={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        headerActions={
          <View style={{ gap: Spacing.three, width: '100%' }}>
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
                  placeholder={t('talents.searchPlaceholder')}
                />
              </View>
              <Pressable
                onPress={() => setFilterSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('talents.filters')}
                style={({ pressed }) => ({
                  width: ACTION_BTN,
                  height: ACTION_BTN,
                  flexShrink: 0,
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <View
                  style={{
                    width: ACTION_BTN,
                    height: ACTION_BTN,
                    borderRadius: Radius.pill,
                    backgroundColor: iconBtnBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: BorderWidth.default,
                    borderColor: hasActiveFilters ? colors.orbit : colors.borderStrong,
                  }}
                >
                  <ArrowsDownUp
                    size={22}
                    color={hasActiveFilters ? colors.orbit : colors.ink}
                    weight="bold"
                  />
                </View>
              </Pressable>
              <Pressable
                onPress={() => setCategorySheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('talents.categoryFilter')}
                style={({ pressed }) => ({
                  width: ACTION_BTN,
                  height: ACTION_BTN,
                  flexShrink: 0,
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <View
                  style={{
                    width: ACTION_BTN,
                    height: ACTION_BTN,
                    borderRadius: Radius.pill,
                    backgroundColor: iconBtnBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: BorderWidth.default,
                    borderColor: selectedCategory ? colors.orbit : colors.borderStrong,
                  }}
                >
                  <SquaresFour
                    size={22}
                    color={selectedCategory ? colors.orbit : colors.ink}
                    weight="bold"
                  />
                </View>
              </Pressable>
            </View>
          </View>
        }
      >
        {selectedCategory && selectedCategoryLabel ? (
          <View
            style={{
              paddingHorizontal: PAGE_H_PAD,
              paddingTop: Spacing.four,
              paddingBottom: Spacing.two,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Pressable
              onPress={() => setSelectedCategory(undefined)}
              style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: Spacing.two,
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
          <View style={{ height: Spacing.three }} />
        )}

        {filtered !== undefined && filtered.length === 0 ? (
          <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
            <EmptyState
              icon={UsersThree}
              title={t('talents.noResults')}
              description={t('talents.noResultsDesc')}
              actionLabel={t('common.cancel')}
              onAction={() => {
                setSearch('');
                setPremiumOnly(false);
                setSortByRating(false);
                setSelectedCategory(undefined);
              }}
              actionVariant="outline"
            />
          </View>
        ) : (
          <View style={{ marginTop: Spacing.two }}>
            <ProviderGrid
              items={filtered}
              layout={listLayout}
              onPressProvider={(profileId) =>
                router.push({ pathname: '/provider/[id]', params: { id: profileId } })
              }
              emptyTitle={t('home.providersEmpty')}
              emptyDescription={t('home.providersEmptyDesc')}
            />
          </View>
        )}
      </PageScaffold>

      <AppBottomSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={t('talents.filterSheetTitle')}
        subtitle={t('talents.filterSheetSubtitle')}
        maxHeightRatio={0.55}
      >
        <View style={{ gap: Spacing.three, paddingBottom: Spacing.four }}>
          <FilterPill
            label={t('search.premiumOnly')}
            description={t('talents.premiumOnlyDesc')}
            selected={premiumOnly}
            onPress={() => setPremiumOnly((v) => !v)}
          />
          <FilterPill
            label={t('talents.sortByRating')}
            description={t('talents.sortByRatingDesc')}
            selected={sortByRating}
            onPress={() => setSortByRating((v) => !v)}
          />
        </View>
      </AppBottomSheet>

      <CategoryPickerSheet
        visible={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title={t('talents.categoryFilter')}
        subtitle={t('talents.categoryFilterSubtitle')}
        onSelect={(categoryId) => setSelectedCategory(categoryId)}
        searchPlaceholder={t('home.searchPlaceholder')}
      />
    </View>
  );
}
