import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  AuthGhostButton,
  AuthDivider,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
} from '@/components/auth/AuthField';
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
          paddingHorizontal: Spacing.eight,
          paddingTop: Spacing.four,
          paddingBottom: Spacing.nine,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={handleGuest}
          style={{
            alignSelf: 'flex-start',
            marginBottom: Spacing.seven,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.oneHalf,
          }}
        >
          <ArrowLeft size={20} color={colors.ink} />
          <Text style={[textStyle('caption'), { color: colors.muted }]}>
            {t('auth.continueWithoutAccount')}
          </Text>
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: Spacing.eight }}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
        </View>

        <Text style={[textStyle('productDisplay'), { color: colors.ink, marginBottom: Spacing.three }]}>
          {t('auth.welcomeBack')}
        </Text>
        <Text
          style={[
            textStyle('body'),
            { color: colors.body, marginBottom: Spacing.nine, maxWidth: 320 },
          ]}
        >
          {t('auth.loginSubtitle')}
        </Text>

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
              borderRadius: Radius.sm,
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
          onTogglePassword={() => setShowPassword(!showPassword)}
          autoComplete="password"
          placeholder="••••••••"
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.eight,
            marginTop: -4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.surface}
            />
            <Text style={[textStyle('caption'), { color: colors.body }]}>{t('auth.rememberMe')}</Text>
          </View>
          <Pressable onPress={() => Alert.alert('Mot de passe oublié', t('auth.forgotPasswordSoon'))}>
            <Text style={[textStyle('button'), { color: colors.link, textDecorationLine: 'underline' }]}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>
        </View>

        <AuthPrimaryButton title={t('auth.signIn')} onPress={handleLogin} loading={loading} />

        <View style={{ marginTop: Spacing.four }}>
          <AuthGhostButton title={t('auth.continueWithoutAccount')} onPress={handleGuest} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: Spacing.nine,
            gap: Spacing.one,
          }}
        >
          <Text style={[textStyle('body'), { color: colors.muted }]}>{t('auth.noAccount')}</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={[textStyle('button'), { color: colors.link, textDecorationLine: 'underline' }]}>
                {t('auth.signUp')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
