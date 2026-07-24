import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { IdentificationCard, X } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
  adminVerificationStatusLabel,
  displayName,
  formatAdminDateTime,
  useAdminTabBarPadding,
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
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

type StatusFilter = 'pending' | 'approved' | 'rejected';
type SheetMode = 'detail' | 'reject';

const FILTERS: StatusFilter[] = ['pending', 'approved', 'rejected'];

type VerifRow = {
  request: {
    _id: Id<'verificationRequests'>;
    status: string;
    documentType: string;
    reviewNotes?: string;
    createdAt?: number;
    reviewedAt?: number;
  };
  user: { email?: string | null; phone?: string | null; name?: string | null } | null;
  profile: { firstName?: string; lastName?: string; city?: string; phone?: string } | null;
  docUrl: string | null;
  selfieUrl: string | null;
};

export default function AdminVerificationsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { contentPaddingBottom } = useAdminTabBarPadding();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<VerifRow | null>(null);
  const [mode, setMode] = useState<SheetMode>('detail');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const items = useQuery(api.admin.listVerifications, { status: filter });
  const review = useMutation(api.admin.reviewVerification);

  const filtered = useMemo(() => {
    if (!items) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return items as VerifRow[];
    return (items as VerifRow[]).filter(({ profile, request, user }) => {
      const name = displayName({ profile, user });
      return (
        name.toLowerCase().includes(q) ||
        request.documentType.toLowerCase().includes(q) ||
        (user?.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const filterLabel = (f: StatusFilter) => {
    if (f === 'pending') return t('admin.statusPending');
    if (f === 'approved') return t('admin.statusApproved');
    return t('admin.statusRejected');
  };

  const docLabel = (type: string) =>
    type === 'national_id' ? t('admin.docNationalId') : t('admin.docPassport');

  const closeSheet = () => {
    setSelected(null);
    setMode('detail');
    setNotes('');
  };

  const approve = () => {
    if (!selected) return;
    confirm({
      title: t('admin.confirmApproveVerification'),
      confirmLabel: t('admin.approveVerification'),
      onConfirm: async () => {
        await review({ requestId: selected.request._id, approved: true });
        closeSheet();
        alert({ title: t('admin.success'), message: t('admin.verificationApproved') });
      },
    });
  };

  const submitReject = () => {
    if (!selected || !notes.trim()) return;
    confirm({
      title: t('admin.confirmRejectVerification'),
      confirmLabel: t('admin.rejectVerification'),
      destructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          await review({
            requestId: selected.request._id,
            approved: false,
            notes: notes.trim(),
          });
          closeSheet();
          alert({ title: t('admin.success'), message: t('admin.verificationRejected') });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const footer =
    selected && mode === 'detail' && selected.request.status === 'pending' ? (
      <SheetActionsFooter>
        <SheetActionRow>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('admin.approveVerification')}
              tone="ink"
              fill
              flat
              onPress={approve}
            />
          </SheetActionSlot>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('admin.rejectVerification')}
              tone="danger"
              fill
              flat
              onPress={() => {
                setMode('reject');
                setNotes('');
              }}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : selected && mode === 'reject' ? (
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
              title={t('admin.rejectVerification')}
              tone="danger"
              fill
              flat
              loading={loading}
              disabled={!notes.trim()}
              onPress={submitReject}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : null;

  return (
    <PageScaffold
      title={t('admin.verificationsTitle')}
      subtitle={t('admin.verificationsSubtitle')}
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
          placeholder={t('admin.verificationsSearch')}
        />

        {filtered === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={IdentificationCard}
            title={t('admin.verificationsEmpty')}
            description={t('admin.verificationsEmptyDesc')}
          />
        ) : (
          filtered.map((row) => {
            const { request, profile, user, docUrl, selfieUrl } = row;
            const name = displayName({ profile, user });
            return (
              <AdminListCard
                key={request._id}
                onPress={() => {
                  setSelected(row);
                  setMode('detail');
                }}
                leading={
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {docUrl ? (
                      <Pressable
                        onPress={() => setPreviewUri(docUrl)}
                        style={({ pressed }) => [
                          { width: 52, height: 40 },
                          { opacity: pressed ? 0.9 : 1 },
                        ]}
                      >
                        <Image
                          source={{ uri: docUrl }}
                          style={{ width: 52, height: 40, borderRadius: Radius.sm }}
                          contentFit="cover"
                        />
                      </Pressable>
                    ) : null}
                    {selfieUrl ? (
                      <Pressable
                        onPress={() => setPreviewUri(selfieUrl)}
                        style={({ pressed }) => [
                          { width: 40, height: 40 },
                          { opacity: pressed ? 0.9 : 1 },
                        ]}
                      >
                        <Image
                          source={{ uri: selfieUrl }}
                          style={{ width: 40, height: 40, borderRadius: Radius.pill }}
                          contentFit="cover"
                        />
                      </Pressable>
                    ) : null}
                  </View>
                }
                title={name}
                subtitle={docLabel(request.documentType)}
                meta={[user?.email, formatAdminDateTime(request.createdAt, i18n.language)]
                  .filter(Boolean)
                  .join(' · ')}
                badges={
                  <AdminStatusBadge
                    label={adminVerificationStatusLabel(t, request.status)}
                    status={request.status}
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
          mode === 'reject' ? t('admin.rejectSheetTitle') : t('admin.verificationDetailTitle')
        }
        subtitle={
          mode === 'reject'
            ? t('admin.rejectSheetSubtitle')
            : selected
              ? displayName(selected)
              : undefined
        }
        footer={footer}
      >
        {selected && mode === 'reject' ? (
          <AuthField
            label={t('admin.notesLabel')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('admin.notesPlaceholder')}
            multiline
            numberOfLines={3}
          />
        ) : selected ? (
          <>
            <AdminDetailSection title={t('admin.detailVerification')}>
              <AdminDetailRow
                label={t('admin.detailStatus')}
                value={adminVerificationStatusLabel(t, selected.request.status)}
              />
              <AdminDetailRow
                label={t('admin.detailDocType')}
                value={docLabel(selected.request.documentType)}
              />
              <AdminDetailRow
                label={t('admin.detailCreated')}
                value={formatAdminDateTime(selected.request.createdAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.detailReviewedAt')}
                value={formatAdminDateTime(selected.request.reviewedAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.detailNotes')}
                value={selected.request.reviewNotes}
              />
            </AdminDetailSection>
            <AdminDetailSection title={t('admin.detailContact')}>
              <AdminDetailRow label={t('admin.detailEmail')} value={selected.user?.email} />
              <AdminDetailRow
                label={t('admin.detailPhone')}
                value={selected.user?.phone ?? selected.profile?.phone}
              />
              <AdminDetailRow label={t('admin.detailCity')} value={selected.profile?.city} />
            </AdminDetailSection>
            <View style={{ flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.four }}>
              {selected.docUrl ? (
                <Pressable
                  onPress={() => setPreviewUri(selected.docUrl)}
                  style={({ pressed }) => [
                    { width: 140, height: 90 },
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Image
                    source={{ uri: selected.docUrl }}
                    style={{ width: 140, height: 90, borderRadius: Radius.md }}
                    contentFit="cover"
                  />
                </Pressable>
              ) : null}
              {selected.selfieUrl ? (
                <Pressable
                  onPress={() => setPreviewUri(selected.selfieUrl)}
                  style={({ pressed }) => [
                    { width: 90, height: 90 },
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Image
                    source={{ uri: selected.selfieUrl }}
                    style={{ width: 90, height: 90, borderRadius: Radius.pill }}
                    contentFit="cover"
                  />
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}
      </AppBottomSheet>

      <Modal
        visible={previewUri != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUri(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#000000CC',
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing.six,
          }}
        >
          <Pressable
            onPress={() => setPreviewUri(null)}
            hitSlop={8}
            accessibilityLabel={t('common.cancel')}
            style={({ pressed }) => [
              { width: 44, height: 44, position: 'absolute', top: 56, right: 24 },
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: Radius.md,
                backgroundColor: '#FFFFFF22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={22} color="#FFF" weight="bold" />
            </View>
          </Pressable>
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={{ width: '100%', height: '70%', borderRadius: Radius.lg }}
              contentFit="contain"
            />
          ) : null}
        </View>
      </Modal>
    </PageScaffold>
  );
}
