import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'convex/react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { useAppTheme } from '@/providers/ThemeProvider';
import { MVP_CITIES, MVP_CITY_REGION, type MvpCity } from '@/constants/chad';
import { api } from '../../../convex/_generated/api';

type Role = 'client' | 'provider';

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const registerProfile = useMutation(api.users.registerProfile);

  const [role, setRole] = useState<Role>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState<MvpCity>("N'Djamena");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!firstName || !lastName) {
      setError('Veuillez remplir votre nom');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerProfile({
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city,
        region: MVP_CITY_REGION[city],
      });
      router.replace('/');
    } catch (err) {
      setError('Erreur lors de la création du profil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 8 }}>
          Complétez votre profil
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 24 }}>
          {t('auth.chooseRole')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {(['client', 'provider'] as Role[]).map((r) => (
            <CategoryChip
              key={r}
              label={t(`auth.${r}`)}
              selected={role === r}
              onPress={() => setRole(r)}
            />
          ))}
        </View>

        {error ? (
          <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text>
        ) : null}

        <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
        <Input label="Nom" value={lastName} onChangeText={setLastName} />

        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.body, marginBottom: 8 }}>
          Ville
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {MVP_CITIES.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              selected={city === c}
              onPress={() => setCity(c)}
            />
          ))}
        </View>

        <Button title={t('common.confirm')} onPress={handleSubmit} loading={loading} fullWidth />
      </ScrollView>
    </View>
  );
}
