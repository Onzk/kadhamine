import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { Envelope, Lock, User, ArrowRight, ArrowLeft, WarningCircle } from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  AuthDivider,
  AuthSocialRow,
  SocialAuthButton,
  GoogleIcon,
  AppleIcon,
  PasswordStrengthMeter,
  isValidEmail,
} from '@/components/auth/AuthField';
import {
  AuthStepper,
  AuthToggleRow,
  RolePicker,
  CityChips,
} from '@/components/auth/AuthExtras';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { MVP_CITIES, MVP_CITY_REGION, type MvpCity } from '@/constants/chad';
import { withAuthRetry } from '@/lib/authRetry';
import { setPendingWelcome } from '@/services/pendingWelcome';
import { textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

type Role = 'client' | 'provider';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const router = useRouter();
  const navigation = useNavigation();
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
  /** Autorise quitter l’écran même depuis l’étape 2 (ex. après inscription réussie). */
  const allowLeaveRef = useRef(false);

  const emailError = touched && email.length > 0 && !isValidEmail(email);
  const confirmError = confirmPassword.length > 0 && confirmPassword !== password;

  const step1Valid = firstName.trim().length > 0 && lastName.trim().length > 0 && isValidEmail(email);
  const step2Valid =
    password.length >= 6 && password === confirmPassword && agreed;

  const goBack = useCallback(() => {
    setError('');
    if (step === 2) {
      setStep(1);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/login');
  }, [router, step]);

  /** Bouton système / geste : étape 2 → étape 1 avant de quitter. */
  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        if (step === 2) {
          setError('');
          setStep(1);
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [step]),
  );

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (allowLeaveRef.current || step !== 2) return;
      e.preventDefault();
      setError('');
      setStep(1);
    });
    return unsub;
  }, [navigation, step]);

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

      // Le token auth peut arriver un tick après signUp — retry court.
      await withAuthRetry(() =>
        registerProfile({
          role,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          city,
          region: MVP_CITY_REGION[city],
        }),
      );

      await setPendingWelcome('register');
      allowLeaveRef.current = true;
      router.replace('/');
    } catch (err) {
      setError("Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = (provider: string) => {
    alert({
      title: t('auth.comingSoon'),
      message: t('auth.socialAuthSoon', { provider }),
    });
  };

  return (
    <AuthScaffold
      barTitle={t('auth.register')}
      title={step === 1 ? t('auth.createAccount') : 'Sécurité & localisation'}
      subtitle={
        step === 1
          ? 'Créez votre compte pour commander, discuter et laisser des avis.'
          : 'Choisissez un mot de passe solide et votre ville.'
      }
      onBack={goBack}
    >
      <View style={{ height: Spacing.six }} />

      <AuthStepper step={step} total={2} />

      {error ? (
        <View
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

      {step === 1 ? (
        <>
          <RolePicker value={role} onChange={setRole} label={t('auth.chooseRole')} />

          <AuthField
            variant="light"
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            placeholder="Deby"
            leftIcon={<User size={20} />}
          />

          <AuthField
            variant="light"
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            placeholder="Amina"
            leftIcon={<User size={20} />}
          />

          <AuthField
            variant="light"
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            placeholder="vous@exemple.com"
            leftIcon={<Envelope size={20} />}
            error={emailError ? 'Adresse email invalide.' : undefined}
          />

          <View style={{ height: Spacing.two }} />

          <AuthPrimaryButton
            title="Continuer"
            onPress={goNext}
            disabled={!step1Valid}
            icon={<ArrowRight size={18} weight="bold" />}
          />

          <AuthDivider label={t('common.or')} />

          <AuthSocialRow>
            <SocialAuthButton label="Google" icon={<GoogleIcon />} onPress={() => handleSocial('Google')} />
            <SocialAuthButton label="Apple" icon={<AppleIcon />} onPress={() => handleSocial('Apple')} />
          </AuthSocialRow>
        </>
      ) : (
        <>
          <CityChips cities={MVP_CITIES} value={city} onChange={(c) => setCity(c as MvpCity)} />

          <AuthField
            variant="light"
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            isPassword
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((v) => !v)}
            textContentType="newPassword"
            placeholder="Au moins 6 caractères"
            leftIcon={<Lock size={20} />}
          />
          <PasswordStrengthMeter password={password} />

          <AuthField
            variant="light"
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            showPassword={showConfirm}
            onTogglePassword={() => setShowConfirm((v) => !v)}
            textContentType="password"
            autoComplete="password-new"
            placeholder="••••••••"
            leftIcon={<Lock size={20} />}
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
                minHeight: 44,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.two,
                  paddingVertical: Spacing.three,
                }}
              >
                <ArrowLeft size={16} color={colors.muted} weight="bold" />
                <Text style={[textStyle('button'), { color: colors.muted }]}>Retour</Text>
              </View>
            </Pressable>
          </View>
        </>
      )}

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <Text style={[textStyle('body'), { color: colors.ink }]}>{t('auth.hasAccount')}</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('auth.signIn')}
          hitSlop={8}
          onPress={() => router.replace('/(auth)/login')}
          style={({ pressed }) => [{ minHeight: 44 }, { opacity: pressed ? 0.75 : 1 }]}
        >
          <View style={styles.footerLink}>
            <Text style={[textStyle('button'), { color: colors.orbit }]}>{t('auth.signIn')}</Text>
          </View>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 0.1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.eight,
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  footerLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
