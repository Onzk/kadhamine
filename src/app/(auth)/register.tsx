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
import { Envelope, Lock, User, ArrowRight, ArrowLeft, WarningCircle } from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  AuthDivider,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
  PasswordStrengthMeter,
  isValidEmail,
} from '@/components/auth/AuthField';
import {
  AuthHeader,
  AuthStepper,
  AuthToggleRow,
  RolePicker,
  CityChips,
} from '@/components/auth/AuthExtras';
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

  const [step, setStep] = useState<1 | 2>(1);
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
  const [touched, setTouched] = useState(false);

  const emailError = touched && email.length > 0 && !isValidEmail(email);
  const confirmError = confirmPassword.length > 0 && confirmPassword !== password;

  const step1Valid = firstName.trim().length > 0 && lastName.trim().length > 0 && isValidEmail(email);
  const step2Valid =
    password.length >= 6 && password === confirmPassword && agreed;

  const goBack = () => {
    setError('');
    if (step === 2) {
      setStep(1);
    } else {
      router.back();
    }
  };

  const goNext = () => {
    setTouched(true);
    if (!step1Valid) {
      setError('Renseignez votre nom et une adresse email valide.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegister = async () => {
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!agreed) {
      setError('Veuillez accepter les conditions pour continuer.');
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
          title={step === 1 ? t('auth.createAccount') : 'Sécurité & localisation'}
          subtitle={
            step === 1
              ? 'Créez votre compte pour commander, discuter et laisser des avis.'
              : 'Choisissez un mot de passe solide et votre ville.'
          }
          onBack={goBack}
        />

        <View style={{ height: Spacing.six }} />

        <AuthStepper step={step} total={2} />

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

        {step === 1 ? (
          <>
            <Text
              style={[
                textStyle('caption'),
                { color: colors.ink, marginBottom: Spacing.three, fontFamily: 'SofiaSans_500Medium' },
              ]}
            >
              {t('auth.chooseRole')}
            </Text>
            <RolePicker value={role} onChange={setRole} />

            <View style={{ flexDirection: 'row', gap: Spacing.three }}>
              <View style={{ flex: 1 }}>
                <AuthField
                  label="Prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholder="Amina"
                  leftIcon={<User size={20} color={colors.muted} />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AuthField
                  label="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  placeholder="Deby"
                />
              </View>
            </View>

            <AuthField
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched(true)}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              placeholder="vous@exemple.com"
              leftIcon={<Envelope size={20} color={colors.muted} />}
              error={emailError ? 'Adresse email invalide.' : undefined}
            />

            <View style={{ height: Spacing.two }} />

            <AuthPrimaryButton
              title="Continuer"
              onPress={goNext}
              disabled={!step1Valid}
              icon={<ArrowRight size={18} color={colors.onPrimary} weight="bold" />}
            />

            <AuthDivider label={t('common.or')} />

            <View style={{ flexDirection: 'row', gap: Spacing.three }}>
              <SocialAuthButton label="Google" icon={<GoogleIcon />} onPress={() => handleSocial('Google')} />
              <SocialAuthButton label="Apple" icon={<AppleIcon />} onPress={() => handleSocial('Apple')} />
            </View>
          </>
        ) : (
          <>
            <CityChips cities={MVP_CITIES} value={city} onChange={(c) => setCity(c as MvpCity)} />

            <AuthField
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              isPassword
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
              textContentType="newPassword"
              placeholder="Au moins 6 caractères"
              leftIcon={<Lock size={20} color={colors.muted} />}
            />
            <PasswordStrengthMeter password={password} />

            <AuthField
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              showPassword={showConfirm}
              onTogglePassword={() => setShowConfirm((v) => !v)}
              textContentType="newPassword"
              placeholder="••••••••"
              leftIcon={<Lock size={20} color={colors.muted} />}
              error={confirmError ? 'Les mots de passe ne correspondent pas.' : undefined}
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
                      fontFamily: 'SofiaSans_500Medium',
                    }}
                  >
                    Conditions & Politique de confidentialité
                  </Text>
                </Text>
              }
            />

            <AuthPrimaryButton
              title={t('auth.signUp')}
              onPress={handleRegister}
              loading={loading}
              disabled={!step2Valid}
            />

            <View style={{ marginTop: Spacing.three }}>
              <Pressable
                onPress={goBack}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.two,
                  paddingVertical: Spacing.three,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <ArrowLeft size={16} color={colors.muted} weight="bold" />
                <Text style={[textStyle('button'), { color: colors.muted }]}>Retour</Text>
              </Pressable>
            </View>
          </>
        )}

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
          <Text style={[textStyle('body'), { color: colors.muted }]}>{t('auth.hasAccount')}</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[textStyle('button'), { color: colors.orbit }]}>{t('auth.signIn')}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
