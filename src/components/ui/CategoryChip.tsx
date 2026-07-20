import React from 'react';
import { Pressable, Text } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

interface CategoryChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Pill catégorie — actif = fond ink / texte blanc (pattern design.png). */
export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.twoHalf,
        borderRadius: Radius.pill,
        backgroundColor: selected ? colors.ink : colors.surfaceStrong,
        borderWidth: 1,
        borderColor: selected ? colors.ink : colors.border,
        opacity: pressed ? 0.88 : 1,
        marginRight: Spacing.two,
      })}
    >
      <Text
        style={[
          textStyle('caption'),
          {
            fontFamily: fontFamily('body', 'medium'),
            color: selected ? colors.onPrimary : colors.body,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
