import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { NotePencil, Star } from 'phosphor-react-native';

import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export default function AdminReviewsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const [search, setSearch] = useState('');
  const [hideTarget, setHideTarget] = useState<Id<'reviews'> | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reviews = useQuery(api.admin.listPendingReviews);
  const moderate = useMutation(api.admin.moderateReview);

  const filtered = useMemo(() => {
    if (!reviews) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter(({ review, client, provider }) => {
      const hay = [
        review.comment ?? '',
        client?.email ?? '',
        provider?.email ?? '',
        client?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reviews, search]);

  const approveReview = (reviewId: Id<'reviews'>) => {
    confirm({
      title: t('admin.confirmApproveReview'),
      confirmLabel: t('admin.approveReview'),
      onConfirm: async () => {
        await moderate({ reviewId, isVisible: true });
        alert({ title: t('admin.success'), message: t('admin.reviewApproved') });
      },
    });
  };

  const submitHide = () => {
    if (!hideTarget || !reason.trim()) return;
    confirm({
      title: t('admin.confirmHideReview'),
      confirmLabel: t('admin.hideReview'),
      destructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          await moderate({
            reviewId: hideTarget,
            isVisible: false,
            reason: reason.trim(),
          });
          setHideTarget(null);
          setReason('');
          alert({ title: t('admin.success'), message: t('admin.reviewHidden') });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <PageScaffold
      title={t('admin.reviewsTitle')}
      subtitle={t('admin.reviewsSubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.four }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('admin.reviewsSearch')}
        />

        {filtered === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Star}
            title={t('admin.reviewsEmpty')}
            description={t('admin.reviewsEmptyDesc')}
          />
        ) : (
          filtered.map(({ review, client }) => (
            <View
              key={review._id}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 20,
                padding: 16,
                borderWidth: 0.1,
                borderColor: colors.border,
                gap: Spacing.two,
              }}
            >
              <StarRating rating={review.rating} />
              {review.comment ? (
                <Text style={{ fontSize: 14, color: colors.body }}>{review.comment}</Text>
              ) : null}
              <Text style={{ fontSize: 12, color: colors.muted }}>{client?.email}</Text>

              <SheetActionsFooter style={{ marginTop: Spacing.two }}>
                <SheetActionRow>
                  <SheetActionSlot>
                    <AuthPrimaryButton
                      title={t('admin.approveReview')}
                      fill
                      flat
                      onPress={() => approveReview(review._id)}
                    />
                  </SheetActionSlot>
                  <SheetActionSlot>
                    <AuthPrimaryButton
                      title={t('admin.hideReview')}
                      tone="danger"
                      fill
                      flat
                      onPress={() => {
                        setHideTarget(review._id);
                        setReason('');
                      }}
                    />
                  </SheetActionSlot>
                </SheetActionRow>
              </SheetActionsFooter>
            </View>
          ))
        )}
      </View>

      <AppBottomSheet
        visible={hideTarget != null}
        onClose={() => {
          setHideTarget(null);
          setReason('');
        }}
        title={t('admin.hideSheetTitle')}
        subtitle={t('admin.hideSheetSubtitle')}
      >
        <AuthField
          label={t('admin.hideReasonLabel')}
          value={reason}
          onChangeText={setReason}
          placeholder={t('admin.hideReasonPlaceholder')}
          multiline
          numberOfLines={3}
          leftIcon={<NotePencil size={20} />}
        />
        <SheetActionsFooter>
          <AuthPrimaryButton
            title={t('admin.hideReview')}
            tone="danger"
            flat
            loading={loading}
            disabled={!reason.trim()}
            onPress={submitHide}
          />
        </SheetActionsFooter>
      </AppBottomSheet>
    </PageScaffold>
  );
}
