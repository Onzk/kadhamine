import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { ClipboardText } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminIconWash,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
  adminOrderStatusLabel,
  formatAdminDateTime,
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
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'cancelled';

const FILTERS: StatusFilter[] = ['all', 'pending', 'accepted', 'completed', 'cancelled'];

type OrderRow = {
  order: {
    _id: Id<'orders'>;
    title: string;
    description?: string;
    status: string;
    agreedPrice?: number;
    currency?: string;
    city?: string;
    region?: string;
    addressLabel?: string;
    paymentMethod?: string;
    isOffPlatformPayment: boolean;
    canReview: boolean;
    clientNotes?: string;
    providerNotes?: string;
    deliveryDate?: string;
    acceptedAt?: number;
    completedAt?: number;
    cancelledAt?: number;
    createdAt?: number;
    updatedAt?: number;
  };
  client: { email?: string | null; name?: string | null } | null;
  provider: { email?: string | null; name?: string | null } | null;
  service: { title?: string } | null;
};

export default function AdminOrdersScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const orders = useQuery(api.admin.listOrders, { limit: 50 });

  const filtered = useMemo(() => {
    if (!orders) return undefined;
    const q = search.trim().toLowerCase();
    return (orders as OrderRow[]).filter(({ order, client, provider, service }) => {
      if (filter !== 'all' && order.status !== filter) return false;
      if (!q) return true;
      const hay = [
        order.title,
        order.description ?? '',
        order.city ?? '',
        order.region ?? '',
        client?.email ?? '',
        client?.name ?? '',
        provider?.email ?? '',
        provider?.name ?? '',
        service?.title ?? '',
        order.status,
        order.paymentMethod ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, filter, search]);

  const filterLabel = (f: StatusFilter) => {
    if (f === 'all') return t('common.all');
    if (f === 'pending') return t('admin.statusPending');
    if (f === 'accepted') return t('admin.statusAccepted');
    if (f === 'completed') return t('admin.statusCompleted');
    return t('admin.statusCancelled');
  };

  return (
    <PageScaffold
      title={t('admin.ordersTitle')}
      subtitle={t('admin.ordersSubtitle')}
      showBack
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
          placeholder={t('admin.ordersSearch')}
        />

        {filtered === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardText}
            title={t('admin.ordersEmpty')}
            description={t('admin.ordersEmptyDesc')}
          />
        ) : (
          filtered.map((row) => {
            const { order, client, provider } = row;
            const location = [order.city, order.region].filter(Boolean).join(' · ');
            return (
              <AdminListCard
                key={order._id}
                onPress={() => setSelected(row)}
                leading={<AdminIconWash icon={ClipboardText} />}
                title={order.title}
                subtitle={`${client?.name || client?.email || '—'} → ${provider?.name || provider?.email || '—'}`}
                meta={
                  [
                    location || null,
                    formatAdminDateTime(order.createdAt, i18n.language),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                }
                badges={
                  <>
                    {order.agreedPrice != null ? (
                      <Badge label={formatPrice(order.agreedPrice)} />
                    ) : null}
                    <AdminStatusBadge
                      label={adminOrderStatusLabel(t, order.status)}
                      status={order.status}
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
        title={t('admin.orderDetailTitle')}
        subtitle={selected?.order.title}
      >
        {selected ? (
          <>
            <AdminDetailSection title={t('admin.detailOrder')}>
              <AdminDetailRow
                label={t('admin.detailStatus')}
                value={adminOrderStatusLabel(t, selected.order.status)}
              />
              <AdminDetailRow
                label={t('admin.detailDescription')}
                value={selected.order.description}
              />
              <AdminDetailRow
                label={t('admin.detailAmount')}
                value={
                  selected.order.agreedPrice != null
                    ? formatPrice(selected.order.agreedPrice)
                    : undefined
                }
              />
              <AdminDetailRow
                label={t('admin.detailCurrency')}
                value={selected.order.currency}
              />
              <AdminDetailRow
                label={t('admin.detailMethod')}
                value={selected.order.paymentMethod}
              />
              <AdminDetailRow
                label={t('admin.detailOffPlatform')}
                value={
                  selected.order.isOffPlatformPayment
                    ? t('admin.yes')
                    : t('admin.no')
                }
              />
              <AdminDetailRow
                label={t('admin.detailDeliveryDate')}
                value={selected.order.deliveryDate}
              />
              <AdminDetailRow
                label={t('admin.detailCity')}
                value={selected.order.city}
              />
              <AdminDetailRow
                label={t('admin.detailRegion')}
                value={selected.order.region}
              />
              <AdminDetailRow
                label={t('admin.detailAddress')}
                value={selected.order.addressLabel}
              />
              <AdminDetailRow
                label={t('admin.detailClientNotes')}
                value={selected.order.clientNotes}
              />
              <AdminDetailRow
                label={t('admin.detailProviderNotes')}
                value={selected.order.providerNotes}
              />
              <AdminDetailRow
                label={t('admin.detailCreated')}
                value={formatAdminDateTime(selected.order.createdAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.detailAcceptedAt')}
                value={formatAdminDateTime(selected.order.acceptedAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.detailCompletedAt')}
                value={formatAdminDateTime(selected.order.completedAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.detailCancelledAt')}
                value={formatAdminDateTime(selected.order.cancelledAt, i18n.language)}
              />
            </AdminDetailSection>
            <AdminDetailSection title={t('admin.detailParties')}>
              <AdminDetailRow
                label={t('admin.detailClient')}
                value={selected.client?.name || selected.client?.email}
              />
              <AdminDetailRow
                label={t('admin.detailProvider')}
                value={selected.provider?.name || selected.provider?.email}
              />
              <AdminDetailRow
                label={t('admin.detailService')}
                value={selected.service?.title}
              />
            </AdminDetailSection>
          </>
        ) : null}
      </AppBottomSheet>
    </PageScaffold>
  );
}
