import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';

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

  const variants: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.onPrimary },
    secondary: { bg: colors.surfaceStrong, text: colors.ink },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', text: colors.body },
    danger: { bg: colors.error, text: '#FFFFFF' },
    accent: { bg: colors.accent, text: colors.onAccent },
  };

  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 48,
          paddingHorizontal: 20,
          borderRadius: 12,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        } as ViewStyle,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={{ color: v.text, fontSize: 15, fontWeight: '600' } as TextStyle}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
