import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import {
  Check,
  Scales,
  User,
  Package,
  ClipboardText,
  Star,
  ChatCircle,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import {
  AdminListCard,
  AdminIconWash,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
  adminReportStatusLabel,
  adminReportTargetLabel,
  adminReportReasonLabel,
  formatAdminDateTime,
} from '@/components/admin/adminUi';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

type StatusFilter = 'open' | 'in_review' | 'resolved' | 'dismissed' | 'all';
type SheetMode = 'detail' | 'resolved' | 'dismissed';

const FILTERS: StatusFilter[] = ['open', 'in_review', 'resolved', 'dismissed', 'all'];

type ReportRow = {
  report: {
    _id: Id<'reports'>;
    targetType: string;
    targetId: string;
    reason: string;
    description?: string;
    status: string;
    resolution?: string;
    createdAt?: number;
    updatedAt?: number;
  };
  reporter: { email?: string | null; name?: string | null; role?: string | null } | null;
};

function targetIcon(type: string): PhosphorIcon {
  switch (type) {
    case 'user':
      return User;
    case 'service':
      return Package;
    case 'order':
      return ClipboardText;
    case 'review':
      return Star;
    case 'message':
      return ChatCircle;
    default:
      return Scales;
  }
}

export default function AdminReportsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const [filter, setFilter] = useState<StatusFilter>('open');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const [mode, setMode] = useState<SheetMode>('detail');
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
    if (!q) return reports as ReportRow[];
    return (reports as ReportRow[]).filter(({ report, reporter }) => {
      const hay = [
        report.reason,
        report.description ?? '',
        report.targetType,
        reporter?.email ?? '',
        reporter?.name ?? '',
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

  const closeSheet = () => {
    setSelected(null);
    setMode('detail');
    setResolution('');
    setSuspendTarget(false);
  };

  const submitResolution = async () => {
    if (!selected || (mode !== 'resolved' && mode !== 'dismissed') || !resolution.trim()) return;

    const run = async () => {
      setLoading(true);
      try {
        const canSuspend =
          suspendTarget &&
          selected.report.targetType === 'user' &&
          !!selected.report.targetId;
        await resolve({
          reportId: selected.report._id,
          status: mode,
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
            mode === 'dismissed' ? t('admin.reportDismissed') : t('admin.reportResolved'),
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

    if (mode === 'dismissed') {
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

  const isOpen =
    selected?.report.status === 'open' || selected?.report.status === 'in_review';

  const footer =
    selected && mode === 'detail' && isOpen ? (
      <SheetActionsFooter>
        <SheetActionRow>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('admin.resolve')}
              tone="ink"
              fill
              flat
              onPress={() => {
                setMode('resolved');
                setResolution('');
                setSuspendTarget(false);
              }}
            />
          </SheetActionSlot>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('admin.dismiss')}
              tone="outline"
              fill
              flat
              onPress={() => {
                setMode('dismissed');
                setResolution('');
                setSuspendTarget(false);
              }}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : selected && (mode === 'resolved' || mode === 'dismissed') ? (
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
              title={mode === 'dismissed' ? t('admin.dismiss') : t('admin.resolve')}
              tone={mode === 'dismissed' ? 'danger' : 'ink'}
              fill
              flat
              loading={loading}
              disabled={!resolution.trim()}
              onPress={submitResolution}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : null;

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
            return (
              <AdminListCard
                key={report._id}
                onPress={() => {
                  setSelected(row);
                  setMode('detail');
                }}
                leading={<AdminIconWash icon={targetIcon(report.targetType)} />}
                title={adminReportReasonLabel(t, report.reason)}
                subtitle={`${adminReportTargetLabel(t, report.targetType)} · ${t('admin.byReporter', { email: reporter?.name || reporter?.email || '—' })}`}
                meta={report.description}
                badges={
                  <AdminStatusBadge
                    label={adminReportStatusLabel(t, report.status)}
                    status={report.status}
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
        title={
          mode === 'resolved'
            ? t('admin.resolveSheetTitle')
            : mode === 'dismissed'
              ? t('admin.dismissSheetTitle')
              : t('admin.reportDetailTitle')
        }
        subtitle={
          mode === 'resolved' || mode === 'dismissed'
            ? t('admin.resolveSheetSubtitle')
            : selected
              ? adminReportReasonLabel(t, selected.report.reason)
              : undefined
        }
        footer={footer}
      >
        {selected && (mode === 'resolved' || mode === 'dismissed') ? (
          <>
            <AuthField
              label={t('admin.resolutionLabel')}
              value={resolution}
              onChangeText={setResolution}
              placeholder={t('admin.resolutionPlaceholder')}
              multiline
              numberOfLines={3}
            />
            {selected.report.targetType === 'user' ? (
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
                      borderColor: suspendTarget ? colors.primary : colors.borderStrong,
                      backgroundColor: suspendTarget ? colors.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {suspendTarget ? (
                      <Check size={14} color={colors.onPrimary} weight="bold" />
                    ) : null}
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>
                    {t('admin.suspendTarget')}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </>
        ) : selected ? (
          <AdminDetailSection title={t('admin.detailReport')}>
            <AdminDetailRow
              label={t('admin.detailStatus')}
              value={adminReportStatusLabel(t, selected.report.status)}
            />
            <AdminDetailRow
              label={t('admin.detailReason')}
              value={adminReportReasonLabel(t, selected.report.reason)}
            />
            <AdminDetailRow
              label={t('admin.detailTarget')}
              value={adminReportTargetLabel(t, selected.report.targetType)}
            />
            <AdminDetailRow
              label={t('admin.detailTargetId')}
              value={selected.report.targetId}
            />
            <AdminDetailRow
              label={t('admin.detailDescription')}
              value={selected.report.description}
            />
            <AdminDetailRow
              label={t('admin.detailResolution')}
              value={selected.report.resolution}
            />
            <AdminDetailRow
              label={t('admin.detailReporter')}
              value={
                selected.reporter
                  ? `${selected.reporter.name || selected.reporter.email || '—'}${selected.reporter.role ? ` (${selected.reporter.role})` : ''}`
                  : undefined
              }
            />
            <AdminDetailRow
              label={t('admin.detailCreated')}
              value={formatAdminDateTime(selected.report.createdAt, i18n.language)}
            />
          </AdminDetailSection>
        ) : null}
      </AppBottomSheet>
    </PageScaffold>
  );
}
