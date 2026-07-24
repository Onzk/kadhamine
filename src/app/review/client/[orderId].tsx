import React, { useState } from 'react';
import { View } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Id } from '../../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import {
  OrderReviewForm,
  emptyClientReview,
  type ClientReviewValue,
  type ReviewFormErrors,
} from '@/components/reviews/OrderReviewForm';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAuth } from '@/providers/AuthProvider';
import { BorderWidth, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

/** Page dédiée — notation d’un client par le prestataire. */
export default function RateClientScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [value, setValue] = useState<ClientReviewValue>(emptyClientReview);
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [footerH, setFooterH] = useState(0);

  const eligibility = useQuery(
    api.reviews.getClientReviewEligibility,
    user && orderId ? { orderId: orderId as Id<'orders'> } : 'skip',
  );
  const createClientReview = useMutation(api.reviews.createClientReview);

  const actionBottomPad = Math.max(insets.bottom, Spacing.two) + Spacing.four;

  /** Saisie corrigée : l’erreur du champ concerné disparaît immédiatement. */
  const handleChange = (next: ClientReviewValue) => {
    setValue(next);
    setErrors((prev) => ({
      rating: next.rating >= 1 && next.rating <= 5 ? null : prev.rating,
      clientTags: next.tagIds.length > 0 ? null : prev.clientTags,
    }));
  };

  const handleSubmit = async () => {
    if (!orderId) return;

    const nextErrors: ReviewFormErrors = {
      rating: value.rating < 1 || value.rating > 5 ? t('reviews.ratingMissing') : null,
      clientTags: value.tagIds.length < 1 ? t('reviews.tagsMissing') : null,
    };
    setErrors(nextErrors);
    if (nextErrors.rating || nextErrors.clientTags) return;

    setLoading(true);
    try {
      await createClientReview({
        orderId: orderId as Id<'orders'>,
        rating: value.rating,
        tagIds: value.tagIds,
        comment: value.comment || undefined,
      });
      // Retour sur la commande d’abord : le bottomsheet s’affiche par-dessus le détail.
      router.replace(`/order/${orderId}`);
      alert({
        title: t('reviews.thanks'),
        message: t('reviews.clientThanksBody'),
        icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
      });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <PageScaffold
        title={t('reviews.rateClient')}
        subtitle={t('reviews.rateClientSubtitle')}
        showBack
      >
        <EmptyState
          title={t('auth.loginRequiredTitle')}
          description={t('orders.loginRequired')}
          actionLabel={t('auth.signIn')}
          onAction={() => router.push('/(auth)/login')}
        />
      </PageScaffold>
    );
  }

  if (eligibility === undefined) {
    return (
      <PageScaffold
        title={t('reviews.rateClient')}
        subtitle={t('reviews.rateClientSubtitle')}
        showBack
      >
        <View style={{ padding: Spacing.eight, alignItems: 'center' }}>
          <Text style={[textStyle('body'), { color: colors.muted }]}>{t('common.loading')}</Text>
        </View>
      </PageScaffold>
    );
  }

  if (eligibility.hasRated) {
    return (
      <PageScaffold
        title={t('reviews.rateClient')}
        subtitle={t('reviews.rateClientSubtitle')}
        showBack
      >
        <EmptyState
          title={t('reviews.thanks')}
          description={t('reviews.clientAlreadyRated')}
          actionLabel={t('orders.title')}
          onAction={() => router.replace('/(tabs)/orders')}
        />
      </PageScaffold>
    );
  }

  if (!eligibility.canRate) {
    return (
      <PageScaffold
        title={t('reviews.rateClient')}
        subtitle={t('reviews.rateClientSubtitle')}
        showBack
      >
        <EmptyState
          title={t('reviews.rateClientUnavailable')}
          description={t('reviews.rateClientUnavailableBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </PageScaffold>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('reviews.rateClient')}
        subtitle={t('reviews.rateClientSubtitle')}
        showBack
        bottomInset={false}
        contentContainerStyle={{
          paddingBottom: (footerH || 88) + Spacing.six,
        }}
      >
        <View
          style={{
            paddingHorizontal: PAGE_H_PAD,
            paddingTop: Spacing.five,
            gap: Spacing.six,
          }}
        >
          <OrderReviewForm
            mode="client"
            value={value}
            onChange={handleChange}
            errors={errors}
          />
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
          backgroundColor: colors.surfaceCard,
        }}
      >
        <AuthPrimaryButton
          title={t('reviews.submit')}
          onPress={handleSubmit}
          loading={loading}
          tone="orbit"
          flat
          fill
        />
      </View>
    </View>
  );
}
