import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors } from '@/theme/tokens';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { signIn } = useAuthActions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signIn('password', { email: email.trim(), password, flow: 'signIn' });
      router.replace('/');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: BrandColors.blue,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 32 }}>🇹🇩</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.ink }}>
              TalentTchad
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted, marginTop: 6 }}>
              {t('auth.welcomeBack')}
            </Text>
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: colors.error + '15',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.error + '40',
              }}
            >
              <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Mail size={18} color={colors.muted} />}
          />

          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            leftIcon={<Lock size={18} color={colors.muted} />}
          />

          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 24 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.muted} />
            ) : (
              <Eye size={18} color={colors.muted} />
            )}
          </Pressable>

          <Button title={t('auth.signIn')} onPress={handleLogin} loading={loading} fullWidth />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>{t('auth.noAccount')}</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                  {t('auth.signUp')}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
