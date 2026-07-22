import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useAction } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { DeviceMobile, CreditCard, Warning } from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { BrandColors, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';
import type { PaymentMethod } from '@/types';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: PhosphorIcon }[] = [
  { id: 'airtel_money', label: 'Airtel Money', icon: DeviceMobile },
  { id: 'moov_money', label: 'Moov Money', icon: DeviceMobile },
  { id: 'fedapay', label: 'FedaPay', icon: CreditCard },
  { id: 'off_platform', label: 'Hors plateforme', icon: Warning },
];

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [method, setMethod] = useState<PaymentMethod>('airtel_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const orderData = useQuery(api.orders.listMine, { role: 'client' });
  const order = orderData?.find((o) => o.order._id === orderId);
  const commissionRate = useQuery(api.settings.getCommissionRate) ?? 0.1;
  const initiatePayment = useMutation(api.payments.initiate);
  const createFedapayTransaction = useAction(api.fedapay.createTransaction);

  const handlePay = async () => {
    if (!orderId) return;

    if (method !== 'off_platform' && !phoneNumber.trim()) {
      Alert.alert('Numéro requis', 'Entrez votre numéro Mobile Money');
      return;
    }

    setLoading(true);
    try {
      const paymentId = await initiatePayment({
        orderId: orderId as Id<'orders'>,
        method,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      if (method === 'off_platform') {
        router.replace('/(tabs)/orders');
        return;
      }

      const amount = order?.order.agreedPrice ?? 0;
      const result = await createFedapayTransaction({
        paymentId,
        amount,
        description: order?.order.title ?? 'Commande TalentTchad',
        phoneNumber: phoneNumber.trim(),
        method,
        customerEmail: user?.email ?? undefined,
        customerName: user?.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user?.name ?? undefined,
      });

      if (result.paymentUrl) {
        const browserResult = await WebBrowser.openBrowserAsync(result.paymentUrl);
        if (browserResult.type === 'opened' || browserResult.type === 'cancel') {
          Alert.alert(
            'Paiement en cours',
            'Confirmez le paiement sur votre téléphone. Vous serez notifié une fois validé.',
          );
        }
      } else if (result.sandbox) {
        Alert.alert(
          'Mode sandbox',
          result.message ?? 'Paiement simulé — configurez FEDAPAY_SECRET_KEY pour la production.',
        );
      }

      router.replace('/(tabs)/orders');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Le paiement n\'a pas pu être initié');
    } finally {
      setLoading(false);
    }
  };

  const amount = order?.order.agreedPrice ?? 0;
  const commission = method === 'off_platform' ? 0 : Math.round(amount * commissionRate);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('payment.title')}
        subtitle="Finalisez votre commande en toute sécurité."
        showBack
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>{t('payment.amount')}</Text>
            <Text style={{ fontSize: 32, fontWeight: '700', color: colors.primary, marginTop: 4 }}>
              {formatPrice(amount)}
            </Text>
            {commission > 0 && (
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>
                {t('payment.commission')}: {formatPrice(commission)}
              </Text>
            )}
          </View>

          {method !== 'off_platform' && (
            <Input
              label="Numéro Mobile Money"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="66 XX XX XX"
            />
          )}

          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 12 }}>
            {t('payment.method')}
          </Text>

          {PAYMENT_METHODS.map((pm) => {
            const selected = method === pm.id;
            const isOffPlatform = pm.id === 'off_platform';
            const Icon = pm.icon;
            return (
              <Pressable
                key={pm.id}
                onPress={() => setMethod(pm.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: selected
                    ? isOffPlatform
                      ? colors.error + '10'
                      : colors.primary + '10'
                    : colors.surfaceCard,
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 2,
                  borderColor: selected
                    ? isOffPlatform
                      ? colors.error
                      : colors.primary
                    : colors.border,
                }}
              >
                <View style={{ marginRight: 12 }}>
                  <Icon size={22} color={isOffPlatform ? colors.error : colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
                    {pm.id === 'off_platform' ? t('payment.offPlatform') : pm.label}
                  </Text>
                  {isOffPlatform && (
                    <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                      {t('payment.offPlatformWarning')}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}

          {method !== 'off_platform' && (
            <View
              style={{
                backgroundColor: BrandColors.actionBlue + '10',
                borderRadius: 20,
                padding: 14,
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                {t('payment.integratedBenefit')}
              </Text>
              <Text style={{ fontSize: 12, color: colors.body, marginTop: 6 }}>
                Paiement sécurisé via FedaPay (Airtel Money / Moov Money)
              </Text>
            </View>
          )}
        </View>
      </PageScaffold>

      <View style={{ padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button
          title={method === 'off_platform' ? t('common.confirm') : t('payment.pay')}
          onPress={handlePay}
          loading={loading}
          variant={method === 'off_platform' ? 'outline' : 'primary'}
          fullWidth
        />
      </View>
    </View>
  );
}
