import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { ArrowLeft, Briefcase, UsersThree } from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  AuthDivider,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
} from '@/components/auth/AuthField';
import { Logo } from '@/components/brand/Logo';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { useAppTheme } from '@/providers/ThemeProvider';
import { MVP_CITIES, MVP_CITY_REGION, type MvpCity } from '@/constants/chad';
import { textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

type Role = 'client' | 'provider';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { signIn } = useAuthActions();
  const registerProfile = useMutation(api.users.registerProfile);

  const [role, setRole] = useState<Role>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [city, setCity] = useState<MvpCity>("N'Djamena");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!agreed) {
      setError('Veuillez accepter les conditions');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signIn('password', {
        email: email.trim(),
        password,
        flow: 'signUp',
        name: `${firstName} ${lastName}`,
      });

      await registerProfile({
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city,
        region: MVP_CITY_REGION[city],
      });

      router.replace('/');
    } catch (err) {
      setError("Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = (provider: string) => {
    Alert.alert(
      'Bientôt disponible',
      `L'inscription avec ${provider} sera disponible prochainement.`,
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
          onPress={() => router.back()}
          style={{ alignSelf: 'flex-start', marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Logo size={64} />
        </View>

        <Text style={[textStyle('productDisplay'), { color: colors.ink, marginBottom: Spacing.three }]}>
          {t('auth.createAccount')}
        </Text>
        <Text style={[textStyle('body'), { color: colors.body, marginBottom: Spacing.seven }]}>
          {t('auth.chooseRole')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {(['client', 'provider'] as Role[]).map((r) => {
            const selected = role === r;
            const Icon = r === 'client' ? UsersThree : Briefcase;
            return (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: Radius.lg,
                  borderWidth: 2,
                  borderColor: selected ? colors.ink : colors.border,
                  backgroundColor: selected ? colors.surfaceStrong : colors.surface,
                  alignItems: 'center',
                }}
              >
                <Icon size={24} color={selected ? colors.ink : colors.muted} />
                <Text style={[textStyle('button'), { color: selected ? colors.ink : colors.body, marginTop: Spacing.two }]}>
                  {t(`auth.${r}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
            <Text style={[textStyle('caption'), { color: colors.error }]}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AuthField label="Prénom" value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={{ flex: 1 }}>
            <AuthField label="Nom" value={lastName} onChangeText={setLastName} />
          </View>
        </View>

        <AuthField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="vous@exemple.com"
        />

        <Text style={[textStyle('caption'), { color: colors.muted, marginBottom: 8 }]}>Ville</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {MVP_CITIES.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              selected={city === c}
              onPress={() => setCity(c)}
            />
          ))}
        </View>

        <AuthField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          isPassword
          placeholder="••••••••"
        />

        <AuthField
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          placeholder="••••••••"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <Switch
            value={agreed}
            onValueChange={setAgreed}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={colors.surface}
          />
          <Text style={[textStyle('caption'), { color: colors.body, flex: 1 }]}>
            J&apos;accepte les{' '}
            <Text style={{ fontWeight: '700', color: colors.ink }}>Conditions & Politique de confidentialité</Text>
          </Text>
        </View>

        <AuthPrimaryButton title={t('auth.signUp')} onPress={handleRegister} loading={loading} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 4 }}>
          <Text style={[textStyle('body'), { color: colors.muted }]}>
            {t('auth.hasAccount')}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[textStyle('button'), { color: colors.link, textDecorationLine: 'underline' }]}>
                {t('auth.signIn')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
