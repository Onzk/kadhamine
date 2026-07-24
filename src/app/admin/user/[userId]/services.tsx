import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Briefcase, Check, Plus } from 'phosphor-react-native';

import {
  AdminListCard,
  AdminIconWash,
  AdminStatusBadge,
} from '@/components/admin/adminUi';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionRow, SheetActionSlot, SheetActionsFooter } from '@/components/ui/SheetActions';
import { CategoryPickerField } from '@/components/ui/CategoryPickerSheet';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

const MAX_PHOTOS = 5;

type SheetMode = 'create' | 'edit';

type ServiceRow = {
  service: {
    _id: Id<'services'>;
    title: string;
    description: string;
    categoryId: Id<'categories'>;
    price?: number;
    pricingType: 'fixed' | 'negotiable';
    isActive: boolean;
    photos?: string[];
    photoStorageIds?: Id<'_storage'>[];
  };
  category: { nameFr?: string } | null;
};

export default function AdminUserServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>();
  const userId = userIdParam as Id<'users'>;

  const rows = useQuery(api.admin.listUserServices, userId ? { userId } : 'skip');
  const upsert = useMutation(api.admin.upsertUserService);
  const deactivate = useMutation(api.admin.deactivateUserService);

  const [mode, setMode] = useState<SheetMode | null>(null);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [photos, setPhotos] = useState<ImagePickerValueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const list = useMemo(() => (rows ?? []) as ServiceRow[], [rows]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setCategoryId(null);
    setPrice('');
    setIsActive(true);
    setPhotos([]);
    setMode('create');
  };

  const openEdit = (row: ServiceRow) => {
    setEditing(row);
    setTitle(row.service.title);
    setDescription(row.service.description);
    setCategoryId(row.service.categoryId);
    setPrice(row.service.price != null ? String(row.service.price) : '');
    setIsActive(row.service.isActive);
    setPhotos(
      (row.service.photos ?? []).map((uri, i) => ({
        uri,
        storageId: row.service.photoStorageIds?.[i],
      })),
    );
    setMode('edit');
  };

  const closeSheet = () => {
    setMode(null);
    setEditing(null);
    setPhotos([]);
  };

  const save = async () => {
    if (!title.trim() || !description.trim() || !categoryId) return;
    const priceNum = price.trim() ? Number(price.replace(',', '.')) : undefined;
    if (price.trim() && (Number.isNaN(priceNum!) || priceNum! < 0)) {
      alert({ title: t('common.error'), message: t('common.errorDesc') });
      return;
    }

    const photoStorageIds = photos
      .map((p) => p.storageId)
      .filter((id): id is Id<'_storage'> => !!id);
    const photoUrls = photos.map((p) => p.uri);
    const allPhotosHaveStorage =
      photos.length > 0 && photos.every((p) => !!p.storageId);
    const photoPayload =
      photos.length === 0
        ? { photos: [] as string[], photoStorageIds: [] as Id<'_storage'>[] }
        : allPhotosHaveStorage
          ? { photoStorageIds }
          : { photos: photoUrls };

    setLoading(true);
    try {
      await upsert({
        userId,
        serviceId: editing?.service._id,
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId as Id<'categories'>,
        pricingType: 'fixed',
        price: priceNum,
        isActive,
        ...photoPayload,
      });
      closeSheet();
      alert({ title: t('admin.success'), message: t('admin.userServiceSaved') });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.errorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const runDeactivate = () => {
    if (!editing) return;
    confirm({
      title: t('admin.userServiceDeactivate'),
      confirmLabel: t('admin.userServiceDeactivate'),
      destructive: true,
      onConfirm: async () => {
        await deactivate({ serviceId: editing.service._id });
        closeSheet();
        alert({ title: t('admin.success'), message: t('admin.userServiceDeactivated') });
      },
    });
  };

  const canSave = title.trim() && description.trim() && categoryId;

  const footer =
    mode != null ? (
      <SheetActionsFooter>
        <SheetActionRow>
          {mode === 'edit' && editing?.service.isActive ? (
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('admin.userServiceDeactivate')}
                tone="danger"
                fill
                flat
                onPress={runDeactivate}
              />
            </SheetActionSlot>
          ) : (
            <SheetActionSlot>
              <AuthPrimaryButton
                title={t('common.cancel')}
                tone="outline"
                fill
                flat
                onPress={closeSheet}
              />
            </SheetActionSlot>
          )}
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
      title={t('admin.userServicesTitle')}
      subtitle={t('admin.userServicesSubtitle')}
      showBack
      rightAction={
        <Pressable
          onPress={openCreate}
          accessibilityLabel={t('admin.userServiceAdd')}
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
        {rows === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : list.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={t('admin.userServicesEmpty')}
            description={t('admin.userServicesEmptyDesc')}
          />
        ) : (
          list.map((row) => {
            const thumb = row.service.photos?.[0];
            return (
              <AdminListCard
                key={row.service._id}
                onPress={() => openEdit(row)}
                leading={
                  thumb ? (
                    <Image
                      source={{ uri: thumb }}
                      style={{ width: 48, height: 48, borderRadius: Radius.md }}
                      contentFit="cover"
                    />
                  ) : (
                    <AdminIconWash icon={Briefcase} />
                  )
                }
                title={row.service.title}
                subtitle={row.category?.nameFr}
                meta={
                  [
                    row.service.price != null
                      ? formatPrice(row.service.price)
                      : row.service.pricingType,
                    row.service.photos?.length
                      ? t('admin.userServicePhotoCount', {
                          count: row.service.photos.length,
                        })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                }
                badges={
                  <AdminStatusBadge
                    label={
                      row.service.isActive
                        ? t('admin.userServiceActive')
                        : t('admin.userServiceInactive')
                    }
                    status={row.service.isActive ? 'active' : 'suspended'}
                  />
                }
              />
            );
          })
        )}
      </View>

      <AppBottomSheet
        visible={mode != null}
        onClose={closeSheet}
        title={mode === 'create' ? t('admin.userServiceCreate') : t('admin.userServiceEdit')}
        footer={footer}
      >
        <AuthField
          label={t('admin.userServiceTitle')}
          value={title}
          placeholder={t('admin.userServiceTitle')}
          onChangeText={setTitle}
        />
        <AuthField
          label={t('admin.userServiceDescription')}
          value={description}
          placeholder={t('admin.userServiceDescription')}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <CategoryPickerField
          label={t('admin.userServiceCategory')}
          placeholder={t('admin.userServiceCategory')}
          value={categoryId}
          onChange={setCategoryId}
          sheetTitle={t('admin.userServiceCategory')}
        />
        <AuthField
          label={t('admin.userServicePrice')}
          value={price}
          placeholder="5000"
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        <ImagePickerField
          label={t('admin.userServicePhotos')}
          value={photos}
          onChange={setPhotos}
          maxCount={MAX_PHOTOS}
          mode="both"
          mediaTypes="images"
          style={{ marginBottom: Spacing.four }}
        />
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
              {isActive ? <Check size={14} color={colors.onPrimary} weight="bold" /> : null}
            </View>
            <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>
              {t('admin.userServiceActive')}
            </Text>
          </View>
        </Pressable>
      </AppBottomSheet>
    </PageScaffold>
  );
}
