import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'verified' | 'premium' | 'danger' | 'accent';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useAppTheme();

  const styles = {
    default: { bg: colors.surfaceStrong, text: colors.body },
    verified: { bg: colors.primary + '20', text: colors.primary },
    premium: { bg: colors.accent, text: colors.onAccent },
    danger: { bg: colors.error + '20', text: colors.error },
    accent: { bg: colors.accent + '30', text: colors.onAccent },
  };

  const s = styles[variant];

  return (
    <View
      style={{
        backgroundColor: s.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 9999,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: s.text }}>{label}</Text>
    </View>
  );
}
