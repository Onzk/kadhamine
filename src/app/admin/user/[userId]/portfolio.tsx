import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Images, Plus } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminIconWash,
} from '@/components/admin/adminUi';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

type SheetMode = 'create' | 'edit';

type PortfolioItem = {
  _id: Id<'portfolio'>;
  title: string;
  description?: string;
  mediaUrl?: string | null;
  storageId?: Id<'_storage'>;
  sortOrder: number;
};

export default function AdminUserPortfolioScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>();
  const userId = userIdParam as Id<'users'>;

  const items = useQuery(api.admin.listUserPortfolio, userId ? { userId } : 'skip');
  const upsert = useMutation(api.admin.upsertUserPortfolioItem);
  const removeItem = useMutation(api.admin.removeUserPortfolioItem);

  const [mode, setMode] = useState<SheetMode | null>(null);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<ImagePickerValueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const list = useMemo(() => (items ?? []) as PortfolioItem[], [items]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setMedia([]);
    setMode('create');
  };

  const openEdit = (item: PortfolioItem) => {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? '');
    setMedia(
      item.mediaUrl
        ? [{ uri: item.mediaUrl, storageId: item.storageId }]
        : [],
    );
    setMode('edit');
  };

  const closeSheet = () => {
    setMode(null);
    setEditing(null);
    setMedia([]);
  };

  const save = async () => {
    if (!title.trim()) return;
    const asset = media[0];
    if (mode === 'create' && !asset?.storageId) {
      alert({ title: t('common.error'), message: t('admin.userPortfolioImageRequired') });
      return;
    }

    setLoading(true);
    try {
      await upsert({
        userId,
        itemId: editing?._id,
        title: title.trim(),
        description: description.trim() || undefined,
        storageId:
          asset?.storageId && asset.storageId !== editing?.storageId
            ? asset.storageId
            : mode === 'create'
              ? asset?.storageId
              : undefined,
      });
      closeSheet();
      alert({ title: t('admin.success'), message: t('admin.userPortfolioSaved') });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.errorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const runDelete = () => {
    if (!editing) return;
    confirm({
      title: t('admin.userPortfolioDelete'),
      confirmLabel: t('admin.userPortfolioDelete'),
      destructive: true,
      onConfirm: async () => {
        await removeItem({ portfolioId: editing._id });
        closeSheet();
        alert({ title: t('admin.success'), message: t('admin.userPortfolioDeleted') });
      },
    });
  };

  const canSave =
    title.trim().length > 0 &&
    (mode === 'edit' || media.some((m) => !!m.storageId));

  const footer =
    mode != null ? (
      <SheetActionsFooter>
        <SheetActionRow>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={mode === 'edit' ? t('admin.userPortfolioDelete') : t('common.cancel')}
              tone={mode === 'edit' ? 'danger' : 'outline'}
              fill
              flat
              onPress={mode === 'edit' ? runDelete : closeSheet}
            />
          </SheetActionSlot>
          <SheetActionSlot>
            <AuthPrimaryButton
              title={t('common.save')}
              tone="ink"
              fill
              flat
              loading={loading}
              disabled={!canSave}
              onPress={save}
            />
          </SheetActionSlot>
        </SheetActionRow>
      </SheetActionsFooter>
    ) : null;

  return (
    <PageScaffold
      title={t('admin.userPortfolioTitle')}
      subtitle={t('admin.userPortfolioSubtitle')}
      showBack
      rightAction={
        <Pressable
          onPress={openCreate}
          accessibilityLabel={t('admin.userPortfolioAdd')}
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
        {items === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Images}
            title={t('admin.userPortfolioEmpty')}
            description={t('admin.userPortfolioEmptyDesc')}
          />
        ) : (
          list.map((item) => (
            <AdminListCard
              key={item._id}
              onPress={() => openEdit(item)}
              leading={
                item.mediaUrl ? (
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={{ width: 48, height: 48, borderRadius: Radius.md }}
                    contentFit="cover"
                  />
                ) : (
                  <AdminIconWash icon={Images} />
                )
              }
              title={item.title}
              meta={item.description}
            />
          ))
        )}
      </View>

      <AppBottomSheet
        visible={mode != null}
        onClose={closeSheet}
        title={
          mode === 'create' ? t('admin.userPortfolioCreate') : t('admin.userPortfolioEdit')
        }
        footer={footer}
      >
        <AuthField
          label={t('admin.userPortfolioItemTitle')}
          value={title}
          placeholder={t('admin.userPortfolioItemTitle')}
          onChangeText={setTitle}
        />
        <AuthField
          label={t('admin.userPortfolioItemDescription')}
          value={description}
          placeholder={t('admin.userPortfolioItemDescription')}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        <ImagePickerField
          label={t('admin.userPortfolioAdd')}
          value={media}
          onChange={setMedia}
          maxCount={1}
          mediaTypes="images"
        />
      </AppBottomSheet>
    </PageScaffold>
  );
}
