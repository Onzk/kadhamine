import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { CategoryIcon } from '@/lib/categoryIcons';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

interface FilterChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  /** py-2.5 / px-3 — style filtre Recherche. */
  compact?: boolean;
  /** Hauteur fixe (ex. 44 pour aligner avec SearchBar). */
  height?: number;
}

/**
 * Chip filtre/catégorie — pill.
 * compact: padding Tailwind-like py-2.5 (10) / px-3 (12).
 */
/** White on brand blue — `onPrimary` is dark in dark theme (for light primary buttons). */
const ON_ORBIT = '#FFFFFF';

export function FilterChip({
  label,
  icon,
  selected,
  onPress,
  compact = false,
  height,
}: FilterChipProps) {
  const { colors } = useAppTheme();
  const labelColor = selected ? ON_ORBIT : colors.ink;

  return (
    <Pressable onPress={onPress} style={height ? { height } : undefined}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: height ?? undefined,
            paddingHorizontal: compact ? Spacing.three : Spacing.four,
            paddingVertical: height ? 0 : compact ? Spacing.twoHalf : Spacing.two,
            borderRadius: Radius.pill,
            backgroundColor: selected ? colors.orbit : colors.surfaceCard,
            borderWidth: 0.1,
            borderColor: selected ? colors.orbit : colors.border,
            opacity: pressed ? 0.88 : 1,
          }}
        >
          {icon ? (
            <CategoryIcon icon={icon} size={14} color={labelColor} weight="bold" />
          ) : null}
          <Text
            style={[
              textStyle('caption'),
              {
                fontFamily: fontFamily('body', 'medium'),
                color: labelColor,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface ChipRowProps {
  children: React.ReactNode;
  style?: object;
}

/** Ligne de chips horizontale scrollable avec gap régulier. */
export function ChipRow({ children, style }: ChipRowProps) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'nowrap' }, style]}>{children}</View>;
}
