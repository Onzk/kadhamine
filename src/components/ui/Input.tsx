import React from 'react';
import { View, TextInput, Text, type TextInputProps } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

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
        <Text style={{ color: colors.body, fontSize: 13, fontWeight: '500', marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.canvasSoft,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          minHeight: 48,
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
              paddingVertical: 12,
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}
