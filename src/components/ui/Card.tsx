import React from 'react';
import { View, Text, Pressable, type ViewProps } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, onPress, padded = true, style, ...props }: CardProps) {
  const { colors } = useAppTheme();
  const content = (
    <View
      style={[
        {
          backgroundColor: colors.surfaceCard,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? 16 : 0,
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
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}
