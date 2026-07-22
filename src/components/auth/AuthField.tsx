import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeSlash, AppleLogo, GoogleLogo } from 'phosphor-react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Shadows, Spacing } from '@/theme/tokens';

interface AuthFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

/** Champ auth — label gras, focus bordure orange, œil password. */
export function AuthField({
  label,
  error,
  isPassword,
  showPassword,
  onTogglePassword,
  style,
  onFocus,
  onBlur,
  ...props
}: AuthFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: Spacing.five }}>
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceCard,
          borderWidth: focused || error ? 1.5 : 1,
          borderColor: error ? colors.error : focused ? colors.orbit : colors.border,
          borderRadius: 16,
          paddingHorizontal: Spacing.four,
          minHeight: 52,
        }}
      >
        <TextInput
          placeholderTextColor={colors.muted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
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
        {isPassword ? (
          <Pressable
            onPress={onTogglePassword}
            hitSlop={10}
            style={{ padding: 4 }}
          >
            {showPassword ? (
              <EyeSlash size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </Pressable>
        ) : null}
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

/** CTA principal — orange corail pleine largeur. */
export function AuthPrimaryButton({ title, onPress, loading, disabled }: AuthPrimaryButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: colors.orbit,
        borderRadius: Radius.pill,
        minHeight: 52,
        paddingHorizontal: Spacing.six,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.5 : pressed ? 0.9 : 1,
        ...Shadows.nav,
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={[textStyle('button'), { color: colors.onPrimary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function AuthGhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: 'center', paddingVertical: Spacing.two })}
    >
      <Text style={[textStyle('caption'), { color: colors.muted }]}>{title}</Text>
    </Pressable>
  );
}

export function AuthLink({ title, onPress }: { title: string; onPress?: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <Text
        style={[
          textStyle('button'),
          { color: colors.orbit, textDecorationLine: 'underline' },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function AuthDivider({ label = 'ou' }: { label?: string }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.six,
        gap: Spacing.three,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={[textStyle('caption'), { color: colors.muted }]}>{label}</Text>
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
        gap: Spacing.two,
        minHeight: 48,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceCard,
        opacity: pressed ? 0.88 : 1,
        ...Shadows.nav,
      })}
    >
      {icon}
      <Text style={[textStyle('button'), { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** Logo Google coloré officiel (SVG). */
export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/** Logo Apple (Phosphor) — fiable cross-platform. */
export function AppleIcon({ size = 20 }: { size?: number }) {
  const { colors } = useAppTheme();
  return <AppleLogo size={size} color={colors.ink} weight="fill" />;
}

/** Fallback si GoogleLogo phosphor est préféré ailleurs. */
export function GoogleGlyph({ size = 18 }: { size?: number }) {
  return <GoogleLogo size={size} color="#4285F4" weight="bold" />;
}
