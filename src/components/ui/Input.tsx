import React from 'react';
import { View, TextInput, Text, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily } from '@/theme/typography';
import { Radius } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, style, ...props }: InputProps) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-4">
      {label && (
        <Text
          style={{
            color: colors.muted,
            fontSize: 13,
            fontWeight: '500',
            marginBottom: 8,
            fontFamily: fontFamily('medium'),
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: Radius.pill,
          paddingHorizontal: 16,
          minHeight: 52,
        }}
      >
        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.muted}
          style={[
            {
              flex: 1,
              color: colors.ink,
              fontSize: 15,
              paddingVertical: 14,
              fontFamily: fontFamily('regular'),
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text
          style={{
            color: colors.error,
            fontSize: 12,
            marginTop: 6,
            fontFamily: fontFamily('regular'),
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
