import React from 'react';
import { View, TextInput, Text, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, style, ...props }: InputProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ marginBottom: Spacing.five }}>
      {label && (
        <Text style={[textStyle('caption'), { color: colors.muted, marginBottom: Spacing.two }]}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceStrong,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: Radius.md,
          paddingHorizontal: Spacing.four,
          minHeight: 48,
        }}
      >
        {leftIcon && <View style={{ marginRight: Spacing.twoHalf }}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[
            textStyle('body'),
            {
              flex: 1,
              color: colors.ink,
              paddingVertical: Spacing.three,
              fontFamily: fontFamily('body'),
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text style={[textStyle('micro'), { color: colors.error, marginTop: Spacing.oneHalf }]}>
          {error}
        </Text>
      )}
    </View>
  );
}
