import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'convex/react';
import { User } from 'phosphor-react-native';

import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import {
  AuthBrandMark,
  AuthLogoutButton,
  CityChips,
  RolePicker,
} from '@/components/auth/AuthExtras';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { MVP_CITIES, MVP_CITY_REGION, type MvpCity } from '@/constants/chad';
import { withAuthRetry } from '@/lib/authRetry';
import { clearOnboardingSeen } from '@/services/onboardingStorage';
import { setPendingWelcome } from '@/services/pendingWelcome';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

type Role = 'client' | 'provider';

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { confirm } = useAppDialog();
  const router = useRouter();
  const registerProfile = useMutation(api.users.registerProfile);

  const [role, setRole] = useState<Role>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState<MvpCity>("N'Djamena");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    confirm({
      title: t('auth.logout'),
      message: t('profile.logoutConfirm'),
      confirmLabel: t('auth.logout'),
      destructive: true,
      onConfirm: async () => {
        await clearOnboardingSeen();
        await signOut();
        router.replace('/(auth)/onboarding');
      },
    });
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName) {
      setError('Veuillez remplir votre nom');
      return;
    }
    if (authLoading) {
      setError('Connexion en cours, réessayez dans un instant…');
      return;
    }
    if (!isAuthenticated) {
      setError('Session expirée. Reconnectez-vous pour continuer.');
      return;
    }

    setLoading(true);
    setError('');
    try {
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
      router.replace('/');
    } catch (err) {
      setError('Erreur lors de la création du profil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      barTitle={t('auth.completeProfileTitle')}
      title={t('auth.completeProfileTitle')}
      subtitle={t('auth.completeProfileSubtitle')}
      showLogo={false}
      leading={<AuthBrandMark />}
      trailing={<AuthLogoutButton onPress={handleLogout} />}
    >
      <View style={styles.body}>
        <RolePicker value={role} onChange={setRole} />

        {error ? (
          <Text style={[textStyle('caption'), { color: colors.error, marginBottom: Spacing.three }]}>
            {error}
          </Text>
        ) : null}

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
          label="Nom"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          placeholder="Deby"
          leftIcon={<User size={20} />}
        />

        <CityChips cities={MVP_CITIES} value={city} onChange={(c) => setCity(c as MvpCity)} />

        <AuthPrimaryButton
          title={t('common.confirm')}
          onPress={handleSubmit}
          loading={loading}
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    marginTop: Spacing.six,
  },
});
