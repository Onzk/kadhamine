import React, { useState } from 'react';
import { View, Text, Alert, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useAction } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { Crown, Check } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BrandColors, Spacing } from '@/theme/tokens';
import { api } from '../../convex/_generated/api';

export default function PremiumScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const plans = useQuery(api.subscriptions.getPlans);
  const active = useQuery(api.subscriptions.getActive);
  const createPending = useMutation(api.subscriptions.createPending);
  const createPremiumTx = useAction(api.fedapay.createPremiumTransaction);
  const expireCheck = useMutation(api.subscriptions.expireCheck);

  React.useEffect(() => {
    if (user?._id) expireCheck({ userId: user._id }).catch(() => {});
  }, [user?._id, expireCheck]);

  const handleSubscribe = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Numéro requis', 'Entrez votre numéro Mobile Money pour payer via FedaPay.');
      return;
    }

    setLoading(true);
    try {
      const subscriptionId = await createPending({});
      const result = await createPremiumTx({
        subscriptionId,
        amount: plans?.premium.price ?? 5000,
        phoneNumber: phoneNumber.trim(),
        method: 'fedapay',
        customerEmail: user?.email ?? undefined,
        customerName: user?.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user?.name ?? undefined,
      });

      if (result.paymentUrl) {
        await WebBrowser.openBrowserAsync(result.paymentUrl);
        Alert.alert(
          'Paiement en cours',
          'Confirmez le paiement. Votre Premium sera activé automatiquement.',
        );
      } else if (result.sandbox) {
        Alert.alert(
          'Mode sandbox',
          result.message ?? 'Premium activé en mode sandbox local.',
        );
      }
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Échec abonnement');
    } finally {
      setLoading(false);
    }
  };

  const plan = plans?.premium;
  const [now] = React.useState(() => Date.now());
  const isActive = Boolean(active && active.endDate > now);

  return (
    <PageScaffold
      title={t('profile.premium')}
      subtitle="Débloquez plus de visibilité et d'avantages."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View
          style={{
            backgroundColor: BrandColors.ink,
            borderRadius: 40,
            padding: 32,
            marginBottom: 24,
            overflow: 'hidden',
          }}
        >
          <Crown size={40} color={BrandColors.gold} weight="fill" />
          <Text style={{ fontSize: 26, fontWeight: '500', color: '#F3F0EE', marginTop: 12, letterSpacing: -0.5 }}>
            TalentTchad Premium
          </Text>
          <Text style={{ fontSize: 14, color: '#D1CDC7', marginTop: 8, lineHeight: 20 }}>
            Boostez votre visibilité et attirez plus de clients
          </Text>
          {plan && (
            <Text style={{ fontSize: 32, fontWeight: '700', color: BrandColors.gold, marginTop: 16 }}>
              {formatPrice(plan.price)}
              <Text style={{ fontSize: 14, fontWeight: '400' }}> / mois</Text>
            </Text>
          )}
        </View>

        {isActive && active ? (
          <View
            style={{
              backgroundColor: colors.success + '15',
              borderRadius: 20,
              padding: 14,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.success + '40',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Check size={18} color={colors.success} />
              <Text style={{ color: colors.success, fontWeight: '600', flex: 1 }}>
                Premium actif jusqu&apos;au {new Date(active.endDate).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 16 }}>
          Avantages inclus
        </Text>

        {plan?.benefits.map((benefit) => (
          <View key={benefit} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 20,
                backgroundColor: BrandColors.gold + '40',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={16} color={BrandColors.ink} weight="bold" />
            </View>
            <Text style={{ fontSize: 15, color: colors.body, flex: 1 }}>{benefit}</Text>
          </View>
        ))}

        {user?.role !== 'provider' ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
            Réservé aux prestataires
          </Text>
        ) : !isActive ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
              Numéro Mobile Money (FedaPay)
            </Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="66 XX XX XX"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 24,
                paddingVertical: 12,
                color: colors.ink,
                marginBottom: 16,
              }}
            />
            <Button
              title="S'abonner Premium"
              variant="primary"
              onPress={handleSubscribe}
              loading={loading}
              fullWidth
            />
          </View>
        ) : null}
      </View>
    </PageScaffold>
  );
}
