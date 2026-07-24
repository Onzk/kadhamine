import React from 'react';
import { Confetti, HandWaving } from 'phosphor-react-native';
import type { TFunction } from 'i18next';

import type { AppAlertOptions } from '@/providers/AppDialogProvider';
import type { PendingWelcomeKind } from '@/services/pendingWelcome';

export type WelcomeAccountRole = 'client' | 'provider';

/** Options partagées pour le bottomsheet de bienvenue (accueil + profil). */
export function getWelcomeAlertOptions(
  kind: PendingWelcomeKind,
  t: TFunction,
  orbit: string,
  role?: WelcomeAccountRole | null,
): AppAlertOptions {
  const isLogin = kind === 'login';
  const account: WelcomeAccountRole =
    role === 'provider' || role === 'client' ? role : 'client';

  const titleKey = isLogin
    ? account === 'provider'
      ? 'auth.welcomeLoginProviderTitle'
      : 'auth.welcomeLoginClientTitle'
    : account === 'provider'
      ? 'auth.welcomeRegisterProviderTitle'
      : 'auth.welcomeRegisterClientTitle';

  const messageKey = isLogin
    ? account === 'provider'
      ? 'auth.welcomeLoginProviderMessage'
      : 'auth.welcomeLoginClientMessage'
    : account === 'provider'
      ? 'auth.welcomeRegisterProviderMessage'
      : 'auth.welcomeRegisterClientMessage';

  return {
    title: t(titleKey),
    message: t(messageKey),
    messageNumberOfLines: 3,
    buttonLabel: t('auth.welcomeCta'),
    icon: isLogin ? (
      <HandWaving size={36} color={orbit} weight="fill" />
    ) : (
      <Confetti size={36} color={orbit} weight="fill" />
    ),
  };
}
