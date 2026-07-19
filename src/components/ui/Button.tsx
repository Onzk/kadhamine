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
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'link';

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

  if (variant === 'link' || variant === 'secondary') {
    return (
      <Pressable
        disabled={disabled || loading}
        onPress={props.onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, alignSelf: fullWidth ? 'stretch' : 'flex-start' }, style as ViewStyle]}
        {...props}
      >
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
      </Pressable>
    );
  }

  const variants: Record<Exclude<ButtonVariant, 'link' | 'secondary'>, { bg: string; text: string; border?: string; radius: number }> = {
    primary: { bg: colors.primary, text: colors.onPrimary, radius: Radius.pill },
    outline: { bg: 'transparent', text: colors.ink, border: colors.borderHairline, radius: Radius.xl },
    ghost: { bg: 'transparent', text: colors.body, radius: Radius.sm },
    danger: { bg: colors.error, text: '#ffffff', radius: Radius.pill },
    accent: { bg: colors.accent, text: colors.onAccent, radius: Radius.pill },
  };

  const v = variants[variant as Exclude<ButtonVariant, 'link' | 'secondary'>];
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
          minHeight: 44,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: v.radius,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
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
          <Text style={[textStyle('button'), { color: v.text } as TextStyle]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
