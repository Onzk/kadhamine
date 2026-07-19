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
        borderRadius: selected ? Radius.sm : Radius.xl,
        backgroundColor: selected ? colors.accent : colors.accentSoft + '40',
        borderWidth: 1,
        borderColor: colors.accent,
        opacity: pressed ? 0.88 : 1,
        marginRight: Spacing.two,
      })}
    >
      <Text
        style={[
          textStyle('caption'),
          {
            fontFamily: fontFamily('body', 'medium'),
            color: selected ? colors.onAccent : colors.ink,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
