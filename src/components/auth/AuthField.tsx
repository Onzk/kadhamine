import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { Eye, EyeSlash, AppleLogo, GoogleLogo, Check } from 'phosphor-react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { getInvertedInputColors, Radius, Shadows, Spacing } from '@/theme/tokens';

/** Light auth fields use 8–12 radius (not pill / not design-system md=20). */
const LIGHT_FIELD_RADIUS = 12;

/** Validation email simple mais robuste. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Score de robustesse mot de passe (0–4). */
export function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, score);
}

export type AuthFieldVariant = 'light' | 'inverted';

interface AuthFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  /** Icône préfixe (alignée login). Ignorée si multiline. */
  leftIcon?: React.ReactNode;
  /** Placeholder obligatoire pour guider la saisie. */
  placeholder: string;
  /** `light` = surfaceCard + thin border (login / app). `inverted` = contraste inversé (legacy). */
  variant?: AuthFieldVariant;
}

/** Champ auth — label, icône, focus, validation, œil password. */
export function AuthField({
  label,
  error,
  hint,
  isPassword,
  showPassword,
  onTogglePassword,
  leftIcon,
  variant = 'light',
  style,
  multiline,
  onFocus,
  onBlur,
  value,
  ...props
}: AuthFieldProps) {
  const { colors, isDark } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const inverted = getInvertedInputColors(isDark);
  const isLight = variant === 'light';
  const showLeftIcon = !multiline && Boolean(leftIcon);

  const scheme = isLight
    ? {
        background: colors.surfaceCard,
        foreground: colors.ink,
        placeholder: colors.muted,
        icon: colors.muted,
        borderWidth: 0.1,
        borderColor: error
          ? colors.error
          : focused
            ? colors.orbit
            : colors.borderStrong,
        borderRadius: LIGHT_FIELD_RADIUS,
      }
    : {
        background: inverted.background,
        foreground: inverted.foreground,
        placeholder: inverted.placeholder,
        icon: inverted.foreground,
        borderWidth: error ? 0.1 : 0,
        borderColor: error ? colors.error : 'transparent',
        borderRadius: Radius.pill,
      };

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
    <View style={styles.fieldWrap}>
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
        style={[
          styles.fieldRow,
          multiline && styles.fieldRowMultiline,
          showLeftIcon && styles.fieldRowWithIcon,
          {
            backgroundColor: scheme.background,
            borderWidth: scheme.borderWidth,
            borderColor: scheme.borderColor,
            borderRadius: scheme.borderRadius,
          },
        ]}
      >
        {showLeftIcon ? (
          <View style={styles.leftIcon}>
            {React.isValidElement(leftIcon)
              ? React.cloneElement(leftIcon as React.ReactElement<{ color?: string }>, {
                  color: scheme.icon,
                })
              : leftIcon}
          </View>
        ) : null}
        <TextInput
          value={value}
          placeholderTextColor={scheme.placeholder}
          selectionColor={isLight ? colors.orbit : scheme.foreground}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[fieldTextStyle, { color: scheme.foreground }, style]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={onTogglePassword}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            style={styles.eyeButton}
          >
            <View style={styles.eyeButtonInner}>
              {showPassword ? (
                <EyeSlash size={22} color={scheme.icon} weight="bold" />
              ) : (
                <Eye size={22} color={scheme.icon} weight="bold" />
              )}
            </View>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[textStyle('micro'), { color: colors.error, marginTop: Spacing.oneHalf }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[textStyle('micro'), { color: colors.slate, marginTop: Spacing.oneHalf }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

interface PasswordStrengthMeterProps {
  password: string;
}

/** Barre de force du mot de passe — 4 segments + label. */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { colors } = useAppTheme();
  const score = useMemo(() => passwordScore(password), [password]);

  if (!password) return null;

  const scale = [colors.error, colors.error, colors.warning, colors.orbit, colors.success];
  const labels = ['Trop court', 'Faible', 'Moyen', 'Fort', 'Excellent'];
  const activeColor = scale[score];

  return (
    <View style={{ marginTop: -Spacing.two, marginBottom: Spacing.four }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < score ? activeColor : colors.border,
            }}
          />
        ))}
      </View>
      <Text
        style={[
          textStyle('micro'),
          { color: activeColor, marginTop: Spacing.oneHalf, fontFamily: fontFamily('body', 'medium') },
        ]}
      >
        Sécurité : {labels[score]}
      </Text>
    </View>
  );
}

export type AuthPrimaryButtonTone = 'orbit' | 'ink' | 'outline' | 'danger';

interface AuthPrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  /** `ink` = full black/dark CTA (login). `orbit` = brand blue (default). */
  tone?: AuthPrimaryButtonTone;
  /** Désactive ombre / élévation (bottom sheets). */
  flat?: boolean;
  /** Remplit un slot flex (rangée 50/50). */
  fill?: boolean;
  /** Override du fond (ex. CTA inversé en mode nuit). */
  backgroundColor?: string;
  /** Override du libellé / icône. */
  textColor?: string;
}

/** CTA principal — pleine largeur, contraste élevé. */
export function AuthPrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
  tone = 'orbit',
  flat = false,
  fill = false,
  backgroundColor,
  textColor,
}: AuthPrimaryButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;
  const isInk = tone === 'ink';
  const isOutline = tone === 'outline';
  const isDanger = tone === 'danger';

  const bg = isDisabled
    ? colors.iconWash
    : (backgroundColor ??
      (isOutline
        ? colors.iconWash
        : isDanger
          ? colors.error
          : isInk
            ? colors.ink
            : colors.orbit));
  const fg = isDisabled
    ? colors.muted
    : (textColor ??
      (isOutline
        ? colors.ink
        : isDanger
          ? colors.onAccent
          : isInk
            ? colors.onPrimary
            : colors.onOrbit));
  const borderColor =
    isDisabled || isOutline ? colors.borderStrong : isDanger ? colors.error : 'transparent';
  const borderWidth = isDisabled || isOutline ? 0.1 : isDanger ? 0.1 : 0;
  const showShadow = !flat && !isDisabled && !isOutline;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => ({
        ...(fill ? { flex: 1 } : null),
        alignSelf: 'stretch',
        width: '100%',
        minWidth: 0,
        minHeight: 54,
        opacity: pressed && !isDisabled ? 0.92 : 1,
        transform: [{ scale: pressed && !isDisabled ? 0.99 : 1 }],
      })}
    >
      <View
        style={[
          styles.primaryButtonInner,
          {
            backgroundColor: bg,
            borderWidth,
            borderColor,
            ...(showShadow ? Shadows.nav : null),
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            <Text
              style={[
                textStyle('button'),
                {
                  color: fg,
                  fontFamily: fontFamily('body', 'medium'),
                },
              ]}
            >
              {title}
            </Text>
            {icon
              ? React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
                    color: fg,
                  })
                : icon
              : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

export function AuthGhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  const [pressed, setPressed] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        alignSelf: 'stretch',
        minHeight: 48,
        opacity: pressed ? 0.85 : 1,
      }}
    >
      <View
        style={{
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: Spacing.three,
          paddingHorizontal: Spacing.four,
          borderRadius: Radius.lg,
          backgroundColor: pressed ? colors.surfaceStrong : 'transparent',
        }}
      >
        <Text
          style={[
            textStyle('button'),
            {
              color: colors.link,
              fontFamily: fontFamily('body', 'medium'),
              textAlign: 'center',
            },
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

export function AuthLink({ title, onPress }: { title: string; onPress?: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={title}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: 44,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={{ minHeight: 44, justifyContent: 'center', paddingVertical: Spacing.one }}>
        <Text style={[textStyle('caption'), { color: colors.link, fontFamily: fontFamily('body', 'medium') }]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

export function AuthDivider({ label = 'ou' }: { label?: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: colors.borderStrong }]} />
      <Text
        style={[
          textStyle('caption'),
          {
            color: colors.slate,
            fontFamily: fontFamily('body', 'medium'),
            paddingHorizontal: Spacing.one,
          },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.dividerLine, { backgroundColor: colors.borderStrong }]} />
    </View>
  );
}

interface SocialAuthButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

/** Rangée Google + Apple — 50 / 50 de la largeur disponible. */
export function AuthSocialRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.socialRow, style]}>{children}</View>;
}

export function SocialAuthButton({ label, icon, onPress }: SocialAuthButtonProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.socialSlot}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Continuer avec ${label}`}
        style={({ pressed }) => ({
          flex: 1,
          alignSelf: 'stretch',
          width: '100%',
          minHeight: 52,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={[
            styles.socialButtonInner,
            {
              borderColor: colors.borderStrong,
              backgroundColor: colors.surfaceCard,
            },
          ]}
        >
          <View style={styles.socialIcon}>{icon}</View>
          <Text
            style={[
              textStyle('button'),
              {
                color: colors.ink,
                fontFamily: fontFamily('body', 'medium'),
                flexShrink: 1,
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
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

/** Petite ligne de bénéfice (checklist marketing auth). */
export function AuthBenefit({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: colors.orbit + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={11} color={colors.orbit} weight="bold" />
      </View>
      <Text style={[textStyle('micro'), { color: colors.slate }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: Spacing.four,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    minHeight: 52,
    overflow: 'hidden',
  },
  fieldRowMultiline: {
    alignItems: 'flex-start',
  },
  fieldRowWithIcon: {
    gap: Spacing.twoHalf,
  },
  leftIcon: {
    marginRight: 2,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
  },
  eyeButtonInner: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -Spacing.two,
  },
  primaryButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    minHeight: 54,
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.six,
    gap: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth < 1 ? 1 : StyleSheet.hairlineWidth,
    minHeight: 1,
  },
  socialRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'stretch',
    gap: Spacing.three,
  },
  socialSlot: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  socialButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 52,
    width: '100%',
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 0.1,
  },
  socialIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
