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
}

/**
 * Chip filtre/catégorie — inactif: fond blanc + bordure légère ;
 * actif: fond orange corail + texte blanc.
 */
export function FilterChip({ label, icon, selected, onPress }: FilterChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        borderRadius: Radius.pill,
        backgroundColor: selected ? colors.orbit : colors.surfaceCard,
        borderWidth: 1,
        borderColor: selected ? colors.orbit : colors.border,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {icon ? (
        <CategoryIcon
          icon={icon}
          size={14}
          color={selected ? colors.onPrimary : colors.ink}
          weight="bold"
        />
      ) : null}
      <Text
        style={[
          textStyle('caption'),
          {
            fontFamily: fontFamily('body', 'medium'),
            color: selected ? colors.onPrimary : colors.ink,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface ChipRowProps {
  children: React.ReactNode;
  style?: object;
}

/** Ligne de chips horizontale scrollable avec gap régulier. */
export function ChipRow({ children, style }: ChipRowProps) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'nowrap' }, style]}>
      {children}
    </View>
  );
}
