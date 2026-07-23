import React from 'react';
import { View, Text } from 'react-native';
import { useQuery } from 'convex/react';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function AdminPaymentsScreen() {
  const { colors } = useAppTheme();
  const payments = useQuery(api.admin.listPayments, { limit: 50 });

  return (
    <PageScaffold
      title="Paiements"
      subtitle="Suivez les transactions et commissions."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        {payments?.map(({ payment, order, client, provider }) => (
          <View
            key={payment._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 20,
              padding: 16,
              marginBottom: 10,
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
              {order?.title ?? 'Commande'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {client?.email} → {provider?.email}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              Commission: {formatPrice(payment.commission)} · {payment.method}
            </Text>
            {payment.fedapayReference && (
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
                Ref: {payment.fedapayReference}
              </Text>
            )}
          </View>
        ))}
      </View>
    </PageScaffold>
  );
}
