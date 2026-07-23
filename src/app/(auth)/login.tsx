import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
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
  AuthLink,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
  isValidEmail,
} from '@/components/auth/AuthField';
import { AuthHeader, AuthToggleRow } from '@/components/auth/AuthExtras';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const REMEMBER_EMAIL_KEY = 'talenttchad_remember_email';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

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

      router.replace('/');
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
    Alert.alert(
      'Bientôt disponible',
      `La connexion avec ${provider} sera disponible prochainement.`,
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: Spacing.six,
          paddingTop: Spacing.four,
          paddingBottom: Spacing.ten,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          title={t('auth.welcomeBack')}
          subtitle={t('auth.loginSubtitle')}
          onBack={() => (router.canGoBack() ? router.back() : handleGuest())}
        />

        <View style={{ height: Spacing.eight }} />

        {/* Social */}
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <SocialAuthButton label="Google" icon={<GoogleIcon />} onPress={() => handleSocial('Google')} />
          <SocialAuthButton label="Apple" icon={<AppleIcon />} onPress={() => handleSocial('Apple')} />
        </View>

        <AuthDivider label={t('common.or')} />

        {error ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
              backgroundColor: colors.error + '12',
              borderRadius: Radius.lg,
              padding: Spacing.three,
              marginBottom: Spacing.four,
              borderWidth: 1,
              borderColor: colors.error + '30',
            }}
          >
            <WarningCircle size={18} color={colors.error} weight="fill" />
            <Text style={[textStyle('caption'), { color: colors.error, flex: 1 }]}>{error}</Text>
          </View>
        ) : null}

        <AuthField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          onBlur={() => setEmailTouched(true)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="vous@exemple.com"
          leftIcon={<Envelope size={20} color={colors.muted} />}
          error={emailError ? 'Adresse email invalide.' : undefined}
        />

        <AuthField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          isPassword
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          autoComplete="password"
          textContentType="password"
          placeholder="••••••••"
          leftIcon={<Lock size={20} color={colors.muted} />}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        <AuthToggleRow
          value={rememberMe}
          onChange={setRememberMe}
          label={t('auth.rememberMe')}
          right={
            <AuthLink
              title={t('auth.forgotPassword')}
              onPress={() => Alert.alert('Mot de passe oublié', t('auth.forgotPasswordSoon'))}
            />
          }
        />

        <AuthPrimaryButton
          title={t('auth.signIn')}
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
          icon={<ArrowRight size={18} color={colors.onPrimary} weight="bold" />}
        />

        <View style={{ marginTop: Spacing.two }}>
          <AuthGhostButton title={t('auth.continueWithoutAccount')} onPress={handleGuest} />
        </View>

        <View style={{ flex: 1 }} />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: Spacing.eight,
            gap: Spacing.one,
            flexWrap: 'wrap',
          }}
        >
          <Text style={[textStyle('body'), { color: colors.muted }]}>{t('auth.noAccount')}</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={[textStyle('button'), { color: colors.orbit }]}>{t('auth.signUp')}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
