import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Plus, SquaresFour, Check } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminIconWash,
  AdminDetailRow,
  AdminDetailSection,
  AdminStatusBadge,
} from '@/components/admin/adminUi';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

type SheetMode = 'detail' | 'create' | 'edit';

type CategoryRow = {
  _id: Id<'categories'>;
  nameFr: string;
  nameAr?: string;
  nameSara?: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  serviceCount?: number;
};

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminCategoriesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CategoryRow | null>(null);
  const [mode, setMode] = useState<SheetMode>('detail');
  const [loading, setLoading] = useState(false);

  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameSara, setNameSara] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const categories = useQuery(api.categories.listWithCounts, { activeOnly: false });
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  const filtered = useMemo(() => {
    if (!categories) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return categories as CategoryRow[];
    return (categories as CategoryRow[]).filter((c) => {
      const hay = [c.nameFr, c.nameAr ?? '', c.nameSara ?? '', c.slug, c.description ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [categories, search]);

  const fillForm = (c?: CategoryRow | null) => {
    setNameFr(c?.nameFr ?? '');
    setNameAr(c?.nameAr ?? '');
    setNameSara(c?.nameSara ?? '');
    setSlug(c?.slug ?? '');
    setIcon(c?.icon ?? '');
    setDescription(c?.description ?? '');
    setSortOrder(String(c?.sortOrder ?? 0));
    setIsActive(c?.isActive ?? true);
  };

  const closeSheet = () => {
    setSelected(null);
    setMode('detail');
    fillForm(null);
  };

  const openCreate = () => {
    setSelected(null);
    fillForm(null);
    setMode('create');
  };

  const openDetail = (c: CategoryRow) => {
    setSelected(c);
    fillForm(c);
    setMode('detail');
  };

  const openEdit = () => {
    if (!selected) return;
    fillForm(selected);
    setMode('edit');
  };

  const save = async () => {
    if (!nameFr.trim()) return;
    const order = Number(sortOrder);
    setLoading(true);
    try {
      if (mode === 'create') {
        const s = slug.trim() || slugify(nameFr);
        await createCategory({
          nameFr: nameFr.trim(),
          nameAr: nameAr.trim() || undefined,
          nameSara: nameSara.trim() || undefined,
          slug: s,
          icon: icon.trim() || undefined,
          description: description.trim() || undefined,
          sortOrder: Number.isFinite(order) ? order : 0,
        });
      } else if (mode === 'edit' && selected) {
        await updateCategory({
          categoryId: selected._id,
          nameFr: nameFr.trim(),
          nameAr: nameAr.trim() || undefined,
          nameSara: nameSara.trim() || undefined,
          icon: icon.trim() || undefined,
          description: description.trim() || undefined,
          sortOrder: Number.isFinite(order) ? order : 0,
          isActive,
        });
      }
      closeSheet();
      alert({ title: t('admin.success'), message: t('admin.categorySaved') });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.errorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivate = () => {
    if (!selected) return;
    confirm({
      title: t('admin.categoryDeactivate'),
      confirmLabel: t('admin.categoryDeactivate'),
      destructive: true,
      onConfirm: async () => {
        await removeCategory({ categoryId: selected._id });
        closeSheet();
        alert({ title: t('admin.success'), message: t('admin.categoryDeactivated') });
      },
    });
  };

  const footer =
    mode === 'create' || mode === 'edit' ? (
      <SheetActionsFooter>
        <SheetActionRow>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('common.cancel')}
              tone="outline"
              fill
              flat
              onPress={() => {
                if (mode === 'create') closeSheet();
                else {
                  fillForm(selected);
                  setMode('detail');
                }
              }}
            />
          </SheetActionSlot>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('common.save')}
              tone="ink"
              fill
              flat
              loading={loading}
              disabled={!nameFr.trim() || (mode === 'create' && !slug.trim() && !nameFr.trim())}
              onPress={save}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : selected ? (
      <SheetActionsFooter>
        <SheetActionRow>
          {selected.isActive ? (
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('admin.categoryDeactivate')}
                tone="danger"
                fill
                flat
                onPress={deactivate}
              />
            </SheetActionSlot>
          ) : (
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('admin.categoryReactivate')}
                tone="outline"
                fill
                flat
                onPress={async () => {
                  await updateCategory({ categoryId: selected._id, isActive: true });
                  closeSheet();
                  alert({ title: t('admin.success'), message: t('admin.categorySaved') });
                }}
              />
            </SheetActionSlot>
          )}
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('common.edit')}
              tone="ink"
              fill
              flat
              onPress={openEdit}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : null;

  return (
    <PageScaffold
      title={t('admin.categoriesTitle')}
      subtitle={t('admin.categoriesSubtitle')}
      showBack
      rightAction={
        <Pressable
          onPress={openCreate}
          accessibilityLabel={t('admin.categoryAdd')}
          style={({ pressed }) => [{ width: 44, height: 44 }, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceCard,
              borderWidth: 0.1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={20} color={colors.primary} weight="bold" />
          </View>
        </Pressable>
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.four }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('admin.categoriesSearch')}
        />

        {filtered === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SquaresFour}
            title={t('admin.categoriesEmpty')}
            description={t('admin.categoriesEmptyDesc')}
          />
        ) : (
          filtered.map((c) => (
            <AdminListCard
              key={c._id}
              onPress={() => openDetail(c)}
              leading={<AdminIconWash icon={SquaresFour} />}
              title={c.nameFr}
              subtitle={c.slug}
              meta={t('admin.categoryServiceCount', { count: c.serviceCount ?? 0 })}
              badges={
                <AdminStatusBadge
                  label={c.isActive ? t('admin.categoryActive') : t('admin.categoryInactive')}
                  status={c.isActive ? 'active' : 'suspended'}
                />
              }
            />
          ))
        )}
      </View>

      <AppBottomSheet
        visible={mode === 'create' || selected != null}
        onClose={closeSheet}
        title={
          mode === 'create'
            ? t('admin.categoryCreate')
            : mode === 'edit'
              ? t('admin.categoryEdit')
              : t('admin.categoryDetail')
        }
        subtitle={mode === 'detail' ? selected?.slug : undefined}
        footer={footer}
      >
        {mode === 'detail' && selected ? (
          <AdminDetailSection>
            <AdminDetailRow label={t('admin.categoryNameFr')} value={selected.nameFr} />
            <AdminDetailRow label={t('admin.categoryNameAr')} value={selected.nameAr} />
            <AdminDetailRow label={t('admin.categoryNameSara')} value={selected.nameSara} />
            <AdminDetailRow label={t('admin.categorySlug')} value={selected.slug} />
            <AdminDetailRow label={t('admin.categoryIcon')} value={selected.icon} />
            <AdminDetailRow label={t('admin.categoryDescription')} value={selected.description} />
            <AdminDetailRow label={t('admin.categorySortOrder')} value={selected.sortOrder} />
            <AdminDetailRow
              label={t('admin.detailStatus')}
              value={selected.isActive ? t('admin.categoryActive') : t('admin.categoryInactive')}
            />
            <AdminDetailRow
              label={t('admin.categoryServiceCount', { count: selected.serviceCount ?? 0 })}
              value={String(selected.serviceCount ?? 0)}
            />
          </AdminDetailSection>
        ) : (
          <>
            <AuthField
              label={t('admin.categoryNameFr')}
              value={nameFr}
              placeholder={t('admin.categoryNameFr')}
              onChangeText={(v) => {
                setNameFr(v);
                if (mode === 'create' && (!slug || slug === slugify(nameFr))) {
                  setSlug(slugify(v));
                }
              }}
            />
            <AuthField
              label={t('admin.categoryNameAr')}
              value={nameAr}
              placeholder={t('admin.categoryNameAr')}
              onChangeText={setNameAr}
            />
            <AuthField
              label={t('admin.categoryNameSara')}
              value={nameSara}
              placeholder={t('admin.categoryNameSara')}
              onChangeText={setNameSara}
            />
            {mode === 'create' ? (
              <AuthField
                label={t('admin.categorySlug')}
                value={slug}
                placeholder="ex-category"
                onChangeText={setSlug}
              />
            ) : null}
            <AuthField
              label={t('admin.categoryIcon')}
              value={icon}
              placeholder="briefcase"
              onChangeText={setIcon}
            />
            <AuthField
              label={t('admin.categoryDescription')}
              value={description}
              placeholder={t('admin.categoryDescription')}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <AuthField
              label={t('admin.categorySortOrder')}
              value={sortOrder}
              placeholder="0"
              onChangeText={setSortOrder}
              keyboardType="number-pad"
            />
            {mode === 'edit' ? (
              <Pressable
                onPress={() => setIsActive((v) => !v)}
                style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.three,
                    paddingVertical: Spacing.four,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: Radius.sm,
                      borderWidth: 0.1,
                      borderColor: isActive ? colors.primary : colors.borderStrong,
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isActive ? (
                      <Check size={14} color={colors.onPrimary} weight="bold" />
                    ) : null}
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>
                    {t('admin.categoryActive')}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </>
        )}
      </AppBottomSheet>
    </PageScaffold>
  );
}
