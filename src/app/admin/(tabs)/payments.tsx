import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { CreditCard } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminIconWash,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
  adminPaymentStatusLabel,
  formatAdminDateTime,
  useAdminTabBarPadding,
} from '@/components/admin/adminUi';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

type StatusFilter = 'all' | 'pending' | 'held' | 'released' | 'refunded' | 'failed';

const FILTERS: StatusFilter[] = ['all', 'pending', 'held', 'released', 'refunded', 'failed'];

type PaymentRow = {
  payment: {
    _id: Id<'payments'>;
    amount: number;
    providerAmount?: number;
    commission: number;
    status: string;
    method: string;
    currency?: string;
    phoneNumber?: string;
    fedapayReference?: string;
    fedapayTransactionId?: string;
    createdAt?: number;
    heldAt?: number;
    releasedAt?: number;
  };
  order: { title?: string; status?: string } | null;
  client: { email?: string | null; name?: string | null } | null;
  provider: { email?: string | null; name?: string | null } | null;
};

export default function AdminPaymentsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { contentPaddingBottom } = useAdminTabBarPadding();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const payments = useQuery(api.admin.listPayments, { limit: 50 });

  const filtered = useMemo(() => {
    if (!payments) return undefined;
    const q = search.trim().toLowerCase();
    return (payments as PaymentRow[]).filter(({ payment, order, client, provider }) => {
      if (filter !== 'all' && payment.status !== filter) return false;
      if (!q) return true;
      const hay = [
        payment.fedapayReference ?? '',
        payment.fedapayTransactionId ?? '',
        order?.title ?? '',
        client?.email ?? '',
        client?.name ?? '',
        provider?.email ?? '',
        provider?.name ?? '',
        payment.method,
        payment.status,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [payments, filter, search]);

  const filterLabel = (f: StatusFilter) => {
    if (f === 'all') return t('common.all');
    if (f === 'pending') return t('admin.statusPending');
    if (f === 'held') return t('admin.statusHeld');
    if (f === 'released') return t('admin.statusReleased');
    if (f === 'refunded') return t('admin.statusRefunded');
    return t('admin.statusFailed');
  };

  return (
    <PageScaffold
      title={t('admin.paymentsTitle')}
      subtitle={t('admin.paymentsSubtitle')}
      bottomInset={false}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      headerActions={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.two }}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={filterLabel(f)}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.four }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('admin.paymentsSearch')}
        />

        {filtered === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={t('admin.paymentsEmpty')}
            description={t('admin.paymentsEmptyDesc')}
          />
        ) : (
          filtered.map((row) => {
            const { payment, order, client, provider } = row;
            return (
              <AdminListCard
                key={payment._id}
                onPress={() => setSelected(row)}
                leading={<AdminIconWash icon={CreditCard} />}
                title={order?.title ?? '—'}
                subtitle={`${client?.name || client?.email || '—'} → ${provider?.name || provider?.email || '—'}`}
                meta={`${t('admin.commission')}: ${formatPrice(payment.commission)} · ${payment.method} · ${formatAdminDateTime(payment.createdAt, i18n.language)}`}
                badges={
                  <>
                    <Badge label={formatPrice(payment.amount)} />
                    <AdminStatusBadge
                      label={adminPaymentStatusLabel(t, payment.status)}
                      status={payment.status}
                    />
                  </>
                }
              />
            );
          })
        )}
      </View>

      <AppBottomSheet
        visible={selected != null}
        onClose={() => setSelected(null)}
        title={t('admin.paymentDetailTitle')}
        subtitle={selected?.order?.title}
      >
        {selected ? (
          <>
            <AdminDetailSection title={t('admin.detailPayment')}>
              <AdminDetailRow
                label={t('admin.detailAmount')}
                value={formatPrice(selected.payment.amount)}
              />
              <AdminDetailRow
                label={t('admin.detailProviderAmount')}
                value={
                  selected.payment.providerAmount != null
                    ? formatPrice(selected.payment.providerAmount)
                    : undefined
                }
              />
              <AdminDetailRow
                label={t('admin.detailCommission')}
                value={formatPrice(selected.payment.commission)}
              />
              <AdminDetailRow
                label={t('admin.detailStatus')}
                value={adminPaymentStatusLabel(t, selected.payment.status)}
              />
              <AdminDetailRow label={t('admin.detailMethod')} value={selected.payment.method} />
              <AdminDetailRow
                label={t('admin.detailCurrency')}
                value={selected.payment.currency}
              />
              <AdminDetailRow
                label={t('admin.detailPhone')}
                value={selected.payment.phoneNumber}
              />
              <AdminDetailRow
                label={t('admin.detailRef')}
                value={selected.payment.fedapayReference}
              />
              <AdminDetailRow
                label={t('admin.detailTransactionId')}
                value={selected.payment.fedapayTransactionId}
              />
              <AdminDetailRow
                label={t('admin.detailCreated')}
                value={formatAdminDateTime(selected.payment.createdAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.statusHeld')}
                value={formatAdminDateTime(selected.payment.heldAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.statusReleased')}
                value={formatAdminDateTime(selected.payment.releasedAt, i18n.language)}
              />
            </AdminDetailSection>
            <AdminDetailSection title={t('admin.detailOrder')}>
              <AdminDetailRow
                label={t('admin.detailStatus')}
                value={selected.order?.status}
              />
              <AdminDetailRow
                label={t('admin.detailClient')}
                value={selected.client?.name || selected.client?.email}
              />
              <AdminDetailRow
                label={t('admin.detailProvider')}
                value={selected.provider?.name || selected.provider?.email}
              />
            </AdminDetailSection>
          </>
        ) : null}
      </AppBottomSheet>
    </PageScaffold>
  );
}
