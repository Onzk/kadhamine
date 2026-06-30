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
import { fontFamily } from '@/theme/typography';

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
          paddingHorizontal: 28,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={handleGuest}
          style={{ alignSelf: 'flex-start', marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={20} color={colors.ink} />
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              fontWeight: '500',
              fontFamily: fontFamily('medium'),
            }}
          >
            {t('auth.continueWithoutAccount')}
          </Text>
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
        </View>

        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            color: colors.ink,
            letterSpacing: -0.5,
            marginBottom: 12,
            fontFamily: fontFamily('bold'),
          }}
        >
          {t('auth.welcomeBack')}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: colors.body,
            lineHeight: 22,
            marginBottom: 36,
            maxWidth: 320,
            fontFamily: fontFamily('regular'),
          }}
        >
          {t('auth.loginSubtitle')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
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
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.error + '30',
            }}
          >
            <Text
              style={{ color: colors.error, fontSize: 13, fontFamily: fontFamily('regular') }}
            >
              {error}
            </Text>
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
            marginBottom: 28,
            marginTop: -4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={colors.surface}
            />
            <Text
              style={{ fontSize: 13, color: colors.body, fontFamily: fontFamily('regular') }}
            >
              {t('auth.rememberMe')}
            </Text>
          </View>
          <Pressable onPress={() => Alert.alert('Mot de passe oublié', t('auth.forgotPasswordSoon'))}>
            <Text
              style={{
                fontSize: 13,
                color: colors.ink,
                fontWeight: '600',
                fontFamily: fontFamily('semiBold'),
              }}
            >
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>
        </View>

        <AuthPrimaryButton title={t('auth.signIn')} onPress={handleLogin} loading={loading} />

        <View style={{ marginTop: 16 }}>
          <AuthGhostButton title={t('auth.continueWithoutAccount')} onPress={handleGuest} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 32,
            gap: 4,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 14, fontFamily: fontFamily('regular') }}>
            {t('auth.noAccount')}
          </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 14,
                  fontWeight: '700',
                  fontFamily: fontFamily('bold'),
                }}
              >
                {t('auth.signUp')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
