import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { IdentificationCard, X } from 'phosphor-react-native';

import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

type StatusFilter = 'pending' | 'approved' | 'rejected';

const FILTERS: StatusFilter[] = ['pending', 'approved', 'rejected'];

export default function AdminVerificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState<Id<'verificationRequests'> | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const items = useQuery(api.admin.listVerifications, { status: filter });
  const review = useMutation(api.admin.reviewVerification);

  const filtered = useMemo(() => {
    if (!items) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(({ profile, request }) => {
      const name = profile
        ? `${profile.firstName} ${profile.lastName}`
        : '';
      return (
        name.toLowerCase().includes(q) ||
        request.documentType.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const filterLabel = (f: StatusFilter) => {
    if (f === 'pending') return t('admin.statusPending');
    if (f === 'approved') return t('admin.statusApproved');
    return t('admin.statusRejected');
  };

  const approve = (requestId: Id<'verificationRequests'>) => {
    confirm({
      title: t('admin.confirmApproveVerification'),
      confirmLabel: t('admin.approveVerification'),
      onConfirm: async () => {
        await review({ requestId, approved: true });
        alert({ title: t('admin.success'), message: t('admin.verificationApproved') });
      },
    });
  };

  const submitReject = () => {
    if (!rejectId || !notes.trim()) return;
    confirm({
      title: t('admin.confirmRejectVerification'),
      confirmLabel: t('admin.rejectVerification'),
      destructive: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          await review({
            requestId: rejectId,
            approved: false,
            notes: notes.trim(),
          });
          setRejectId(null);
          setNotes('');
          alert({ title: t('admin.success'), message: t('admin.verificationRejected') });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <PageScaffold
      title={t('admin.verificationsTitle')}
      subtitle={t('admin.verificationsSubtitle')}
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
          filtered.map(({ request, profile, docUrl, selfieUrl }) => (
            <View
              key={request._id}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.lg,
                padding: Spacing.five,
                borderWidth: 0.1,
                borderColor: colors.border,
                gap: Spacing.three,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink }}>
                  {profile ? `${profile.firstName} ${profile.lastName}` : '—'}
                </Text>
                <Badge label={request.status} />
              </View>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {request.documentType === 'national_id'
                  ? t('admin.docNationalId')
                  : t('admin.docPassport')}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {docUrl ? (
                  <Pressable
                    onPress={() => setPreviewUri(docUrl)}
                    accessibilityLabel={t('admin.viewImage')}
                    style={({ pressed }) => [
                      { width: 120, height: 80 },
                      { opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Image
                      source={{ uri: docUrl }}
                      style={{ width: 120, height: 80, borderRadius: Radius.sm }}
                      contentFit="cover"
                    />
                  </Pressable>
                ) : null}
                {selfieUrl ? (
                  <Pressable
                    onPress={() => setPreviewUri(selfieUrl)}
                    accessibilityLabel={t('admin.viewImage')}
                    style={({ pressed }) => [
                      { width: 80, height: 80 },
                      { opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Image
                      source={{ uri: selfieUrl }}
                      style={{ width: 80, height: 80, borderRadius: Radius.pill }}
                      contentFit="cover"
                    />
                  </Pressable>
                ) : null}
              </View>

              {request.status === 'pending' ? (
                <SheetActionsFooter>
                  <SheetActionRow>
                    <SheetActionSlot>
                      <AuthPrimaryButton
                        title={t('admin.approveVerification')}
                        fill
                        flat
                        onPress={() => approve(request._id)}
                      />
                    </SheetActionSlot>
                    <SheetActionSlot>
                      <AuthPrimaryButton
                        title={t('admin.rejectVerification')}
                        tone="danger"
                        fill
                        flat
                        onPress={() => {
                          setRejectId(request._id);
                          setNotes('');
                        }}
                      />
                    </SheetActionSlot>
                  </SheetActionRow>
                </SheetActionsFooter>
              ) : request.reviewNotes ? (
                <Text style={{ fontSize: 13, color: colors.muted }}>{request.reviewNotes}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <AppBottomSheet
        visible={rejectId != null}
        onClose={() => {
          setRejectId(null);
          setNotes('');
        }}
        title={t('admin.rejectSheetTitle')}
        subtitle={t('admin.rejectSheetSubtitle')}
      >
        <AuthField
          label={t('admin.notesLabel')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('admin.notesPlaceholder')}
          multiline
          numberOfLines={3}
        />
        <SheetActionsFooter>
          <AuthPrimaryButton
            title={t('admin.rejectVerification')}
            tone="danger"
            flat
            loading={loading}
            disabled={!notes.trim()}
            onPress={submitReject}
          />
        </SheetActionsFooter>
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
