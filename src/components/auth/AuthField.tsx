import React from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

interface AuthFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export function AuthField({
  label,
  error,
  isPassword,
  showPassword,
  onTogglePassword,
  style,
  ...props
}: AuthFieldProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ marginBottom: Spacing.five }}>
      <Text style={[textStyle('caption'), { color: colors.muted, marginBottom: Spacing.two }]}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceCard,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: Radius.pill,
          paddingHorizontal: Spacing.six,
          minHeight: 48,
        }}
      >
        <TextInput
          placeholderTextColor={colors.muted}
          secureTextEntry={isPassword && !showPassword}
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
        {isPassword && onTogglePassword && (
          <Pressable onPress={onTogglePassword} hitSlop={8}>
            {showPassword ? (
              <EyeSlash size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={[textStyle('micro'), { color: colors.error, marginTop: Spacing.oneHalf }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

interface AuthPrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthPrimaryButton({ title, onPress, loading, disabled }: AuthPrimaryButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: colors.primary,
        borderRadius: Radius.button,
        borderWidth: 1.5,
        borderColor: colors.primary,
        minHeight: 44,
        paddingVertical: 6,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.5 : pressed ? 0.88 : 1,
      })}
    >
      <Text style={[textStyle('button'), { color: colors.onPrimary }]}>
        {loading ? 'Chargement...' : title}
      </Text>
    </Pressable>
  );
}

export function AuthGhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: 'center' })}>
      <Text style={[textStyle('button'), { color: colors.link, textDecorationLine: 'underline' }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function AuthDivider({ label = 'ou' }: { label?: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.seven, gap: Spacing.three }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderHairline }} />
      <Text style={[textStyle('caption'), { color: colors.muted }]}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.borderHairline }} />
    </View>
  );
}

interface SocialAuthButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export function SocialAuthButton({ label, icon, onPress }: SocialAuthButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.twoHalf,
        minHeight: 44,
        paddingVertical: 12,
        borderRadius: Radius.button,
        borderWidth: 1.5,
        borderColor: colors.ink,
        backgroundColor: colors.surfaceCard,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {icon}
      <Text style={[textStyle('button'), { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 16, fontFamily: fontFamily('body', 'medium'), color: '#4285F4' }}>G</Text>
    </View>
  );
}

export function AppleIcon() {
  const { colors } = useAppTheme();
  return (
    <Text style={{ fontSize: 17, color: colors.ink, lineHeight: 20 }}>&#63743;</Text>
  );
}
