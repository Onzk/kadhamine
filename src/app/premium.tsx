import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Crown, Check } from 'lucide-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BrandColors } from '@/theme/tokens';
import { api } from '../../convex/_generated/api';

export default function PremiumScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const plans = useQuery(api.subscriptions.getPlans);
  const active = useQuery(api.subscriptions.getActive);
  const subscribe = useMutation(api.subscriptions.subscribe);
  const expireCheck = useMutation(api.subscriptions.expireCheck);

  React.useEffect(() => {
    if (user?._id) expireCheck({ userId: user._id }).catch(() => {});
  }, [user?._id, expireCheck]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await subscribe({ paymentReference: `PREMIUM-${Date.now()}` });
    } finally {
      setLoading(false);
    }
  };

  const plan = plans?.premium;
  const isActive = active && active.endDate > Date.now();

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title={t('profile.premium')} showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: BrandColors.enterpriseGreen,
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: BrandColors.coral + '40',
            }}
          />
          <Crown size={40} color={BrandColors.coral} />
          <Text style={{ fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginTop: 12 }}>
            TalentTchad Premium
          </Text>
          <Text style={{ fontSize: 14, color: '#FFFFFFCC', marginTop: 8, lineHeight: 20 }}>
            Boostez votre visibilité et attirez plus de clients
          </Text>
          {plan && (
            <Text style={{ fontSize: 32, fontWeight: '700', color: BrandColors.coral, marginTop: 16 }}>
              {formatPrice(plan.price)}
              <Text style={{ fontSize: 14, fontWeight: '400' }}> / mois</Text>
            </Text>
          )}
        </View>

        {isActive && (
          <View
            style={{
              backgroundColor: colors.success + '15',
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.success + '40',
            }}
          >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Check size={18} color={colors.success} />
            <Text style={{ color: colors.success, fontWeight: '600', flex: 1 }}>
              Premium actif jusqu'au {new Date(active.endDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          </View>
        )}

        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 16 }}>
          Avantages inclus
        </Text>

        {plan?.benefits.map((benefit) => (
          <View key={benefit} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: BrandColors.coral + '30',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={16} color={BrandColors.enterpriseGreen} />
            </View>
            <Text style={{ fontSize: 15, color: colors.body, flex: 1 }}>{benefit}</Text>
          </View>
        ))}

        {user?.role !== 'provider' ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 24 }}>
            Réservé aux prestataires
          </Text>
        ) : !isActive ? (
          <Button
            title="S'abonner Premium"
            variant="accent"
            onPress={handleSubscribe}
            loading={loading}
            fullWidth
            style={{ marginTop: 24 }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
