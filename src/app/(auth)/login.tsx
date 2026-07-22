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
import { CaretLeft } from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  AuthGhostButton,
  AuthDivider,
  AuthLink,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
} from '@/components/auth/AuthField';
import { AuthLogoMark, AuthToggleRow } from '@/components/auth/AuthExtras';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const REMEMBER_EMAIL_KEY = 'talenttchad_remember_email';
const SECTION = Spacing.six;

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

  useEffect(() => {
    AsyncStorage.getItem(REMEMBER_EMAIL_KEY).then((stored) => {
      if (stored) {
        setEmail(stored);
        setRememberMe(true);
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs');
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
      setError('Email ou mot de passe incorrect');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.canvas }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: Spacing.six,
          paddingTop: Spacing.five,
          paddingBottom: Spacing.ten,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header — retour uniquement */}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : handleGuest())}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceCard,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.five,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <CaretLeft size={20} color={colors.ink} weight="bold" />
        </Pressable>

        <AuthLogoMark size={64} />

        <Text style={[textStyle('productDisplay'), { color: colors.ink, marginBottom: Spacing.two }]}>
          {t('auth.welcomeBack')}
        </Text>
        <Text
          style={[
            textStyle('body'),
            { color: colors.muted, marginBottom: SECTION, lineHeight: 24 },
          ]}
        >
          {t('auth.loginSubtitle')}
        </Text>

        {/* Social */}
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <SocialAuthButton
            label="Google"
            icon={<GoogleIcon />}
            onPress={() => handleSocial('Google')}
          />
          <SocialAuthButton
            label="Apple"
            icon={<AppleIcon />}
            onPress={() => handleSocial('Apple')}
          />
        </View>

        <AuthDivider label={t('common.or')} />

        {error ? (
          <View
            style={{
              backgroundColor: colors.error + '12',
              borderRadius: 16,
              padding: Spacing.three,
              marginBottom: Spacing.four,
              borderWidth: 1,
              borderColor: colors.error + '30',
            }}
          >
            <Text style={[textStyle('caption'), { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <AuthField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="vous@exemple.com"
        />

        <AuthField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          isPassword
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          autoComplete="password"
          placeholder="••••••••"
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

        <AuthPrimaryButton title={t('auth.signIn')} onPress={handleLogin} loading={loading} />

        <View style={{ marginTop: Spacing.three }}>
          <AuthGhostButton title={t('auth.continueWithoutAccount')} onPress={handleGuest} />
        </View>

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
              <Text style={[textStyle('button'), { color: colors.orbit, textDecorationLine: 'underline' }]}>
                {t('auth.signUp')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
