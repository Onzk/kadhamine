import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function AdminSettingsScreen() {
  const { colors } = useAppTheme();
  const platform = useQuery(api.settings.getPlatform);
  const updateRate = useMutation(api.settings.updateCommissionRate);
  const [draftPercent, setDraftPercent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const serverPercent =
    platform != null ? String(Math.round(platform.commissionRate * 100)) : '10';
  const percent = draftPercent ?? serverPercent;

  const handleSave = async () => {
    const value = Number(percent.replace(',', '.'));
    if (Number.isNaN(value) || value < 0 || value > 100) {
      Alert.alert('Valeur invalide', 'Entrez un pourcentage entre 0 et 100.');
      return;
    }
    setLoading(true);
    try {
      await updateRate({ rate: value / 100 });
      setDraftPercent(null);
      Alert.alert('Enregistré', `Commission mise à jour : ${value} %`);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageScaffold
      title="Paramètres plateforme"
      subtitle="Configurez les règles et commissions."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 8 }}>
          Commission sur les paiements in-app
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
          Taux prélevé sur chaque transaction FedaPay / Mobile Money (hors plateforme = 0 %).
        </Text>
        <Input
          label="Taux (%)"
          value={percent}
          onChangeText={setDraftPercent}
          keyboardType="decimal-pad"
          placeholder="10"
        />
        {platform && (
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
            Actuel : {Math.round(platform.commissionRate * 100)} % · Devise {platform.currency}
          </Text>
        )}
        <Button title="Enregistrer" onPress={handleSave} loading={loading} fullWidth />
      </View>
    </PageScaffold>
  );
}
