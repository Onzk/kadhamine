import React from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily } from '@/theme/typography';
import { Radius } from '@/theme/tokens';

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
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 13,
          color: colors.muted,
          marginBottom: 8,
          fontWeight: '500',
          fontFamily: fontFamily('medium'),
        }}
      >
        {label}
      </Text>
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
        <TextInput
          placeholderTextColor={colors.muted}
          secureTextEntry={isPassword && !showPassword}
          style={[
            {
              flex: 1,
              fontSize: 15,
              color: colors.ink,
              paddingVertical: 14,
              fontFamily: fontFamily('regular'),
            },
            style,
          ]}
          {...props}
        />
        {isPassword && onTogglePassword && (
          <Pressable onPress={onTogglePassword} hitSlop={8}>
            {showPassword ? (
              <EyeOff size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.error,
            marginTop: 6,
            fontFamily: fontFamily('regular'),
          }}
        >
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
        borderRadius: Radius.pill,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.5 : pressed ? 0.88 : 1,
      })}
    >
      <Text
        style={{
          color: colors.onPrimary,
          fontSize: 16,
          fontWeight: '600',
          fontFamily: fontFamily('semiBold'),
        }}
      >
        {loading ? 'Chargement...' : title}
      </Text>
    </Pressable>
  );
}

export function AuthGhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: Radius.pill,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <Text
        style={{
          color: colors.ink,
          fontSize: 15,
          fontWeight: '600',
          fontFamily: fontFamily('semiBold'),
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function AuthDivider({ label = 'ou' }: { label?: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 28, gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text
        style={{
          fontSize: 13,
          color: colors.muted,
          fontWeight: '500',
          fontFamily: fontFamily('medium'),
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
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
        gap: 10,
        height: 52,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {icon}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.ink,
          fontFamily: fontFamily('semiBold'),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#4285F4' }}>G</Text>
    </View>
  );
}

export function AppleIcon() {
  const { colors } = useAppTheme();
  return (
    <Text style={{ fontSize: 17, color: colors.ink, lineHeight: 20 }}>&#63743;</Text>
  );
}
