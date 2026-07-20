import React from 'react';
import { View, Pressable, type ViewProps } from 'react-native';
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
          borderRadius: Radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? Spacing.four : 0,
          overflow: 'hidden',
          shadowColor: '#101828',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
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
