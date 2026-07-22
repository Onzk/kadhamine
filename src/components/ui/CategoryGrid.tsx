import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { CategoryCard, CategoryCardSkeleton, type CategoryCardData } from '@/components/ui/CategoryCard';
import { Spacing } from '@/theme/tokens';

const GRID_GAP = Spacing.four;

interface CategoryGridProps {
  categories: CategoryCardData[] | undefined;
  onPressCategory: (id: string) => void;
  columns?: 2 | 3;
  limit?: number;
}

/** Grille de cards catégories — 2 colonnes par défaut, espacement 16px. */
export function CategoryGrid({
  categories,
  onPressCategory,
  columns = 2,
  limit,
}: CategoryGridProps) {
  const { width } = useWindowDimensions();
  const tileWidth = (width - Spacing.four * 2 - GRID_GAP * (columns - 1)) / columns;

  const items = limit && categories ? categories.slice(0, limit) : categories;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.four,
        rowGap: GRID_GAP,
        columnGap: GRID_GAP,
      }}
    >
      {items === undefined
        ? Array.from({ length: columns * 2 }).map((_, i) => (
            <CategoryCardSkeleton key={i} width={tileWidth} />
          ))
        : items.map((cat) => (
            <CategoryCard
              key={cat.id}
              item={cat}
              width={tileWidth}
              onPress={() => onPressCategory(cat.id)}
            />
          ))}
    </View>
  );
}
