import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Briefcase, CaretRight, FunnelSimple, Images, UsersThree, X } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminAvatar,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
  adminRoleLabel,
  adminUserStatusLabel,
  displayName,
  formatAdminDateTime,
  initialsFromName,
  useAdminTabBarPadding,
} from '@/components/admin/adminUi';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

type StatusFilter = 'pending' | 'active' | 'suspended' | 'rejected' | 'all';
type RoleFilter = 'all' | 'client' | 'provider' | 'admin';

const STATUS_FILTERS: StatusFilter[] = ['pending', 'active', 'suspended', 'rejected', 'all'];
const ROLE_FILTERS: RoleFilter[] = ['all', 'client', 'provider', 'admin'];

type UserRow = {
  user: {
    _id: Id<'users'>;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    image?: string | null;
    role?: string | null;
    status?: string | null;
    language?: string | null;
    createdAt?: number;
    updatedAt?: number;
    lastActiveAt?: number;
  };
  profile: {
    firstName?: string;
    lastName?: string;
    city?: string;
    region?: string;
    phone?: string;
    bio?: string;
    skills?: string[];
    avatarUrl?: string;
    isVerified?: boolean;
    isPremium?: boolean;
    averageRating?: number;
    reviewCount?: number;
    hourlyRate?: number;
  } | null;
};

type SheetMode = 'detail' | 'skills';

export default function AdminUsersScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const router = useRouter();
  const { contentPaddingBottom } = useAdminTabBarPadding();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [draftRole, setDraftRole] = useState<RoleFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>('detail');
  const [skillsDraft, setSkillsDraft] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillsLoading, setSkillsLoading] = useState(false);

  const users = useQuery(api.admin.listUsers, {
    status: statusFilter === 'all' ? undefined : statusFilter,
    role: roleFilter === 'all' ? undefined : roleFilter,
  });
  const updateStatus = useMutation(api.admin.updateUserStatus);
  const setPremium = useMutation(api.admin.setPremium);
  const updateSkills = useMutation(api.admin.updateUserSkills);

  const filtered = useMemo(() => {
    if (!users) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return users as UserRow[];
    return (users as UserRow[]).filter(({ user, profile }) => {
      const name = displayName({ profile, user });
      return (
        name.toLowerCase().includes(q) || (user.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const statusLabel = (f: StatusFilter) => {
    if (f === 'all') return t('common.all');
    if (f === 'pending') return t('admin.statusPending');
    if (f === 'active') return t('admin.statusActive');
    if (f === 'suspended') return t('admin.statusSuspended');
    return t('admin.statusRejected');
  };

  const roleLabel = (f: RoleFilter) => {
    if (f === 'all') return t('common.all');
    return adminRoleLabel(t, f);
  };

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
        setSelected(null);
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
        setSelected(null);
        alert({ title: t('admin.success'), message: t('admin.premiumUpdated') });
      },
    });
  };

  const openSkillsEdit = () => {
    if (!selected?.profile) return;
    setSkillsDraft([...(selected.profile.skills ?? [])]);
    setSkillInput('');
    setSheetMode('skills');
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (skillsDraft.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkillsDraft((prev) => [...prev, value]);
    setSkillInput('');
  };

  const saveSkills = async () => {
    if (!selected) return;
    setSkillsLoading(true);
    try {
      await updateSkills({ userId: selected.user._id, skills: skillsDraft });
      setSelected({
        ...selected,
        profile: selected.profile
          ? { ...selected.profile, skills: skillsDraft }
          : selected.profile,
      });
      setSheetMode('detail');
      alert({ title: t('admin.success'), message: t('admin.skillsSaved') });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.errorDesc'),
      });
    } finally {
      setSkillsLoading(false);
    }
  };

  const footerActions = () => {
    if (!selected) return null;

    if (sheetMode === 'skills') {
      return (
        <SheetActionsFooter>
          <SheetActionRow>
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('common.cancel')}
                tone="outline"
                fill
                flat
                onPress={() => setSheetMode('detail')}
              />
            </SheetActionSlot>
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('common.save')}
                tone="ink"
                fill
                flat
                loading={skillsLoading}
                onPress={saveSkills}
              />
            </SheetActionSlot>
          </SheetActionRow>
        </SheetActionsFooter>
      );
    }

    const { user, profile } = selected;

    if (user.status === 'pending' && user.role === 'provider') {
      return (
        <SheetActionsFooter>
          <SheetActionRow>
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('admin.approve')}
                tone="ink"
                fill
                flat
                onPress={() =>
                  runStatus(user._id, 'active', 'admin.confirmApproveUser', 'admin.userApproved')
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
        </SheetActionsFooter>
      );
    }

    if (user.status === 'active') {
      return (
        <SheetActionsFooter>
          <SheetActionRow>
            {user.role === 'provider' && profile ? (
              <SheetActionSlot>
                <AuthPrimaryButton
                  title={
                    profile.isPremium ? t('admin.removePremium') : t('admin.activatePremium')
                  }
                  tone={profile.isPremium ? 'outline' : 'ink'}
                  fill
                  flat
                  onPress={() => runPremium(user._id, !profile.isPremium)}
                />
              </SheetActionSlot>
            ) : null}
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('admin.suspend')}
                tone="danger"
                fill
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
            </SheetActionSlot>
          </SheetActionRow>
        </SheetActionsFooter>
      );
    }

    if (user.status === 'suspended' || user.status === 'rejected') {
      return (
        <SheetActionsFooter>
          <AuthPrimaryButton
            title={t('admin.reactivate')}
            tone="ink"
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
        </SheetActionsFooter>
      );
    }

    return null;
  };

  return (
    <PageScaffold
      title={t('admin.usersTitle')}
      subtitle={t('admin.usersSubtitle')}
      bottomInset={false}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      headerActions={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.two }}
        >
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={statusLabel(f)}
              selected={statusFilter === f}
              onPress={() => setStatusFilter(f)}
            />
          ))}
        </ScrollView>
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.four }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.twoHalf,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('admin.usersSearch')}
            />
          </View>
          <Pressable
            onPress={() => {
              setDraftRole(roleFilter);
              setFilterOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('admin.filterType')}
            style={({ pressed }) => [
              { width: 52, height: 52, flexShrink: 0 },
              { opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: colors.surfaceCard,
                borderWidth: 0.1,
                borderColor: roleFilter !== 'all' ? colors.primary : colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FunnelSimple
                size={20}
                color={roleFilter !== 'all' ? colors.primary : colors.ink}
                weight={roleFilter !== 'all' ? 'fill' : 'regular'}
              />
            </View>
          </Pressable>
        </View>

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
          filtered.map((row) => {
            const { user, profile } = row;
            const name = displayName({ profile, user });
            const rating =
              profile?.averageRating != null && profile.reviewCount
                ? `★ ${profile.averageRating.toFixed(1)} (${profile.reviewCount})`
                : undefined;
            return (
              <AdminListCard
                key={user._id}
                onPress={() => setSelected(row)}
                leading={
                  <AdminAvatar
                    uri={profile?.avatarUrl ?? user.image}
                    initials={initialsFromName(name)}
                  />
                }
                title={name}
                subtitle={user.email ?? undefined}
                meta={
                  [profile?.city, profile?.region, rating].filter(Boolean).join(' · ') || undefined
                }
                badges={
                  <>
                    <Badge label={adminRoleLabel(t, user.role)} />
                    <AdminStatusBadge
                      label={adminUserStatusLabel(t, user.status)}
                      status={user.status}
                    />
                    {profile?.isVerified ? (
                      <Badge label={t('common.verified')} variant="verified" />
                    ) : null}
                    {profile?.isPremium ? (
                      <Badge label={t('common.premium')} variant="premium" />
                    ) : null}
                  </>
                }
              />
            );
          })
        )}
      </View>

      <AppBottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t('admin.filterTypeTitle')}
        subtitle={t('admin.filterTypeSubtitle')}
        footer={
          <SheetActionsFooter>
            <SheetActionRow>
              <SheetActionSlot>
                <AuthPrimaryButton
                  title={t('admin.filterReset')}
                  tone="outline"
                  fill
                  flat
                  onPress={() => {
                    setDraftRole('all');
                    setRoleFilter('all');
                    setFilterOpen(false);
                  }}
                />
              </SheetActionSlot>
              <SheetActionSlot>
                <AuthPrimaryButton
                  title={t('admin.filterApply')}
                  tone="ink"
                  fill
                  flat
                  onPress={() => {
                    setRoleFilter(draftRole);
                    setFilterOpen(false);
                  }}
                />
              </SheetActionSlot>
            </SheetActionRow>
          </SheetActionsFooter>
        }
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          {ROLE_FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={roleLabel(f)}
              selected={draftRole === f}
              onPress={() => setDraftRole(f)}
            />
          ))}
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={selected != null}
        onClose={() => {
          setSelected(null);
          setSheetMode('detail');
          setSkillInput('');
        }}
        title={
          sheetMode === 'skills' ? t('admin.skillsEditTitle') : t('admin.userDetailTitle')
        }
        subtitle={
          sheetMode === 'skills'
            ? t('admin.skillsEditSubtitle')
            : selected
              ? displayName(selected)
              : undefined
        }
        footer={footerActions()}
      >
        {selected && sheetMode === 'skills' ? (
          <View style={{ gap: Spacing.four }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
              {skillsDraft.length === 0 ? (
                <Text style={{ color: colors.muted }}>{t('admin.skillsEmpty')}</Text>
              ) : (
                skillsDraft.map((skill) => (
                  <Pressable
                    key={skill}
                    onPress={() => setSkillsDraft((prev) => prev.filter((s) => s !== skill))}
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.one,
                        backgroundColor: colors.iconWash,
                        borderRadius: Radius.pill,
                        paddingHorizontal: Spacing.three,
                        paddingVertical: Spacing.one,
                        borderWidth: 0.1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={[textStyle('caption'), { color: colors.ink }]}>{skill}</Text>
                      <X size={12} color={colors.muted} weight="bold" />
                    </View>
                  </Pressable>
                ))
              )}
            </View>
            <AuthField
              label={t('admin.detailSkills')}
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder={t('admin.skillsPlaceholder')}
              onSubmitEditing={addSkill}
              returnKeyType="done"
            />
            <AuthPrimaryButton
              title={t('admin.skillsAdd')}
              tone="outline"
              flat
              disabled={!skillInput.trim()}
              onPress={addSkill}
            />
          </View>
        ) : selected ? (
          <>
            <AdminDetailSection title={t('admin.detailAccount')}>
              <AdminDetailRow
                label={t('admin.detailRole')}
                value={adminRoleLabel(t, selected.user.role)}
              />
              <AdminDetailRow
                label={t('admin.detailStatus')}
                value={adminUserStatusLabel(t, selected.user.status)}
              />
              <AdminDetailRow label={t('admin.detailEmail')} value={selected.user.email} />
              <AdminDetailRow
                label={t('admin.detailPhone')}
                value={selected.user.phone ?? selected.profile?.phone}
              />
              <AdminDetailRow label={t('admin.detailLanguage')} value={selected.user.language} />
              <AdminDetailRow
                label={t('admin.detailCreated')}
                value={formatAdminDateTime(selected.user.createdAt, i18n.language)}
              />
              <AdminDetailRow
                label={t('admin.detailLastActive')}
                value={formatAdminDateTime(selected.user.lastActiveAt, i18n.language)}
              />
            </AdminDetailSection>
            {selected.profile ? (
              <>
                <AdminDetailSection title={t('admin.detailProfile')}>
                  <AdminDetailRow label={t('admin.detailCity')} value={selected.profile.city} />
                  <AdminDetailRow label={t('admin.detailRegion')} value={selected.profile.region} />
                  <AdminDetailRow label={t('admin.detailBio')} value={selected.profile.bio} />
                  <AdminDetailRow
                    label={t('admin.detailRating')}
                    value={
                      selected.profile.averageRating != null
                        ? `${selected.profile.averageRating.toFixed(1)} (${selected.profile.reviewCount ?? 0})`
                        : undefined
                    }
                  />
                </AdminDetailSection>

                <AdminDetailSection title={t('admin.detailSkills')}>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: Spacing.two,
                      marginBottom: Spacing.three,
                    }}
                  >
                    {(selected.profile.skills ?? []).length === 0 ? (
                      <Text style={{ color: colors.muted }}>{t('admin.skillsEmpty')}</Text>
                    ) : (
                      selected.profile.skills!.map((skill) => (
                        <Badge key={skill} label={skill} />
                      ))
                    )}
                  </View>
                  <AuthPrimaryButton
                    title={t('admin.skillsEdit')}
                    tone="outline"
                    flat
                    onPress={openSkillsEdit}
                  />
                </AdminDetailSection>

                <AdminDetailSection title={t('admin.manageServices')}>
                  {selected.user.role === 'provider' ? (
                    <>
                      <Pressable
                        onPress={() => {
                          const id = selected.user._id;
                          setSelected(null);
                          router.push({
                            pathname: '/admin/user/[userId]/services',
                            params: { userId: id },
                          });
                        }}
                        style={({ pressed }) => [
                          { width: '100%' },
                          { opacity: pressed ? 0.9 : 1 },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Spacing.three,
                            backgroundColor: colors.surfaceCard,
                            borderRadius: Radius.lg,
                            padding: Spacing.four,
                            borderWidth: 0.1,
                            borderColor: colors.border,
                            marginBottom: Spacing.two,
                          }}
                        >
                          <Briefcase size={20} color={colors.primary} />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                textStyle('body'),
                                { fontFamily: fontFamily('body', 'medium'), color: colors.ink },
                              ]}
                            >
                              {t('admin.manageServices')}
                            </Text>
                            <Text style={[textStyle('caption'), { color: colors.muted }]}>
                              {t('admin.manageServicesDesc')}
                            </Text>
                          </View>
                          <CaretRight size={18} color={colors.muted} />
                        </View>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          const id = selected.user._id;
                          setSelected(null);
                          router.push({
                            pathname: '/admin/user/[userId]/portfolio',
                            params: { userId: id },
                          });
                        }}
                        style={({ pressed }) => [
                          { width: '100%' },
                          { opacity: pressed ? 0.9 : 1 },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Spacing.three,
                            backgroundColor: colors.surfaceCard,
                            borderRadius: Radius.lg,
                            padding: Spacing.four,
                            borderWidth: 0.1,
                            borderColor: colors.border,
                          }}
                        >
                          <Images size={20} color={colors.primary} />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                textStyle('body'),
                                { fontFamily: fontFamily('body', 'medium'), color: colors.ink },
                              ]}
                            >
                              {t('admin.managePortfolio')}
                            </Text>
                            <Text style={[textStyle('caption'), { color: colors.muted }]}>
                              {t('admin.managePortfolioDesc')}
                            </Text>
                          </View>
                          <CaretRight size={18} color={colors.muted} />
                        </View>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={{ color: colors.muted }}>{t('admin.manageUnavailable')}</Text>
                  )}
                </AdminDetailSection>
              </>
            ) : null}
          </>
        ) : null}
      </AppBottomSheet>
    </PageScaffold>
  );
}
