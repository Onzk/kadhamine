import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useAction } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeviceMobile, CreditCard, Warning, CheckCircle, SealCheck } from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/ThemedText';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice } from '@/types';
import { BorderWidth, BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';
import type { PaymentMethod } from '@/types';

const PAYMENT_METHODS: {
  id: PaymentMethod;
  labelKey: string;
  icon: PhosphorIcon;
}[] = [
  { id: 'airtel_money', labelKey: 'payment.airtel', icon: DeviceMobile },
  { id: 'moov_money', labelKey: 'payment.moov', icon: DeviceMobile },
  { id: 'fedapay', labelKey: 'payment.fedapay', icon: CreditCard },
  { id: 'off_platform', labelKey: 'payment.offPlatform', icon: Warning },
];

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      alert({
        title: t('payment.phoneRequiredTitle'),
        message: t('payment.phoneRequiredBody'),
      });
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
          alert({
            title: t('payment.inProgressTitle'),
            message: t('payment.inProgressBody'),
          });
        }
      } else if (result.sandbox) {
        alert({
          title: t('payment.sandboxTitle'),
          message: result.message ?? t('payment.sandboxBody'),
        });
      }

      router.replace('/(tabs)/orders');
    } catch (err) {
      console.error(err);
      alert({
        title: t('common.error'),
        message: t('payment.errorBody'),
      });
    } finally {
      setLoading(false);
    }
  };

  const amount = order?.order.agreedPrice ?? 0;
  const commission = method === 'off_platform' ? 0 : Math.round(amount * commissionRate);
  const total = amount;
  const isOffPlatform = method === 'off_platform';

  if (orderData !== undefined && !order) {
    return (
      <PageScaffold title={t('payment.title')} subtitle={t('payment.subtitle')} showBack>
        <EmptyState
          title={t('orders.empty')}
          description={t('payment.orderNotFound')}
          actionLabel={t('orders.title')}
          onAction={() => router.replace('/(tabs)/orders')}
        />
      </PageScaffold>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('payment.title')}
        subtitle={t('payment.subtitle')}
        showBack
        bottomInset={false}
        contentContainerStyle={{ paddingBottom: Spacing.four }}
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.five }}>
          {/* Amount / order summary */}
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: Radius.lg,
              padding: Spacing.five,
              borderWidth: BorderWidth.default,
              borderColor: colors.borderStrong,
              gap: Spacing.three,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: Spacing.three,
              }}
            >
              <Text style={[textStyle('micro'), { color: colors.muted }]}>{t('payment.amount')}</Text>
              {order?.order.status ? (
                <Badge label={t(`orders.${order.order.status}`)} variant="accent" />
              ) : null}
            </View>

            <Text
              style={{
                fontFamily: fontFamily('display', 'medium'),
                fontSize: 32,
                lineHeight: 36,
                letterSpacing: -0.64,
                color: colors.ink,
              }}
            >
              {formatPrice(total)}
            </Text>

            {order?.order.title ? (
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 15,
                  color: colors.body,
                }}
              >
                {order.order.title}
              </Text>
            ) : null}

            {commission > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingTop: Spacing.three,
                  borderTopWidth: BorderWidth.default,
                  borderTopColor: colors.borderHairline,
                }}
              >
                <Text style={[textStyle('caption'), { color: colors.muted }]}>
                  {t('payment.commission')}
                </Text>
                <Text
                  style={[
                    textStyle('caption'),
                    { color: colors.ink, fontFamily: fontFamily('body', 'medium') },
                  ]}
                >
                  {formatPrice(commission)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Method */}
          <View style={{ gap: Spacing.three }}>
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 16,
                color: colors.ink,
              }}
            >
              {t('payment.method')}
            </Text>

            {PAYMENT_METHODS.map((pm) => {
              const selected = method === pm.id;
              const off = pm.id === 'off_platform';
              const Icon = pm.icon;
              const accent = off ? colors.error : colors.orbit;

              return (
                <Pressable key={pm.id} onPress={() => setMethod(pm.id)} style={{ width: '100%' }}>
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.three,
                        backgroundColor: selected
                          ? off
                            ? colors.error + '12'
                            : colors.orbitWash
                          : colors.surfaceCard,
                        borderRadius: Radius.lg,
                        padding: Spacing.four,
                        borderWidth: BorderWidth.default,
                        borderColor: selected ? accent : colors.borderStrong,
                        opacity: pressed ? 0.92 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: Radius.sm,
                          backgroundColor: selected ? accent + '22' : colors.iconWash,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} color={selected ? accent : colors.ink} weight="duotone" />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={{
                            fontFamily: fontFamily('body', 'medium'),
                            fontSize: 15,
                            color: colors.ink,
                          }}
                        >
                          {t(pm.labelKey)}
                        </Text>
                        {off ? (
                          <Text style={[textStyle('micro'), { color: colors.error }]}>
                            {t('payment.offPlatformShort')}
                          </Text>
                        ) : null}
                      </View>
                      {selected ? (
                        <CheckCircle size={22} color={accent} weight="fill" />
                      ) : null}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Phone */}
          {!isOffPlatform ? (
            <Input
              label={t('payment.phoneLabel')}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder={t('payment.phonePlaceholder')}
              leftIcon={<DeviceMobile size={20} />}
            />
          ) : null}

          {/* Benefit / warning callout */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: Spacing.three,
              backgroundColor: isOffPlatform ? colors.error + '12' : colors.orbitWash,
              borderRadius: Radius.lg,
              padding: Spacing.four,
              borderWidth: BorderWidth.default,
              borderColor: isOffPlatform ? colors.error + '30' : colors.orbit + '40',
            }}
          >
            {isOffPlatform ? (
              <Warning size={20} color={colors.error} weight="fill" />
            ) : (
              <SealCheck size={20} color={colors.orbit} weight="fill" />
            )}
            <View style={{ flex: 1, gap: Spacing.one }}>
              <Text
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 14,
                  color: isOffPlatform ? colors.error : colors.ink,
                }}
              >
                {isOffPlatform ? t('payment.offPlatform') : t('payment.integratedBenefit')}
              </Text>
              <Text style={[textStyle('micro'), { color: isOffPlatform ? colors.error : colors.body }]}>
                {isOffPlatform ? t('payment.offPlatformWarning') : t('payment.integratedBody')}
              </Text>
            </View>
          </View>
        </View>
      </PageScaffold>

      <View
        style={{
          paddingHorizontal: PAGE_H_PAD,
          paddingTop: Spacing.three,
          paddingBottom: Math.max(insets.bottom, Spacing.four),
          borderTopWidth: BorderWidth.default,
          borderTopColor: colors.borderHairline,
          backgroundColor: colors.canvas,
        }}
      >
        <AuthPrimaryButton
          title={isOffPlatform ? t('common.confirm') : t('payment.pay')}
          onPress={handlePay}
          loading={loading}
          tone={isOffPlatform ? 'outline' : 'ink'}
          backgroundColor={!isOffPlatform && isDark ? '#FFFFFF' : undefined}
          textColor={!isOffPlatform && isDark ? BrandColors.ink : undefined}
          flat
        />
      </View>
    </View>
  );
}
