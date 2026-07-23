import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Envelope, Lock, ArrowRight, WarningCircle } from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  AuthGhostButton,
  AuthDivider,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
  isValidEmail,
} from '@/components/auth/AuthField';
import { AuthToggleRow } from '@/components/auth/AuthExtras';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { ForgotPasswordSheet } from '@/components/auth/ForgotPasswordSheet';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

const REMEMBER_EMAIL_KEY = 'talenttchad_remember_email';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(REMEMBER_EMAIL_KEY).then((stored) => {
      if (stored) {
        setEmail(stored);
        setRememberMe(true);
      }
    });
  }, []);

  const emailError = emailTouched && email.length > 0 && !isValidEmail(email);
  const canSubmit = isValidEmail(email) && password.length > 0;

  const handleLogin = async () => {
    setEmailTouched(true);
    if (!canSubmit) {
      setError('Vérifiez votre email et votre mot de passe.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signIn('password', { email: email.trim(), password, flow: 'signIn' });

      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      alert({
        title: t('auth.welcomeBack'),
        message: t('auth.welcomeLoginMessage'),
        buttonLabel: t('common.done'),
        onPress: () => router.replace('/'),
      });
    } catch (err) {
      setError('Email ou mot de passe incorrect.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    router.replace('/(tabs)');
  };

  const handleSocial = (provider: string) => {
    alert({
      title: t('auth.comingSoon'),
      message: t('auth.socialAuthSoon', { provider }),
    });
  };

  const onBack = () => (router.canGoBack() ? router.back() : handleGuest());

  return (
    <>
      <AuthScaffold
        barTitle={t('auth.login')}
        title={t('auth.welcomeBack')}
        subtitle={t('auth.loginSubtitle')}
        onBack={onBack}
      >
        <View style={styles.socialRow}>
          <SocialAuthButton label="Google" icon={<GoogleIcon />} onPress={() => handleSocial('Google')} />
          <SocialAuthButton label="Apple" icon={<AppleIcon />} onPress={() => handleSocial('Apple')} />
        </View>

        <AuthDivider label={t('common.or')} />

        {error ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.error + '12',
                borderColor: colors.error + '30',
              },
            ]}
          >
            <WarningCircle size={18} color={colors.error} weight="fill" />
            <Text style={[textStyle('caption'), { color: colors.error, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        <AuthField
          variant="light"
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          onBlur={() => setEmailTouched(true)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="vous@exemple.com"
          leftIcon={<Envelope size={20} />}
          error={emailError ? 'Adresse email invalide.' : undefined}
          accessibilityLabel={t('auth.email')}
        />

        <AuthField
          variant="light"
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          isPassword
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          autoComplete="password"
          textContentType="password"
          placeholder="••••••••"
          leftIcon={<Lock size={20} />}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
          accessibilityLabel={t('auth.password')}
        />

        <AuthToggleRow
          value={rememberMe}
          onChange={setRememberMe}
          label={t('auth.rememberMe')}
          right={
            <Pressable
              onPress={() => setForgotPasswordVisible(true)}
              accessibilityRole="link"
              accessibilityLabel={t('auth.forgotPassword')}
              hitSlop={8}
              style={({ pressed }) => [{ minHeight: 48 }, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.forgotLink}>
                <Text
                  style={[
                    textStyle('caption'),
                    { color: colors.link, fontFamily: fontFamily('body', 'medium') },
                  ]}
                >
                  {t('auth.forgotPassword')}
                </Text>
              </View>
            </Pressable>
          }
        />

        <View style={styles.actions}>
          <AuthPrimaryButton
            tone="ink"
            title={t('auth.signIn')}
            onPress={handleLogin}
            loading={loading}
            disabled={!canSubmit}
            icon={<ArrowRight size={18} weight="bold" />}
          />

          <AuthGhostButton title={t('auth.continueWithoutAccount')} onPress={handleGuest} />
        </View>

        <View style={styles.footer}>
          <Text style={[textStyle('body'), { color: colors.ink }]}>{t('auth.noAccount')}</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t('auth.signUp')}
              hitSlop={8}
              style={({ pressed }) => [{ minHeight: 44 }, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.footerLink}>
                <Text
                  style={[
                    textStyle('button'),
                    { color: colors.orbit, fontFamily: fontFamily('body', 'medium') },
                  ]}
                >
                  {t('auth.signUp')}
                </Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </AuthScaffold>

      <ForgotPasswordSheet
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
        initialEmail={email}
      />
    </>
  );
}

const styles = StyleSheet.create({
  socialRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'stretch',
    gap: Spacing.three,
    marginTop: Spacing.six,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 0.1,
  },
  forgotLink: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: Spacing.one,
  },
  actions: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.eight,
    paddingTop: Spacing.four,
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  footerLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
