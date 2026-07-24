import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Platform,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Spacing } from '@/theme/tokens';

/** Aligné sur AuthField `variant="light"` (login). */
const FIELD_RADIUS = 12;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Icône préfixe (alignée login). Ignorée si multiline. */
  leftIcon?: React.ReactNode;
  /** Placeholder obligatoire pour guider la saisie. */
  placeholder: string;
}

export function Input({
  label,
  error,
  leftIcon,
  placeholder,
  style,
  multiline,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const showLeftIcon = !multiline && Boolean(leftIcon);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.orbit
      : colors.borderStrong;

  const fieldTextStyle: TextStyle = {
    flex: 1,
    fontFamily: fontFamily('body'),
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: -0.08,
    paddingVertical: Spacing.three,
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false, textAlignVertical: multiline ? 'top' : 'center' }
      : null),
  };

  return (
    <View style={{ marginBottom: Spacing.five }}>
      {label ? (
        <Text
          style={[
            textStyle('caption'),
            {
              fontFamily: fontFamily('body', 'medium'),
              color: colors.ink,
              marginBottom: Spacing.two,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: colors.surfaceCard,
          borderWidth: 0.1,
          borderColor,
          borderRadius: FIELD_RADIUS,
          paddingHorizontal: Spacing.four,
          minHeight: 52,
          gap: showLeftIcon ? Spacing.twoHalf : 0,
          overflow: 'hidden',
        }}
      >
        {showLeftIcon ? (
          <View style={{ marginRight: 2 }}>
            {React.isValidElement(leftIcon)
              ? React.cloneElement(leftIcon as React.ReactElement<{ color?: string }>, {
                  color: colors.muted,
                })
              : leftIcon}
          </View>
        ) : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          selectionColor={colors.orbit}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[fieldTextStyle, { color: colors.ink }, style]}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[textStyle('micro'), { color: colors.error, marginTop: Spacing.oneHalf }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
