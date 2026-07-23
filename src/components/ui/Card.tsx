import React from 'react';
import { View, Pressable, type ViewProps } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Shadows, Spacing } from '@/theme/tokens';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  variant?: 'default' | 'stone' | 'bordered' | 'elevated' | 'stadium';
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
    elevated: colors.surfaceCard,
    stadium: colors.surfaceCard,
  };

  const radius =
    variant === 'stadium' || variant === 'elevated' ? Radius.stadium : Radius.stadium;

  const shadow = variant === 'elevated' || variant === 'stadium' ? Shadows.elevated : null;

  const content = (
    <View
      style={[
        {
          backgroundColor: backgrounds[variant],
          borderRadius: radius,
          borderWidth: variant === 'bordered' ? 0.1 : 0,
          borderColor: colors.border,
          padding: padded ? Spacing.eight : 0,
          overflow: 'hidden',
          ...(shadow ?? {}),
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
