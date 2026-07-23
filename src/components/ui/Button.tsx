import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { textStyle } from '@/theme/typography';
import { Radius } from '@/theme/tokens';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'accent'
  | 'consent'
  | 'link';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  loading,
  icon,
  fullWidth,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useAppTheme();

  if (variant === 'link') {
    return (
      <Pressable
        disabled={disabled || loading}
        onPress={props.onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.7 : 1, alignSelf: fullWidth ? 'stretch' : 'flex-start' },
          style as ViewStyle,
        ]}
        {...props}
      >
        <View>
          {loading ? (
            <ActivityIndicator color={colors.link} size="small" />
          ) : (
            <Text
              style={[
                textStyle('button'),
                {
                  color: colors.link,
                  textDecorationLine: 'underline',
                  textAlign: fullWidth ? 'center' : 'left',
                },
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  const variants: Record<
    Exclude<ButtonVariant, 'link'>,
    { bg: string; text: string; border?: string; borderWidth?: number; radius: number; padV: number; padH: number }
  > = {
    primary: {
      bg: colors.primary,
      text: colors.onPrimary,
      border: colors.primary,
      borderWidth: 0.1,
      radius: Radius.button,
      padV: 6,
      padH: 24,
    },
    secondary: {
      bg: colors.surfaceCard,
      text: colors.ink,
      border: colors.ink,
      borderWidth: 0.1,
      radius: Radius.button,
      padV: 6,
      padH: 24,
    },
    outline: {
      bg: colors.surfaceCard,
      text: colors.ink,
      border: colors.ink,
      borderWidth: 0.1,
      radius: Radius.button,
      padV: 6,
      padH: 24,
    },
    ghost: {
      bg: 'transparent',
      text: colors.body,
      radius: Radius.button,
      padV: 6,
      padH: 24,
    },
    danger: {
      bg: colors.error,
      text: colors.onAccent,
      radius: Radius.button,
      padV: 6,
      padH: 24,
    },
    accent: {
      bg: colors.accent,
      text: colors.onAccent,
      radius: Radius.button,
      padV: 6,
      padH: 24,
    },
    consent: {
      bg: colors.signal,
      text: colors.onAccent,
      radius: Radius.consent,
      padV: 1,
      padH: 30,
    },
  };

  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          minHeight: 44,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          transform: pressed && !isDisabled ? [{ scale: 0.98 }] : undefined,
        } as ViewStyle,
        style as ViewStyle,
      ]}
      {...props}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 44,
          paddingVertical: v.padV,
          paddingHorizontal: v.padH,
          borderRadius: v.radius,
          backgroundColor: v.bg,
          borderWidth: v.borderWidth ?? 0,
          borderColor: v.border,
        }}
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[textStyle('button'), { color: v.text } as TextStyle]}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
