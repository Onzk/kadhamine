import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { api } from '../../../convex/_generated/api';

export default function AdminPaymentsScreen() {
  const { colors } = useAppTheme();
  const payments = useQuery(api.admin.listPayments, { limit: 50 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Paiements" showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {payments?.map(({ payment, order, client, provider }) => (
          <View
            key={payment._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
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
      </ScrollView>
    </SafeAreaView>
  );
}
