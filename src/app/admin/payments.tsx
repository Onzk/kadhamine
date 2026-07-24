import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { CreditCard } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

type StatusFilter = 'all' | 'pending' | 'held' | 'released' | 'refunded' | 'failed';

const FILTERS: StatusFilter[] = ['all', 'pending', 'held', 'released', 'refunded', 'failed'];

export default function AdminPaymentsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const payments = useQuery(api.admin.listPayments, { limit: 50 });

  const filtered = useMemo(() => {
    if (!payments) return undefined;
    const q = search.trim().toLowerCase();
    return payments.filter(({ payment, order, client, provider }) => {
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
          filtered.map(({ payment, order, client, provider }) => (
            <View
              key={payment._id}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.lg,
                padding: Spacing.five,
                borderWidth: 0.1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                  {formatPrice(payment.amount)}
                </Text>
                <Badge label={payment.status} />
              </View>
              <Text style={{ fontSize: 13, color: colors.body }}>
                {order?.title ?? '—'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                {client?.email} → {provider?.email}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                {t('admin.commission')}: {formatPrice(payment.commission)} · {payment.method}
              </Text>
              {payment.fedapayReference ? (
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                  {t('admin.ref')}: {payment.fedapayReference}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </PageScaffold>
  );
}
