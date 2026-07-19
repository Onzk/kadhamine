import React from 'react';
import { View, Text, Pressable, type ViewProps } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  variant?: 'default' | 'stone' | 'bordered';
}

export function Card({
  children,
  onPress,
  padded = true,
  variant = 'default',
  style,
  ...props
}: CardProps) {
  const { colors } = useAppTheme();

  const backgrounds = {
    default: colors.surface,
    stone: colors.surfaceCard,
    bordered: colors.surface,
  };

  const content = (
    <View
      style={[
        {
          backgroundColor: backgrounds[variant],
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? Spacing.four : 0,
          overflow: 'hidden',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}
