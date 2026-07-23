import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { Scales } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function AdminReportsScreen() {
  const { colors } = useAppTheme();
  const reports = useQuery(api.admin.listReports, { status: 'open' });
  const resolve = useMutation(api.admin.resolveReport);
  const [resolution, setResolution] = useState<Record<string, string>>({});

  const handleResolve = async (reportId: string, dismiss = false) => {
    await resolve({
      reportId: reportId as never,
      status: dismiss ? 'dismissed' : 'resolved',
      resolution: resolution[reportId] ?? 'Traité par l\'administration',
    });
  };

  return (
    <PageScaffold
      title="Litiges & signalements"
      subtitle="Traitez les signalements et litiges ouverts."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        {reports?.length === 0 && (
          <EmptyState
            icon={Scales}
            title="Aucun litige ouvert"
            description="Tous les signalements ont été traités."
          />
        )}

        {reports?.map(({ report, reporter }) => (
          <View
            key={report._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
              borderWidth: 0.1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
              {report.targetType} — {report.reason}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              Par: {reporter?.email ?? 'Inconnu'}
            </Text>
            {report.description && (
              <Text style={{ fontSize: 13, color: colors.body, marginTop: 8 }}>{report.description}</Text>
            )}
            <Input
              label="Résolution"
              value={resolution[report._id] ?? ''}
              onChangeText={(t) => setResolution((prev) => ({ ...prev, [report._id]: t }))}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Résoudre" onPress={() => handleResolve(report._id)} style={{ flex: 1 }} />
              <Button
                title="Rejeter"
                variant="outline"
                onPress={() => handleResolve(report._id, true)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ))}
      </View>
    </PageScaffold>
  );
}
