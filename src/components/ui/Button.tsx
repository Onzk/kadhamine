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
import { fontFamily } from '@/theme/typography';
import { Radius } from '@/theme/tokens';

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
    outline: { bg: 'transparent', text: colors.ink, border: colors.border },
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
          height: 52,
          paddingHorizontal: 24,
          borderRadius: Radius.pill,
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
          <Text
            style={
              {
                color: v.text,
                fontSize: 15,
                fontWeight: '600',
                fontFamily: fontFamily('semiBold'),
              } as TextStyle
            }
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
