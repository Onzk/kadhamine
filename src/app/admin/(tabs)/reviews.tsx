import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Star } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
  formatAdminDateTime,
  useAdminTabBarPadding,
} from '@/components/admin/adminUi';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Spacing } from '@/theme/tokens';
import { fontFamily } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

type SheetMode = 'detail' | 'hide';

type ReviewRow = {
  review: {
    _id: Id<'reviews'>;
    rating: number;
    comment?: string;
    providerResponse?: string;
    orderId?: string;
    serviceId?: string;
    createdAt?: number;
    providerTagIds?: string[];
    serviceTagIds?: string[];
  };
  client: { email?: string | null; name?: string | null } | null;
  provider: { email?: string | null; name?: string | null } | null;
};

export default function AdminReviewsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { contentPaddingBottom } = useAdminTabBarPadding();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReviewRow | null>(null);
  const [mode, setMode] = useState<SheetMode>('detail');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reviews = useQuery(api.admin.listPendingReviews);
  const moderate = useMutation(api.admin.moderateReview);

  const filtered = useMemo(() => {
    if (!reviews) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return reviews as ReviewRow[];
    return (reviews as ReviewRow[]).filter(({ review, client, provider }) => {
      const hay = [
        review.comment ?? '',
        client?.email ?? '',
        provider?.email ?? '',
        client?.name ?? '',
        provider?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reviews, search]);

  const closeSheet = () => {
    setSelected(null);
    setMode('detail');
    setReason('');
  };

  const approveReview = () => {
    if (!selected) return;
    confirm({
      title: t('admin.confirmApproveReview'),
      confirmLabel: t('admin.approveReview'),
      onConfirm: async () => {
        await moderate({ reviewId: selected.review._id, isVisible: true });
        closeSheet();
        alert({ title: t('admin.success'), message: t('admin.reviewApproved') });
      },
    });
  };

  const submitHide = () => {
    if (!selected || !reason.trim()) return;
    confirm({
      title: t('admin.confirmHideReview'),
      confirmLabel: t('admin.hideReview'),
      destructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          await moderate({
            reviewId: selected.review._id,
            isVisible: false,
            reason: reason.trim(),
          });
          closeSheet();
          alert({ title: t('admin.success'), message: t('admin.reviewHidden') });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const footer =
    selected && mode === 'detail' ? (
      <SheetActionsFooter>
        <SheetActionRow>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('admin.approveReview')}
              tone="ink"
              fill
              flat
              onPress={approveReview}
            />
          </SheetActionSlot>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('admin.hideReview')}
              tone="danger"
              fill
              flat
              onPress={() => {
                setMode('hide');
                setReason('');
              }}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : selected && mode === 'hide' ? (
      <SheetActionsFooter>
        <SheetActionRow>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('common.cancel')}
              tone="outline"
              fill
              flat
              onPress={() => setMode('detail')}
            />
          </SheetActionSlot>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('admin.hideReview')}
              tone="danger"
              fill
              flat
              loading={loading}
              disabled={!reason.trim()}
              onPress={submitHide}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : null;

  return (
    <PageScaffold
      title={t('admin.reviewsTitle')}
      subtitle={t('admin.reviewsSubtitle')}
      bottomInset={false}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
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
          filtered.map((row) => {
            const { review, client, provider } = row;
            return (
              <AdminListCard
                key={review._id}
                onPress={() => {
                  setSelected(row);
                  setMode('detail');
                }}
                leading={
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.iconWash,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fontFamily('body', 'bold'),
                        color: colors.primary,
                        fontSize: 14,
                      }}
                    >
                      {review.rating.toFixed(1)}
                    </Text>
                  </View>
                }
                title={client?.name || client?.email || '—'}
                subtitle={
                  provider
                    ? `${t('admin.detailProvider')}: ${provider.name || provider.email || '—'}`
                    : undefined
                }
                meta={review.comment}
                badges={
                  <AdminStatusBadge
                    label={t('admin.badgeNeedsModeration')}
                    status="pending"
                  />
                }
              />
            );
          })
        )}
      </View>

      <AppBottomSheet
        visible={selected != null}
        onClose={closeSheet}
        title={mode === 'hide' ? t('admin.hideSheetTitle') : t('admin.reviewDetailTitle')}
        subtitle={
          mode === 'hide'
            ? t('admin.hideSheetSubtitle')
            : selected
              ? selected.client?.name || selected.client?.email || undefined
              : undefined
        }
        footer={footer}
      >
        {selected && mode === 'hide' ? (
          <AuthField
            label={t('admin.hideReasonLabel')}
            value={reason}
            onChangeText={setReason}
            placeholder={t('admin.hideReasonPlaceholder')}
            multiline
            numberOfLines={3}
          />
        ) : selected ? (
          <>
            <View style={{ marginBottom: Spacing.four }}>
              <StarRating rating={selected.review.rating} />
            </View>
            <AdminDetailSection title={t('admin.detailReview')}>
              <AdminDetailRow
                label={t('admin.detailComment')}
                value={selected.review.comment}
              />
              <AdminDetailRow
                label={t('admin.detailResponse')}
                value={selected.review.providerResponse}
              />
              <AdminDetailRow
                label={t('admin.detailClient')}
                value={selected.client?.name || selected.client?.email}
              />
              <AdminDetailRow
                label={t('admin.detailProvider')}
                value={selected.provider?.name || selected.provider?.email}
              />
              <AdminDetailRow
                label={t('admin.detailOrderId')}
                value={selected.review.orderId}
              />
              <AdminDetailRow
                label={t('admin.detailServiceId')}
                value={selected.review.serviceId}
              />
              <AdminDetailRow
                label={t('admin.detailCreated')}
                value={formatAdminDateTime(selected.review.createdAt, i18n.language)}
              />
            </AdminDetailSection>
          </>
        ) : null}
      </AppBottomSheet>
    </PageScaffold>
  );
}
