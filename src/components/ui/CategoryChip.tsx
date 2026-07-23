import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

interface CategoryChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Pill catégorie — actif = ink / texte cream (DESIGN.md). */
export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.five,
          paddingVertical: Spacing.two,
          borderRadius: Radius.pill,
          backgroundColor: selected ? colors.ink : colors.surfaceCard,
          borderWidth: 0.1,
          borderColor: colors.ink,
          marginRight: Spacing.two,
        }}
      >
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
      </View>
    </Pressable>
  );
}
