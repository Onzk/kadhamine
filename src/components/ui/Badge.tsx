import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius } from '@/theme/tokens';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'verified' | 'premium' | 'danger' | 'accent' | 'taxonomy';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useAppTheme();

  const styles = {
    default: { bg: colors.surfaceStrong, text: colors.body, border: colors.border },
    verified: { bg: colors.canvasGreenWash, text: colors.success, border: colors.borderHairline },
    premium: { bg: colors.accent, text: colors.onAccent, border: colors.accent },
    danger: { bg: colors.error + '12', text: colors.error, border: colors.error + '30' },
    accent: { bg: colors.canvasBlueWash, text: colors.link, border: colors.borderLight },
    taxonomy: { bg: colors.accentSoft + '50', text: colors.ink, border: colors.accent },
  };

  const s = styles[variant];

  return (
    <View
      style={{
        backgroundColor: s.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.sm,
        borderWidth: 1,
        borderColor: s.border,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={[
          textStyle('micro'),
          { fontFamily: fontFamily('body', 'medium'), color: s.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
