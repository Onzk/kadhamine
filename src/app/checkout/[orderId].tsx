import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Image, type ImageSourcePropType } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useAction } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Warning,
  CheckCircle,
  SealCheck,
  Lock,
  Star,
  Wallet,
} from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import {
  getFedapayReturnUrl,
  openFedapayCheckout,
} from '@/lib/fedapayBrowser';
import { setPendingPayment } from '@/lib/pendingPayment';
import { getPaymentResultAlertOptions } from '@/lib/paymentAlert';
import {
  OrderReviewForm,
  emptyProviderServiceReview,
  type ProviderServiceReviewValue,
  type ReviewFormErrors,
} from '@/components/reviews/OrderReviewForm';
import { extractFreeTextFromReviewComment } from '@/constants/reviews';
import { formatPrice } from '@/types';
import { BorderWidth, BrandColors, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';
import type { PaymentMethod } from '@/types';

const HERO_INK = BrandColors.ink;
const HERO_CREAM = BrandColors.canvas;
const TOTAL_STEPS = 3;
type Step = 1 | 2 | 3;

const ACCEPTED_LOGOS: { key: string; source: ImageSourcePropType }[] = [
  { key: 'fedapay', source: require('../../../assets/images/payments/fedapay.png') },
  { key: 'airtel', source: require('../../../assets/images/payments/airtel.png') },
  { key: 'moov', source: require('../../../assets/images/payments/moov.png') },
];

const PAYMENT_METHODS: {
  id: Extract<PaymentMethod, 'fedapay' | 'off_platform'>;
  labelKey: string;
  hintKey: string;
  icon: PhosphorIcon;
  logo?: ImageSourcePropType;
}[] = [
  {
    id: 'fedapay',
    labelKey: 'payment.fedapay',
    hintKey: 'payment.fedapayHint',
    icon: CreditCard,
    logo: require('../../../assets/images/payments/fedapay.png'),
  },
  {
    id: 'off_platform',
    labelKey: 'payment.offPlatform',
    hintKey: 'payment.offPlatformShort',
    icon: Warning,
  },
];

function SectionLabel({ children }: { children: string }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={{
        fontFamily: fontFamily('body', 'medium'),
        fontSize: 13,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: colors.muted,
      }}
    >
      {children}
    </Text>
  );
}

function TrustItem({
  icon: Icon,
  label,
  accent,
}: {
  icon: PhosphorIcon;
  label: string;
  accent: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: Spacing.two }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: Radius.sm,
          backgroundColor: accent + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color={accent} weight="fill" />
      </View>
      <Text
        style={[
          textStyle('micro'),
          { color: colors.body, textAlign: 'center', lineHeight: 16 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<'fedapay' | 'off_platform'>('fedapay');
  const [loading, setLoading] = useState(false);
  const [footerH, setFooterH] = useState(0);
  const [review, setReview] = useState<ProviderServiceReviewValue>(emptyProviderServiceReview);
  const [reviewErrors, setReviewErrors] = useState<ReviewFormErrors>({});
  const reviewHydratedRef = useRef(false);

  const orderData = useQuery(api.orders.listMine, { role: 'client' });
  const order = orderData?.find((o) => o.order._id === orderId);
  const existingReview = useQuery(
    api.reviews.getByOrder,
    user && orderId ? { orderId: orderId as Id<'orders'> } : 'skip',
  );
  const commissionRate = useQuery(api.settings.getCommissionRate) ?? 0.1;
  const initiatePayment = useMutation(api.payments.initiate);
  const upsertReviewDraft = useMutation(api.reviews.upsertCheckoutDraft);
  const createFedapayTransaction = useAction(api.fedapay.createTransaction);

  /**
   * Reprend le brouillon d’avis du dernier paiement (isValid === false).
   * Complet → étape paiement ; sinon préremplit le formulaire.
   */
  useEffect(() => {
    if (reviewHydratedRef.current || existingReview === undefined) return;
    reviewHydratedRef.current = true;

    if (!existingReview || existingReview.isValid !== false) return;

    const providerTagIds = existingReview.providerTagIds ?? [];
    const serviceTagIds = existingReview.serviceTagIds ?? [];
    const freeText = extractFreeTextFromReviewComment(existingReview.comment);
    setReview({
      rating: existingReview.rating,
      providerTagIds,
      serviceTagIds,
      freeText,
      comment: existingReview.comment ?? '',
    });

    const complete =
      existingReview.rating >= 1 &&
      existingReview.rating <= 5 &&
      providerTagIds.length > 0 &&
      serviceTagIds.length > 0;
    if (complete) setStep(3);
  }, [existingReview]);

  const amount = order?.order.agreedPrice ?? 0;
  const commission = method === 'off_platform' ? 0 : Math.round(amount * commissionRate);
  const providerAmount = amount - commission;
  const isOffPlatform = method === 'off_platform';
  const actionBottomPad = Math.max(insets.bottom, Spacing.two) + Spacing.four;
  const offAccent = colors.warning;
  const orderStatus = order?.order.status;
  const existingPayment = order?.payment;
  const canCheckout =
    orderStatus === 'completed' &&
    (!existingPayment ||
      existingPayment.status === 'failed' ||
      (existingPayment.status === 'pending' &&
        existingPayment.method !== 'off_platform'));

  const titles = useMemo(
    () => ({
      1: t('payment.stepRatingTitle'),
      2: t('payment.stepServiceTitle'),
      3: t('payment.stepPayTitle'),
    }),
    [t],
  );
  const subtitles = useMemo(
    () => ({
      1: t('payment.stepRatingSubtitle'),
      2: t('payment.stepServiceSubtitle'),
      3: t('payment.stepPaySubtitle'),
    }),
    [t],
  );

  const goBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
      return;
    }
    router.back();
  };

  /** Saisie corrigée : l’erreur du champ concerné disparaît immédiatement. */
  const handleReviewChange = (next: ProviderServiceReviewValue) => {
    setReview(next);
    setReviewErrors((prev) => ({
      rating: next.rating >= 1 && next.rating <= 5 ? null : prev.rating,
      providerTags: next.providerTagIds.length > 0 ? null : prev.providerTags,
      serviceTags: next.serviceTagIds.length > 0 ? null : prev.serviceTags,
    }));
  };

  const goNext = () => {
    if (step === 1) {
      const nextErrors: ReviewFormErrors = {
        rating:
          review.rating < 1 || review.rating > 5 ? t('reviews.ratingMissing') : null,
        providerTags:
          review.providerTagIds.length < 1
            ? t('payment.stepProviderTagsRequired')
            : null,
      };
      setReviewErrors(nextErrors);
      if (nextErrors.rating || nextErrors.providerTags) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      const serviceTags =
        review.serviceTagIds.length < 1 ? t('payment.stepServiceTagsRequired') : null;
      setReviewErrors((prev) => ({ ...prev, serviceTags }));
      if (serviceTags) return;
      setStep(3);
    }
  };

  const handlePay = async () => {
    if (!orderId || !canCheckout) return;

    if (method !== 'off_platform') {
      // Champ manquant : on ramène l’utilisateur à l’étape concernée, erreur inline.
      if (review.rating < 1 || review.rating > 5 || review.providerTagIds.length < 1) {
        setReviewErrors({
          rating:
            review.rating < 1 || review.rating > 5 ? t('reviews.ratingMissing') : null,
          providerTags:
            review.providerTagIds.length < 1
              ? t('payment.stepProviderTagsRequired')
              : null,
        });
        setStep(1);
        return;
      }
      if (review.serviceTagIds.length < 1) {
        setReviewErrors({ serviceTags: t('payment.stepServiceTagsRequired') });
        setStep(2);
        return;
      }
    }

    setLoading(true);
    try {
      const paymentId = await initiatePayment({
        orderId: orderId as Id<'orders'>,
        method,
      });

      if (method === 'off_platform') {
        router.replace('/(tabs)/orders');
        return;
      }

      await upsertReviewDraft({
        orderId: orderId as Id<'orders'>,
        paymentId,
        rating: review.rating,
        providerTagIds: review.providerTagIds,
        serviceTagIds: review.serviceTagIds,
        comment: review.comment || undefined,
      });

      const returnUrl = getFedapayReturnUrl();
      const result = await createFedapayTransaction({
        paymentId,
        amount,
        description: order?.order.title ?? 'Commande Kadhamine',
        customerEmail: user?.email ?? undefined,
        customerName: user?.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user?.name ?? undefined,
        returnUrl,
      });

      setPendingPayment({ purpose: 'order', orderId });

      if (result.paymentUrl) {
        await openFedapayCheckout(result.paymentUrl);
      }

      // Deep link ou fallback : l’écran callback affiche l’attente + bottomsheet.
      router.replace('/payment/callback');
    } catch (err) {
      console.error(err);
      alert(getPaymentResultAlertOptions('failure', t, colors));
    } finally {
      setLoading(false);
    }
  };

  const heroBg = isDark ? colors.surfaceDark : HERO_INK;
  const heroTitle = HERO_CREAM;
  const heroMuted = isDark ? 'rgba(243,240,238,0.72)' : BrandColors.dust;
  const heroBorder = isDark ? colors.borderHairline : 'transparent';

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

  if (orderData !== undefined && order && !canCheckout) {
    return (
      <PageScaffold title={t('payment.title')} subtitle={t('payment.subtitle')} showBack>
        <EmptyState
          title={t('payment.blockedTitle')}
          description={
            orderStatus === 'cancelled'
              ? t('payment.blockedCancelled')
              : orderStatus !== 'completed'
                ? t('payment.blockedNotCompleted')
                : t('payment.blockedAlreadyPaid')
          }
          actionLabel={t('order.detailTitle')}
          onAction={() => router.replace(`/order/${orderId}`)}
        />
      </PageScaffold>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={titles[step]}
        subtitle={subtitles[step]}
        showBack
        onBack={goBack}
        bottomInset={false}
        contentContainerStyle={{
          paddingBottom: (footerH || 100) + Spacing.six,
        }}
      >
        <View
          style={{
            paddingHorizontal: PAGE_H_PAD,
            paddingTop: Spacing.five,
            gap: Spacing.six,
          }}
        >
          {step === 1 ? (
            <OrderReviewForm
              mode="providerService"
              value={review}
              onChange={handleReviewChange}
              parts={['rating', 'providerTags']}
              errors={reviewErrors}
            />
          ) : null}

          {step === 2 ? (
            <OrderReviewForm
              mode="providerService"
              value={review}
              onChange={handleReviewChange}
              parts={['serviceTags', 'comment']}
              errors={reviewErrors}
            />
          ) : null}

          {step === 3 ? (
            <>
              <View
                style={{
                  borderRadius: Radius.lg,
                  overflow: 'hidden',
                  borderWidth: isDark ? BorderWidth.default : BorderWidth.none,
                  borderColor: heroBorder,
                }}
              >
                <LinearGradient
                  colors={
                    isDark
                      ? [colors.surfaceDark, colors.surfaceNavy]
                      : [BrandColors.clay, BrandColors.orbit, BrandColors.link]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: Spacing.six,
                    gap: Spacing.four,
                    backgroundColor: heroBg,
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
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: Radius.sm,
                        backgroundColor: 'rgba(255,255,255,0.14)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Wallet size={22} color={BrandColors.gold} weight="fill" />
                    </View>
                    {order?.order.status ? (
                      <Badge label={t(`orders.${order.order.status}`)} variant="accent" />
                    ) : null}
                  </View>

                  <View style={{ gap: Spacing.one }}>
                    <Text style={[textStyle('micro'), { color: heroMuted }]}>
                      {t('payment.amountDue')}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fontFamily('display', 'medium'),
                        fontSize: 40,
                        lineHeight: 44,
                        letterSpacing: -1,
                        color: heroTitle,
                      }}
                    >
                      {formatPrice(amount)}
                    </Text>
                  </View>

                  {order?.order.title ? (
                    <Text
                      numberOfLines={2}
                      style={{
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 15,
                        lineHeight: 22,
                        color: heroMuted,
                      }}
                    >
                      {order.order.title}
                    </Text>
                  ) : null}
                </LinearGradient>
              </View>

              <View style={{ gap: Spacing.three }}>
                <SectionLabel>{t('payment.summary')}</SectionLabel>
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
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={[textStyle('caption'), { color: colors.muted }]}>
                      {t('payment.servicePrice')}
                    </Text>
                    <Text
                      style={[
                        textStyle('caption'),
                        { color: colors.ink, fontFamily: fontFamily('body', 'medium') },
                      ]}
                    >
                      {formatPrice(amount)}
                    </Text>
                  </View>

                  {!isOffPlatform ? (
                    <>
                      <View
                        style={{
                          height: BorderWidth.default,
                          backgroundColor: colors.borderHairline,
                        }}
                      />
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
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
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={[textStyle('caption'), { color: colors.muted }]}>
                          {t('payment.providerReceives')}
                        </Text>
                        <Text
                          style={[
                            textStyle('caption'),
                            { color: colors.ink, fontFamily: fontFamily('body', 'medium') },
                          ]}
                        >
                          {formatPrice(providerAmount)}
                        </Text>
                      </View>
                    </>
                  ) : null}

                  <View
                    style={{
                      height: BorderWidth.default,
                      backgroundColor: colors.borderHairline,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 15,
                        color: colors.ink,
                      }}
                    >
                      {t('payment.totalDue')}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fontFamily('display', 'medium'),
                        fontSize: 20,
                        letterSpacing: -0.4,
                        color: colors.ink,
                      }}
                    >
                      {formatPrice(amount)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ gap: Spacing.three }}>
                <SectionLabel>{t('payment.method')}</SectionLabel>
                {PAYMENT_METHODS.map((pm) => {
                  const selected = method === pm.id;
                  const off = pm.id === 'off_platform';
                  const Icon = pm.icon;
                  const accent = off ? offAccent : colors.orbit;

                  return (
                    <Pressable
                      key={pm.id}
                      onPress={() => setMethod(pm.id)}
                      style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.92 : 1 }]}
                    >
                      <View
                        style={{
                          backgroundColor: selected
                            ? off
                              ? offAccent + '18'
                              : colors.orbitWash
                            : colors.surfaceCard,
                          borderRadius: Radius.lg,
                          padding: Spacing.four,
                          borderWidth: BorderWidth.default,
                          borderColor: selected ? accent : colors.borderStrong,
                          gap: Spacing.three,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Spacing.three,
                          }}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: Radius.sm,
                              backgroundColor: selected
                                ? accent + '22'
                                : pm.logo
                                  ? colors.surfaceCard
                                  : colors.iconWash,
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              borderWidth: pm.logo ? BorderWidth.default : 0,
                              borderColor: colors.borderHairline,
                            }}
                          >
                            {pm.logo ? (
                              <Image
                                source={pm.logo}
                                style={{ width: 36, height: 36 }}
                                resizeMode="contain"
                              />
                            ) : (
                              <Icon
                                size={22}
                                color={selected ? accent : colors.ink}
                                weight="duotone"
                              />
                            )}
                          </View>

                          <View style={{ flex: 1, gap: 3 }}>
                            <Text
                              style={{
                                fontFamily: fontFamily('body', 'medium'),
                                fontSize: 16,
                                color: colors.ink,
                              }}
                            >
                              {t(pm.labelKey)}
                            </Text>
                            <Text
                              style={[textStyle('micro'), { color: colors.muted, lineHeight: 16 }]}
                            >
                              {t(pm.hintKey)}
                            </Text>
                          </View>

                          {selected ? (
                            <CheckCircle size={24} color={accent} weight="fill" />
                          ) : (
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: Radius.full,
                                borderWidth: 1.5,
                                borderColor: colors.borderStrong,
                              }}
                            />
                          )}
                        </View>

                        {!off && selected ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: Spacing.two,
                              paddingTop: Spacing.one,
                              borderTopWidth: BorderWidth.default,
                              borderTopColor: colors.orbit + '33',
                            }}
                          >
                            <Text style={[textStyle('micro'), { color: colors.muted }]}>
                              {t('payment.acceptedMethods')}
                            </Text>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: Spacing.oneHalf,
                                marginLeft: 'auto',
                              }}
                            >
                              {ACCEPTED_LOGOS.map((logo) => (
                                <View
                                  key={logo.key}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: Radius.xs,
                                    backgroundColor: colors.surfaceCard,
                                    borderWidth: BorderWidth.default,
                                    borderColor: colors.borderHairline,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Image
                                    source={logo.source}
                                    style={{ width: 20, height: 20 }}
                                    resizeMode="contain"
                                  />
                                </View>
                              ))}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {isOffPlatform ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: Spacing.three,
                    backgroundColor: offAccent + '18',
                    borderRadius: Radius.lg,
                    padding: Spacing.four,
                    borderWidth: BorderWidth.default,
                    borderColor: offAccent + '40',
                  }}
                >
                  <Warning size={22} color={offAccent} weight="fill" />
                  <View style={{ flex: 1, gap: Spacing.one }}>
                    <Text
                      style={{
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 14,
                        color: colors.ink,
                      }}
                    >
                      {t('payment.offPlatform')}
                    </Text>
                    <Text style={[textStyle('micro'), { color: colors.body, lineHeight: 18 }]}>
                      {t('payment.offPlatformWarning')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: colors.surfaceCard,
                    borderRadius: Radius.lg,
                    paddingVertical: Spacing.five,
                    paddingHorizontal: Spacing.three,
                    borderWidth: BorderWidth.default,
                    borderColor: colors.borderStrong,
                    gap: Spacing.four,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.two,
                      paddingHorizontal: Spacing.two,
                    }}
                  >
                    <SealCheck size={18} color={colors.orbit} weight="fill" />
                    <Text
                      style={{
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 14,
                        color: colors.ink,
                        flex: 1,
                      }}
                    >
                      {t('payment.integratedBenefit')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TrustItem
                      icon={Lock}
                      label={t('payment.trustSecure')}
                      accent={colors.orbit}
                    />
                    <TrustItem
                      icon={Wallet}
                      label={t('payment.trustEscrow')}
                      accent={colors.success}
                    />
                    <TrustItem
                      icon={Star}
                      label={t('payment.trustReview')}
                      accent={BrandColors.gold}
                    />
                  </View>
                </View>
              )}
            </>
          ) : null}
        </View>
      </PageScaffold>

      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - footerH) > 1) setFooterH(h);
        }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: PAGE_H_PAD,
          paddingTop: Spacing.three,
          paddingBottom: actionBottomPad,
          borderTopWidth: BorderWidth.default,
          borderTopColor: colors.borderStrong,
          // Zone d’action toujours blanche en jour (surfaceCard reste crème).
          backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
        }}
      >
        {step > 1 ? (
          <Pressable
            onPress={goBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={({ pressed }) => [{ width: 54, height: 54, opacity: pressed ? 0.8 : 1 }]}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: Radius.pill,
                backgroundColor: colors.iconWash,
                borderWidth: BorderWidth.default,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={20} color={colors.ink} weight="bold" />
            </View>
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }}>
          {step < TOTAL_STEPS ? (
            <AuthPrimaryButton
              title={t('common.continue')}
              onPress={goNext}
              tone="orbit"
              flat
              fill
              icon={<ArrowRight size={18} weight="bold" />}
            />
          ) : (
            <AuthPrimaryButton
              title={isOffPlatform ? t('payment.offPlatformConfirm') : t('payment.pay')}
              onPress={handlePay}
              loading={loading}
              tone={isOffPlatform ? 'ink' : 'orbit'}
              flat
              fill
            />
          )}
        </View>
      </View>
    </View>
  );
}
