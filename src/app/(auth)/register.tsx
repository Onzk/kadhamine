import React, { useState } from 'react';
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
import { useMutation } from 'convex/react';
import { CaretLeft } from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  AuthDivider,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
} from '@/components/auth/AuthField';
import { AuthLogoMark, AuthToggleRow, RolePicker, CityChips } from '@/components/auth/AuthExtras';
import { useAppTheme } from '@/providers/ThemeProvider';
import { MVP_CITIES, MVP_CITY_REGION, type MvpCity } from '@/constants/chad';
import { textStyle } from '@/theme/typography';
import { Spacing } from '@/theme/tokens';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
          paddingHorizontal: Spacing.six,
          paddingTop: Spacing.five,
          paddingBottom: Spacing.ten,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
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

        <AuthLogoMark size={56} />

        <Text style={[textStyle('productDisplay'), { color: colors.ink, marginBottom: Spacing.two }]}>
          {t('auth.createAccount')}
        </Text>
        <Text style={[textStyle('body'), { color: colors.muted, marginBottom: Spacing.four }]}>
          {t('auth.chooseRole')}
        </Text>

        <RolePicker value={role} onChange={setRole} />

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

        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <View style={{ flex: 1 }}>
            <AuthField label="Prénom" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <AuthField label="Nom" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
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

        <CityChips
          cities={MVP_CITIES}
          value={city}
          onChange={(c) => setCity(c as MvpCity)}
        />

        <AuthField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          isPassword
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          placeholder="••••••••"
        />

        <AuthField
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          showPassword={showConfirm}
          onTogglePassword={() => setShowConfirm((v) => !v)}
          placeholder="••••••••"
        />

        <AuthToggleRow
          value={agreed}
          onChange={setAgreed}
          label={
            <Text style={[textStyle('caption'), { color: colors.body, flex: 1 }]}>
              J&apos;accepte les{' '}
              <Text
                style={{
                  color: colors.orbit,
                  textDecorationLine: 'underline',
                  fontFamily: 'SofiaSans_500Medium',
                }}
              >
                Conditions & Politique de confidentialité
              </Text>
            </Text>
          }
        />

        <AuthPrimaryButton title={t('auth.signUp')} onPress={handleRegister} loading={loading} />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: Spacing.eight,
            gap: Spacing.one,
            flexWrap: 'wrap',
          }}
        >
          <Text style={[textStyle('body'), { color: colors.muted }]}>{t('auth.hasAccount')}</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[textStyle('button'), { color: colors.orbit, textDecorationLine: 'underline' }]}>
                {t('auth.signIn')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
