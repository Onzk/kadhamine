import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { UsersThree } from 'phosphor-react-native';

import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

type StatusFilter = 'pending' | 'active' | 'suspended' | 'rejected' | 'all';

const FILTERS: StatusFilter[] = ['pending', 'active', 'suspended', 'rejected', 'all'];

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');

  const users = useQuery(api.admin.listUsers, {
    status: filter === 'all' ? undefined : filter,
  });
  const updateStatus = useMutation(api.admin.updateUserStatus);
  const setPremium = useMutation(api.admin.setPremium);

  const filtered = useMemo(() => {
    if (!users) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(({ user, profile }) => {
      const name = profile
        ? `${profile.firstName} ${profile.lastName}`
        : user.name ?? '';
      return (
        name.toLowerCase().includes(q) ||
        (user.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const runStatus = (
    userId: Id<'users'>,
    status: 'active' | 'rejected' | 'suspended',
    confirmKey: string,
    successKey: string,
    destructive = false,
  ) => {
    confirm({
      title: t(confirmKey),
      confirmLabel: t('common.confirm'),
      destructive,
      onConfirm: async () => {
        await updateStatus({ userId, status });
        alert({ title: t('admin.success'), message: t(successKey) });
      },
    });
  };

  const runPremium = (userId: Id<'users'>, isPremium: boolean) => {
    confirm({
      title: t(isPremium ? 'admin.confirmPremiumOn' : 'admin.confirmPremiumOff'),
      confirmLabel: t('common.confirm'),
      destructive: !isPremium,
      onConfirm: async () => {
        await setPremium({ userId, isPremium });
        alert({ title: t('admin.success'), message: t('admin.premiumUpdated') });
      },
    });
  };

  const filterLabel = (f: StatusFilter) => {
    if (f === 'all') return t('common.all');
    if (f === 'pending') return t('admin.statusPending');
    if (f === 'active') return t('admin.statusActive');
    if (f === 'suspended') return t('admin.statusSuspended');
    return t('admin.statusRejected');
  };

  return (
    <PageScaffold
      title={t('admin.usersTitle')}
      subtitle={t('admin.usersSubtitle')}
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
          placeholder={t('admin.usersSearch')}
        />

        {filtered === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersThree}
            title={t('admin.usersEmpty')}
            description={t('admin.usersEmptyDesc')}
          />
        ) : (
          filtered.map(({ user, profile }) => (
            <View
              key={user._id}
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
                  {profile ? `${profile.firstName} ${profile.lastName}` : user.name ?? user.email}
                </Text>
                <Badge label={user.role ?? '?'} />
              </View>
              <Text style={{ fontSize: 13, color: colors.muted }}>{user.email}</Text>
              {profile ? (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {profile.isVerified ? <Badge label={t('common.verified')} variant="verified" /> : null}
                  {profile.isPremium ? <Badge label={t('common.premium')} variant="premium" /> : null}
                  <Badge label={user.status ?? '?'} />
                </View>
              ) : (
                <Badge label={user.status ?? '?'} />
              )}

              <SheetActionsFooter>
                {user.status === 'pending' && user.role === 'provider' ? (
                  <SheetActionRow>
                    <SheetActionSlot>
                      <AuthPrimaryButton
                        title={t('admin.approve')}
                        fill
                        flat
                        onPress={() =>
                          runStatus(
                            user._id,
                            'active',
                            'admin.confirmApproveUser',
                            'admin.userApproved',
                          )
                        }
                      />
                    </SheetActionSlot>
                    <SheetActionSlot>
                      <AuthPrimaryButton
                        title={t('admin.reject')}
                        tone="danger"
                        fill
                        flat
                        onPress={() =>
                          runStatus(
                            user._id,
                            'rejected',
                            'admin.confirmRejectUser',
                            'admin.userRejected',
                            true,
                          )
                        }
                      />
                    </SheetActionSlot>
                  </SheetActionRow>
                ) : null}

                {user.status === 'active' ? (
                  <AuthPrimaryButton
                    title={t('admin.suspend')}
                    tone="outline"
                    flat
                    onPress={() =>
                      runStatus(
                        user._id,
                        'suspended',
                        'admin.confirmSuspendUser',
                        'admin.userSuspended',
                        true,
                      )
                    }
                  />
                ) : null}

                {user.status === 'suspended' || user.status === 'rejected' ? (
                  <AuthPrimaryButton
                    title={t('admin.reactivate')}
                    flat
                    onPress={() =>
                      runStatus(
                        user._id,
                        'active',
                        'admin.confirmReactivateUser',
                        'admin.userReactivated',
                      )
                    }
                  />
                ) : null}

                {user.role === 'provider' && profile ? (
                  <AuthPrimaryButton
                    title={
                      profile.isPremium ? t('admin.removePremium') : t('admin.activatePremium')
                    }
                    tone={profile.isPremium ? 'outline' : 'orbit'}
                    flat
                    onPress={() => runPremium(user._id, !profile.isPremium)}
                  />
                ) : null}
              </SheetActionsFooter>
            </View>
          ))
        )}
      </View>
    </PageScaffold>
  );
}
