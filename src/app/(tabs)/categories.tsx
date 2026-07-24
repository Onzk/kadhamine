import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { MagnifyingGlass, X } from 'phosphor-react-native';

import { CategoryMasonryGrid } from '@/components/ui/CategoryMasonryGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlutterFab } from '@/components/ui/FlutterFab';
import { PageScaffold } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
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
    router.navigate({
      pathname: '/(tabs)/search',
      params: categoryId ? { categoryId, applyCategory: '1' } : {},
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title="Catégories"
        subtitle="Explorez les métiers et talents disponibles sur Kadhamine."
        bottomInset={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        headerActions={
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une catégorie..."
          />
        }
      >
        <View style={{ marginTop: Spacing.five }}>
          {isEmptyResult ? (
            <EmptyState
              icon={MagnifyingGlass}
              title="Aucune catégorie trouvée"
              description={`Aucune catégorie ne correspond à « ${search.trim()} ».`}
              actionLabel="Effacer la recherche"
              onAction={() => setSearch('')}
              actionVariant="outline"
            />
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
        icon={<X size={24} color={colors.onPrimary} weight="bold" />}
        backgroundColor={colors.ink}
        foregroundColor={colors.onPrimary}
        accessibilityLabel="Fermer et revenir à la recherche"
      />
    </View>
  );
}
