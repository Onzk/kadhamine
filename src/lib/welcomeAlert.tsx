import React from 'react';
import { Confetti, HandWaving } from 'phosphor-react-native';
import type { TFunction } from 'i18next';

import type { AppAlertOptions } from '@/providers/AppDialogProvider';
import type { PendingWelcomeKind } from '@/services/pendingWelcome';

/** Options partagées pour le bottomsheet de bienvenue (accueil + profil). */
export function getWelcomeAlertOptions(
  kind: PendingWelcomeKind,
  t: TFunction,
  orbit: string,
): AppAlertOptions {
  const isLogin = kind === 'login';
  return {
    title: isLogin ? t('auth.welcomeBack') : t('onboarding.welcome'),
    subtitle: isLogin ? t('auth.welcomeLoginSubtitle') : t('auth.welcomeRegisterSubtitle'),
    message: isLogin ? t('auth.welcomeLoginMessage') : t('auth.welcomeRegisterMessage'),
    detail: isLogin ? t('auth.welcomeLoginDetail') : t('auth.welcomeRegisterDetail'),
    buttonLabel: t('auth.welcomeCta'),
    icon: isLogin ? (
      <HandWaving size={36} color={orbit} weight="fill" />
    ) : (
      <Confetti size={36} color={orbit} weight="fill" />
    ),
  };
}
