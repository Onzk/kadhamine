import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/providers/ThemeProvider';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Litiges & signalements" showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {reports?.length === 0 && (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            Aucun litige ouvert
          </Text>
        )}

        {reports?.map(({ report, reporter }) => (
          <View
            key={report._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
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
      </ScrollView>
    </SafeAreaView>
  );
}
