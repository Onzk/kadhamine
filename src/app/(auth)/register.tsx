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
import { useMutation } from 'convex/react';
import { Mail, Lock, User, Briefcase, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/providers/ThemeProvider';
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
  const [city, setCity] = useState("N'Djamena");
  const [region, setRegion] = useState('ndjamena');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires');
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
        region,
      });

      router.replace('/');
    } catch (err) {
      setError('Erreur lors de l\'inscription. Cet email est peut-être déjà utilisé.');
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
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>
            {t('auth.createAccount')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24 }}>
            {t('auth.chooseRole')}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            {(['client', 'provider'] as Role[]).map((r) => {
              const selected = role === r;
              const Icon = r === 'client' ? Users : Briefcase;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary + '10' : colors.surfaceCard,
                    alignItems: 'center',
                  }}
                >
                  <Icon size={24} color={selected ? colors.primary : colors.muted} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: selected ? colors.primary : colors.body,
                      marginTop: 8,
                    }}
                  >
                    {t(`auth.${r}`)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
                    {t(`auth.${r}Desc`)}
                  </Text>
                </Pressable>
              );
            })}
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

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                leftIcon={<User size={18} color={colors.muted} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Nom" value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color={colors.muted} />}
          />

          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={18} color={colors.muted} />}
          />

          <Input
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon={<Lock size={18} color={colors.muted} />}
          />

          <Button
            title={t('auth.signUp')}
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>{t('auth.hasAccount')}</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                  {t('auth.signIn')}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
