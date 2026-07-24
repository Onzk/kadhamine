import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useAction } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { Crown, Check, DeviceMobile } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/ThemedText';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice } from '@/types';
import { BorderWidth, BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';

/** Intentional high-contrast hero — ink surface with cream type (Commander-style). */
const HERO_INK = BrandColors.ink;
const HERO_CREAM = BrandColors.canvas;

export default function PremiumScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const heroBg = isDark ? colors.surfaceDark : HERO_INK;
  const heroTitle = HERO_CREAM;
  const heroBody = isDark ? 'rgba(243,240,238,0.72)' : BrandColors.dust;
  const heroBorder = isDark ? colors.borderHairline : 'transparent';

  const plans = useQuery(api.subscriptions.getPlans);
  const active = useQuery(api.subscriptions.getActive, user?._id ? {} : 'skip');
  const createPending = useMutation(api.subscriptions.createPending);
  const createPremiumTx = useAction(api.fedapay.createPremiumTransaction);
  const expireCheck = useMutation(api.subscriptions.expireCheck);

  React.useEffect(() => {
    if (user?._id) expireCheck({ userId: user._id }).catch(() => {});
  }, [user?._id, expireCheck]);

  const handleSubscribe = async () => {
    if (!phoneNumber.trim()) {
      alert({
        title: t('payment.phoneRequiredTitle'),
        message: t('premium.phoneRequiredBody'),
      });
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
        alert({
          title: t('payment.inProgressTitle'),
          message: t('premium.inProgressBody'),
        });
      } else if (result.sandbox) {
        alert({
          title: t('payment.sandboxTitle'),
          message: result.message ?? t('premium.sandboxBody'),
        });
      }
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('premium.errorBody'),
      });
    } finally {
      setLoading(false);
    }
  };

  const plan = plans?.premium;
  const [now] = React.useState(() => Date.now());
  const isActive = Boolean(active && active.endDate > now);

  const endDateLabel = active
    ? new Date(active.endDate).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('profile.premium')}
        subtitle={t('premium.subtitle')}
        showBack
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, Spacing.twelve),
        }}
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.five }}>
          {/* Hero */}
          <View
            style={{
              backgroundColor: heroBg,
              borderRadius: Radius.lg,
              padding: Spacing.six,
              overflow: 'hidden',
              borderWidth: isDark ? BorderWidth.default : BorderWidth.none,
              borderColor: heroBorder,
              gap: Spacing.three,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: Radius.sm,
                backgroundColor: BrandColors.gold + '33',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={28} color={BrandColors.gold} weight="fill" />
            </View>
            <Text
              style={{
                fontFamily: fontFamily('display', 'medium'),
                fontSize: 26,
                lineHeight: 30,
                letterSpacing: -0.5,
                color: heroTitle,
              }}
            >
              {t('premium.heroTitle')}
            </Text>
            <Text style={[textStyle('caption'), { color: heroBody, lineHeight: 20 }]}>
              {t('premium.heroBody')}
            </Text>
            {plan ? (
              <Text
                style={{
                  fontFamily: fontFamily('display', 'medium'),
                  fontSize: 32,
                  lineHeight: 36,
                  letterSpacing: -0.64,
                  color: BrandColors.gold,
                  marginTop: Spacing.one,
                }}
              >
                {formatPrice(plan.price)}
                <Text style={[textStyle('caption'), { color: heroBody }]}>
                  {' '}
                  {t('premium.perMonth')}
                </Text>
              </Text>
            ) : null}
          </View>

          {isActive && active ? (
            <View
              style={{
                backgroundColor: colors.success + '15',
                borderRadius: Radius.lg,
                padding: Spacing.four,
                borderWidth: BorderWidth.default,
                borderColor: colors.success + '40',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <Check size={18} color={colors.success} weight="bold" />
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 14,
                    color: colors.success,
                    flex: 1,
                  }}
                >
                  {t('premium.activeUntil', { date: endDateLabel })}
                </Text>
              </View>
            </View>
          ) : null}

          <Text
            style={{
              fontFamily: fontFamily('body', 'medium'),
              fontSize: 17,
              color: colors.ink,
            }}
          >
            {t('premium.benefitsTitle')}
          </Text>

          <View style={{ gap: Spacing.three }}>
            {plan?.benefits.map((benefit) => (
              <View
                key={benefit}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.three,
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.lg,
                  padding: Spacing.four,
                  borderWidth: BorderWidth.default,
                  borderColor: colors.borderStrong,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: Radius.sm,
                    backgroundColor: BrandColors.gold + (isDark ? '33' : '40'),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={16} color={BrandColors.ink} weight="bold" />
                </View>
                <Text style={[textStyle('body'), { color: colors.body, flex: 1, fontSize: 15 }]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {user?.role !== 'provider' ? (
            <Text style={[textStyle('caption'), { color: colors.muted, textAlign: 'center' }]}>
              {t('premium.providersOnly')}
            </Text>
          ) : !isActive ? (
            <View style={{ gap: Spacing.four, marginTop: Spacing.two }}>
              <Input
                label={t('payment.phoneLabel')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder={t('payment.phonePlaceholder')}
                leftIcon={<DeviceMobile size={20} />}
              />
              <AuthPrimaryButton
                title={t('premium.subscribe')}
                onPress={handleSubscribe}
                loading={loading}
                tone="ink"
                backgroundColor={isDark ? '#FFFFFF' : undefined}
                textColor={isDark ? BrandColors.ink : undefined}
                flat
              />
            </View>
          ) : null}
        </View>
      </PageScaffold>
    </View>
  );
}
