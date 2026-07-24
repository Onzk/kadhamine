import React from 'react';
import { CheckCircle, WarningCircle, Hourglass } from 'phosphor-react-native';
import type { TFunction } from 'i18next';

import type { AppAlertOptions } from '@/providers/AppDialogProvider';

export type PaymentResultKind = 'success' | 'failure' | 'cancelled' | 'sandbox';

/** Bottomsheet résultat paiement — même pattern que la bienvenue. */
export function getPaymentResultAlertOptions(
  kind: PaymentResultKind,
  t: TFunction,
  colors: { orbit: string; success: string; error: string },
  opts?: { onPress?: () => void; premium?: boolean },
): AppAlertOptions {
  const premium = opts?.premium === true;

  if (kind === 'success') {
    return {
      title: t(premium ? 'premium.successTitle' : 'payment.successTitle'),
      message: t(premium ? 'premium.successBody' : 'payment.successBody'),
      messageNumberOfLines: 3,
      buttonLabel: t('payment.resultCta'),
      iconTone: 'success',
      icon: <CheckCircle size={36} color={colors.success} weight="fill" />,
      onPress: opts?.onPress,
    };
  }

  if (kind === 'sandbox') {
    return {
      title: t('payment.sandboxTitle'),
      message: t(premium ? 'premium.sandboxBody' : 'payment.sandboxBody'),
      messageNumberOfLines: 3,
      buttonLabel: t('payment.resultCta'),
      iconTone: 'default',
      icon: <Hourglass size={36} color={colors.orbit} weight="fill" />,
      onPress: opts?.onPress,
    };
  }

  if (kind === 'cancelled') {
    return {
      title: t('payment.cancelledTitle'),
      message: t(premium ? 'premium.cancelledBody' : 'payment.cancelledBody'),
      messageNumberOfLines: 3,
      buttonLabel: t('payment.resultCta'),
      iconTone: 'error',
      icon: <WarningCircle size={36} color={colors.error} weight="fill" />,
      onPress: opts?.onPress,
    };
  }

  return {
    title: t(premium ? 'premium.failureTitle' : 'payment.failureTitle'),
    message: t(premium ? 'premium.failureBody' : 'payment.failureBody'),
    messageNumberOfLines: 3,
    buttonLabel: t('payment.resultCta'),
    iconTone: 'error',
    icon: <WarningCircle size={36} color={colors.error} weight="fill" />,
    onPress: opts?.onPress,
  };
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
