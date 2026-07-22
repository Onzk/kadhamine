import React, { useMemo, useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { MagnifyingGlass } from 'phosphor-react-native';

import { CategoryGrid } from '@/components/ui/CategoryGrid';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
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
    serviceCount: cat.serviceCount,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title="Catégories" showBack />

      <View style={{ paddingHorizontal: Spacing.four, marginBottom: Spacing.four }}>
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Spacing.eight }}
      >
        <CategoryGrid
          categories={gridItems}
          onPressCategory={(id) =>
            router.push({ pathname: '/(tabs)/search', params: { categoryId: id } })
          }
        />
      </ScrollView>
    </View>
  );
}
