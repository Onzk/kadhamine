import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Check, Scales } from 'phosphor-react-native';

import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionsFooter } from '@/components/ui/SheetActions';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

type StatusFilter = 'open' | 'in_review' | 'resolved' | 'dismissed' | 'all';

const FILTERS: StatusFilter[] = ['open', 'in_review', 'resolved', 'dismissed', 'all'];

type SheetMode = 'resolved' | 'dismissed';

type ReportRow = {
  report: {
    _id: Id<'reports'>;
    targetType: string;
    targetId: string;
    reason: string;
    description?: string;
    status: string;
    resolution?: string;
  };
  reporter: { email?: string } | null;
};

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const [filter, setFilter] = useState<StatusFilter>('open');
  const [search, setSearch] = useState('');
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const [resolution, setResolution] = useState('');
  const [suspendTarget, setSuspendTarget] = useState(false);
  const [loading, setLoading] = useState(false);

  const reports = useQuery(api.admin.listReports, {
    status: filter === 'all' ? undefined : filter,
  });
  const resolve = useMutation(api.admin.resolveReport);

  const filtered = useMemo(() => {
    if (!reports) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(({ report, reporter }) => {
      const hay = [
        report.reason,
        report.description ?? '',
        report.targetType,
        reporter?.email ?? '',
        report.resolution ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reports, search]);

  const filterLabel = (f: StatusFilter) => {
    if (f === 'all') return t('common.all');
    if (f === 'open') return t('admin.statusOpen');
    if (f === 'in_review') return t('admin.statusInReview');
    if (f === 'resolved') return t('admin.statusResolved');
    return t('admin.statusDismissed');
  };

  const openSheet = (row: ReportRow, mode: SheetMode) => {
    setSelected(row);
    setSheetMode(mode);
    setResolution('');
    setSuspendTarget(false);
  };

  const closeSheet = () => {
    setSheetMode(null);
    setSelected(null);
    setResolution('');
    setSuspendTarget(false);
  };

  const submitResolution = async () => {
    if (!selected || !sheetMode || !resolution.trim()) return;

    const run = async () => {
      setLoading(true);
      try {
        const canSuspend =
          suspendTarget &&
          selected.report.targetType === 'user' &&
          !!selected.report.targetId;
        await resolve({
          reportId: selected.report._id,
          status: sheetMode,
          resolution: resolution.trim(),
          suspendTarget: canSuspend || undefined,
          targetUserId: canSuspend
            ? (selected.report.targetId as Id<'users'>)
            : undefined,
        });
        closeSheet();
        alert({
          title: t('admin.success'),
          message:
            sheetMode === 'dismissed'
              ? t('admin.reportDismissed')
              : t('admin.reportResolved'),
        });
      } catch (err) {
        alert({
          title: t('common.error'),
          message: err instanceof Error ? err.message : t('common.errorDesc'),
        });
      } finally {
        setLoading(false);
      }
    };

    if (sheetMode === 'dismissed') {
      confirm({
        title: t('admin.confirmDismissReport'),
        confirmLabel: t('admin.dismiss'),
        destructive: true,
        onConfirm: run,
      });
      return;
    }

    await run();
  };

  return (
    <PageScaffold
      title={t('admin.reportsTitle')}
      subtitle={t('admin.reportsSubtitle')}
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
          placeholder={t('admin.reportsSearch')}
        />

        {filtered === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Scales}
            title={t('admin.reportsEmpty')}
            description={t('admin.reportsEmptyDesc')}
          />
        ) : (
          filtered.map((row) => {
            const { report, reporter } = row;
            const isOpen = report.status === 'open' || report.status === 'in_review';
            return (
              <View
                key={report._id}
                style={{
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.lg,
                  padding: Spacing.five,
                  borderWidth: 0.1,
                  borderColor: colors.border,
                  gap: Spacing.two,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink }}>
                    {report.targetType} — {report.reason}
                  </Text>
                  <Badge label={report.status} />
                </View>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  {t('admin.byReporter', { email: reporter?.email ?? '—' })}
                </Text>
                {report.description ? (
                  <Text style={{ fontSize: 13, color: colors.body }}>{report.description}</Text>
                ) : null}
                {report.resolution ? (
                  <Text style={{ fontSize: 13, color: colors.muted }}>{report.resolution}</Text>
                ) : null}

                {isOpen ? (
                  <SheetActionsFooter style={{ marginTop: Spacing.two }}>
                    <AuthPrimaryButton
                      title={t('admin.resolve')}
                      flat
                      onPress={() => openSheet(row, 'resolved')}
                    />
                    <AuthPrimaryButton
                      title={t('admin.dismiss')}
                      tone="outline"
                      flat
                      onPress={() => openSheet(row, 'dismissed')}
                    />
                  </SheetActionsFooter>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <AppBottomSheet
        visible={sheetMode != null}
        onClose={closeSheet}
        title={
          sheetMode === 'dismissed'
            ? t('admin.dismissSheetTitle')
            : t('admin.resolveSheetTitle')
        }
        subtitle={t('admin.resolveSheetSubtitle')}
      >
        <AuthField
          label={t('admin.resolutionLabel')}
          value={resolution}
          onChangeText={setResolution}
          placeholder={t('admin.resolutionPlaceholder')}
          multiline
          numberOfLines={3}
        />

        {selected?.report.targetType === 'user' ? (
          <Pressable
            onPress={() => setSuspendTarget((v) => !v)}
            style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                paddingVertical: Spacing.four,
                marginBottom: Spacing.three,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: Radius.sm,
                  borderWidth: 0.1,
                  borderColor: suspendTarget ? colors.orbit : colors.borderStrong,
                  backgroundColor: suspendTarget ? colors.orbit : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {suspendTarget ? (
                  <Check size={14} color={colors.onOrbit} weight="bold" />
                ) : null}
              </View>
              <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>
                {t('admin.suspendTarget')}
              </Text>
            </View>
          </Pressable>
        ) : null}

        <SheetActionsFooter>
          <AuthPrimaryButton
            title={sheetMode === 'dismissed' ? t('admin.dismiss') : t('admin.resolve')}
            tone={sheetMode === 'dismissed' ? 'danger' : 'orbit'}
            flat
            loading={loading}
            disabled={!resolution.trim()}
            onPress={submitResolution}
          />
        </SheetActionsFooter>
      </AppBottomSheet>
    </PageScaffold>
  );
}
