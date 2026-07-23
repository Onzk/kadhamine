import React, { useMemo, useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { MagnifyingGlass } from 'phosphor-react-native';

import { CategoryMasonryGrid } from '@/components/ui/CategoryMasonryGrid';
import { FlutterFab } from '@/components/ui/FlutterFab';
import { PageScaffold } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const categories = useQuery(api.categories.listWithCounts, { activeOnly: true });

  const filtered = useMemo(() => {
    if (!categories) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.nameFr.toLowerCase().includes(q));
  }, [categories, search]);

  const gridItems = filtered?.map((cat) => ({
    id: cat._id,
    label: cat.nameFr,
    icon: cat.icon,
    slug: cat.slug,
    serviceCount: cat.serviceCount,
  }));

  const isEmptyResult = gridItems !== undefined && gridItems.length === 0;

  const goToSearch = (categoryId?: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: categoryId ? { categoryId } : {},
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title="Catégories"
        subtitle="Explorez les métiers et talents disponibles sur TalentTchad."
        contentContainerStyle={{ paddingBottom: 100 }}
        headerActions={
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceStrong,
              borderRadius: Radius.pill,
              paddingHorizontal: Spacing.five,
              height: 48,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 10,
              ...Shadows.nav,
            }}
          >
            <MagnifyingGlass size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher une catégorie..."
              placeholderTextColor={colors.muted}
              style={{ flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 0 }}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        }
      >
        <View style={{ marginTop: Spacing.five }}>
          {isEmptyResult ? (
            <View style={{ paddingHorizontal: Spacing.six, paddingTop: Spacing.eight }}>
              <Text style={[textStyle('body'), { color: colors.muted, textAlign: 'center' }]}>
                Aucune catégorie ne correspond à « {search.trim()} ».
              </Text>
            </View>
          ) : (
            <CategoryMasonryGrid
              categories={gridItems}
              onPressCategory={(id) => goToSearch(id)}
            />
          )}
        </View>
      </PageScaffold>

      <FlutterFab
        absolute
        onPressed={() => goToSearch()}
        icon={<MagnifyingGlass size={24} color={colors.onPrimary} weight="bold" />}
        backgroundColor={colors.ink}
        foregroundColor={colors.onPrimary}
        accessibilityLabel="Revenir à la recherche"
      />
    </View>
  );
}
