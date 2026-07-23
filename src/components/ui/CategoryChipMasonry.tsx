import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { FilterChip } from '@/components/ui/FilterChip';
import { Spacing } from '@/theme/tokens';

const ROW_GAP = Spacing.two;
const COL_GAP = Spacing.two;
const CHIP_H = 36;
const TRACK_HEIGHT = CHIP_H * 2 + ROW_GAP;

type ChipItem = {
  id: string;
  label: string;
  icon?: string;
};

function estimateWidth(label: string, hasIcon: boolean): number {
  // Approximation légère pour équilibrer les 2 rangées (pas de measure).
  const base = hasIcon ? 36 : 24;
  return Math.max(72, Math.min(168, base + label.length * 7.2));
}

/**
 * Masonry léger de pills — 2 rangées, scroll horizontal, hauteur de track fixe.
 */
export function CategoryChipMasonry({
  categories,
  selectedId,
  onSelect,
  style,
}: {
  categories: ChipItem[] | undefined;
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  style?: object;
}) {
  const { top, bottom } = useMemo(() => {
    const list: ChipItem[] = [
      { id: '__all__', label: 'Toutes' },
      ...(categories ?? []).slice(0, 12),
    ];

    const topRow: ChipItem[] = [];
    const bottomRow: ChipItem[] = [];
    let topW = 0;
    let bottomW = 0;

    list.forEach((item) => {
      const w = estimateWidth(item.label, !!item.icon);
      if (topW <= bottomW) {
        topRow.push(item);
        topW += w + COL_GAP;
      } else {
        bottomRow.push(item);
        bottomW += w + COL_GAP;
      }
    });

    return { top: topRow, bottom: bottomRow };
  }, [categories]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ height: TRACK_HEIGHT }, style]}
      contentContainerStyle={{
        paddingHorizontal: Spacing.four,
        height: TRACK_HEIGHT,
        alignItems: 'flex-start',
      }}
    >
      <View style={{ height: TRACK_HEIGHT, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: COL_GAP, height: CHIP_H, alignItems: 'center' }}>
          {top.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              icon={item.icon}
              height={CHIP_H}
              selected={item.id === '__all__' ? !selectedId : selectedId === item.id}
              onPress={() => onSelect(item.id === '__all__' ? undefined : item.id)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: COL_GAP, height: CHIP_H, alignItems: 'center' }}>
          {bottom.map((item) => (
            <FilterChip
              key={item.id}
              label={item.label}
              icon={item.icon}
              height={CHIP_H}
              selected={item.id === '__all__' ? !selectedId : selectedId === item.id}
              onPress={() => onSelect(item.id === '__all__' ? undefined : item.id)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
