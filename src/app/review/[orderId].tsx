import React, { useState } from 'react';
import { View } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { Button } from '@/components/ui/Button';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { StarRating } from '@/components/ui/StarRating';
import {
  OrderReviewForm,
  emptyProviderServiceReview,
  type ProviderServiceReviewValue,
  type ReviewFormErrors,
} from '@/components/reviews/OrderReviewForm';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { BorderWidth, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

/**
 * Notation depuis la commande uniquement (pas depuis la fiche service).
 * Bouton de confirmation en zone bottom fixed.
 */
export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [review, setReview] = useState<ProviderServiceReviewValue>(emptyProviderServiceReview);
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [footerH, setFooterH] = useState(0);

  const existing = useQuery(
    api.reviews.getByOrder,
    orderId ? { orderId: orderId as Id<'orders'> } : 'skip',
  );
  const createReview = useMutation(api.reviews.create);

  const actionBottomPad = Math.max(insets.bottom, Spacing.two) + Spacing.four;

  /** Saisie corrigée : l’erreur du champ concerné disparaît immédiatement. */
  const handleChange = (next: ProviderServiceReviewValue) => {
    setReview(next);
    setErrors((prev) => ({
      rating: next.rating >= 1 && next.rating <= 5 ? null : prev.rating,
      providerTags:
        next.providerTagIds.length > 0 || next.serviceTagIds.length > 0
          ? null
          : prev.providerTags,
    }));
  };

  const handleSubmit = async () => {
    if (!orderId) return;

    const nextErrors: ReviewFormErrors = {
      rating:
        review.rating < 1 || review.rating > 5 ? t('reviews.ratingMissing') : null,
      providerTags:
        review.providerTagIds.length < 1 && review.serviceTagIds.length < 1
          ? t('reviews.tagsMissing')
          : null,
    };
    setErrors(nextErrors);
    if (nextErrors.rating || nextErrors.providerTags) return;

    setLoading(true);
    try {
      await createReview({
        orderId: orderId as Id<'orders'>,
        rating: review.rating,
        comment: review.comment.trim() || undefined,
        providerTagIds: review.providerTagIds,
        serviceTagIds: review.serviceTagIds,
      });
      alert({
        title: t('reviews.thanks'),
        message: t('reviews.thanksBody'),
        icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        onPress: () => router.replace('/(tabs)/orders'),
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

  if (existing === undefined) {
    return (
      <PageScaffold
        title={t('reviews.leaveReview')}
        subtitle={t('reviews.officialOnly')}
        showBack
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.five }}>
          <Text style={{ textAlign: 'center', marginTop: Spacing.eight, color: colors.muted }}>
            {t('common.loading')}
          </Text>
        </View>
      </PageScaffold>
    );
  }

  if (existing && existing.isValid !== false) {
    return (
      <PageScaffold
        title={t('reviews.title')}
        subtitle={t('reviews.officialOnly')}
        showBack
      >
        <View
          style={{
            paddingHorizontal: PAGE_H_PAD,
            paddingTop: Spacing.five,
            gap: Spacing.four,
          }}
        >
          <Text style={{ fontSize: 15, color: colors.body }}>{t('reviews.thanks')}</Text>
          <StarRating rating={existing.rating} size={28} />
          {existing.comment ? (
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
              {existing.comment}
            </Text>
          ) : null}
          <Button
            title={t('orders.title')}
            onPress={() => router.replace('/(tabs)/orders')}
            fullWidth
            style={{ marginTop: Spacing.four }}
          />
        </View>
      </PageScaffold>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('reviews.leaveReview')}
        subtitle={t('reviews.officialOnly')}
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
            gap: Spacing.five,
          }}
        >
          <OrderReviewForm
            mode="providerService"
            value={review}
            onChange={handleChange}
            requiredHint={t('reviews.checkoutRequired')}
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
