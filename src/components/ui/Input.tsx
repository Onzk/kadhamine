import React from 'react';
import { View, TextInput, Text, Platform, type TextInputProps, type TextStyle } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { getInvertedInputColors, Radius, Spacing } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, style, ...props }: InputProps) {
  const { colors, isDark } = useAppTheme();
  const { background, foreground, placeholder } = getInvertedInputColors(isDark);

  const fieldTextStyle: TextStyle = {
    flex: 1,
    fontFamily: fontFamily('body'),
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: -0.08,
    paddingVertical: Spacing.three,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : null),
  };

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
          backgroundColor: background,
          borderWidth: error ? 0.1 : 0,
          borderColor: error ? colors.error : 'transparent',
          borderRadius: Radius.pill,
          paddingHorizontal: Spacing.five,
          minHeight: 48,
          gap: Spacing.twoHalf,
          overflow: 'hidden',
        }}
      >
        {leftIcon ? (
          <View style={{ marginRight: Spacing.oneHalf }}>
            {React.isValidElement(leftIcon)
              ? React.cloneElement(leftIcon as React.ReactElement<{ color?: string }>, {
                  color: foreground,
                })
              : leftIcon}
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={placeholder}
          selectionColor={foreground}
          style={[
            fieldTextStyle,
            { color: foreground },
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
