import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { CategoryCard, CategoryCardSkeleton, type CategoryCardData } from '@/components/ui/CategoryCard';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Spacing } from '@/theme/tokens';

const GRID_GAP = Spacing.four;

interface CategoryGridProps {
  categories: CategoryCardData[] | undefined;
  onPressCategory: (id: string) => void;
  columns?: 2 | 3;
  limit?: number;
  /** Place les catégories à 0 services en fin de grille. */
  emptyLast?: boolean;
}

/** Grille de cards catégories — espacement 16px, colonnes régulières. */
export function CategoryGrid({
  categories,
  onPressCategory,
  columns = 2,
  limit,
  emptyLast = false,
}: CategoryGridProps) {
  const { width } = useWindowDimensions();
  const tileWidth = (width - PAGE_H_PAD * 2 - GRID_GAP * (columns - 1)) / columns;

  const items = useMemo(() => {
    if (!categories) return undefined;
    let list = [...categories];
    if (emptyLast) {
      list.sort((a, b) => {
        const aEmpty = (a.serviceCount ?? 0) === 0 ? 1 : 0;
        const bEmpty = (b.serviceCount ?? 0) === 0 ? 1 : 0;
        if (aEmpty !== bEmpty) return aEmpty - bEmpty;
        return (b.serviceCount ?? 0) - (a.serviceCount ?? 0);
      });
    }
    if (limit) list = list.slice(0, limit);
    return list;
  }, [categories, emptyLast, limit]);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: PAGE_H_PAD,
        rowGap: GRID_GAP,
        columnGap: GRID_GAP,
      }}
    >
      {items === undefined
        ? Array.from({ length: columns * 3 }).map((_, i) => (
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
