import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useConvex } from 'convex/react';

import { Logo } from '@/components/brand/Logo';
import { Text } from '@/components/ui/ThemedText';
import {
  delay,
  getPaymentResultAlertOptions,
  type PaymentResultKind,
} from '@/lib/paymentAlert';
import {
  claimPendingPayment,
  clearPendingPayment,
  isPendingProcessing,
} from '@/lib/pendingPayment';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export default function PaymentCallbackScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const router = useRouter();
  const convex = useConvex();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const pending = claimPendingPayment();
      if (!pending) {
        // Deep link + replace peuvent monter l’écran deux fois.
        if (isPendingProcessing()) return;
        router.replace('/(tabs)');
        return;
      }

      let kind: PaymentResultKind = 'cancelled';

      try {
        if (pending.purpose === 'order') {
          const orderId = pending.orderId as Id<'orders'>;
          for (let i = 0; i < 12; i++) {
            await delay(700);
            const payment = await convex.query(api.payments.getByOrder, {
              orderId,
            });
            if (payment?.status === 'held' || payment?.status === 'released') {
              kind = 'success';
              break;
            }
            if (payment?.status === 'failed') {
              kind = 'failure';
              break;
            }
          }
          router.replace({
            pathname: '/order/[id]',
            params: { id: pending.orderId, fromPayment: '1' },
          });
        } else {
          for (let i = 0; i < 12; i++) {
            await delay(700);
            const sub = await convex.query(api.subscriptions.getActive, {});
            if (sub && sub.endDate > Date.now()) {
              kind = 'success';
              break;
            }
          }
          router.replace('/(tabs)/profile');
        }

        await delay(450);
        alert(
          getPaymentResultAlertOptions(kind, t, colors, {
            premium: pending.purpose === 'premium',
          }),
        );
      } catch (err) {
        console.error(err);
        alert(
          getPaymentResultAlertOptions('failure', t, colors, {
            premium: pending.purpose === 'premium',
          }),
        );
        router.replace(
          pending.purpose === 'order'
            ? `/order/${pending.orderId}`
            : '/(tabs)/profile',
        );
      } finally {
        clearPendingPayment();
      }
    };

    void run();
  }, [alert, colors, convex, router, t]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvas,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.six,
        paddingHorizontal: Spacing.eight,
      }}
    >
      <Logo size={120} />
      <ActivityIndicator size="large" color={colors.orbit} />
      <Text
        style={[
          textStyle('body'),
          {
            fontFamily: fontFamily('body', 'medium'),
            color: colors.body,
            textAlign: 'center',
          },
        ]}
      >
        {t('payment.pleaseWait')}
      </Text>
    </View>
  );
}
