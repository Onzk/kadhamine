import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { textStyle } from '@/theme/typography';
import { Spacing } from '@/theme/tokens';

interface EyebrowProps {
  label: string;
  /** Override text color (e.g. cream on ink banners) */
  color?: string;
  dotColor?: string;
}

/** Accent dot + uppercase eyebrow — DESIGN.md identity signal */
export function Eyebrow({ label, color, dotColor }: EyebrowProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        marginBottom: Spacing.two,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: dotColor ?? colors.orbit,
        }}
      />
      <Text style={[textStyle('eyebrow'), { color: color ?? colors.ink }]}>{label}</Text>
    </View>
  );
}
