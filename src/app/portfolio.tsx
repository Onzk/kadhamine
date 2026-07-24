import React, { useMemo, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Article,
  Images,
  CheckCircle,
} from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { FormSelect } from '@/components/ui/FormSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { FlutterFab } from '@/components/ui/FlutterFab';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import {
  PortfolioDetailSheet,
  type PortfolioDetailItem,
} from '@/components/portfolio/PortfolioDetailSheet';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

type EditTarget = {
  itemId: Id<'portfolio'>;
  title: string;
  description?: string;
  serviceId?: Id<'services'>;
  mediaUrl?: string | null;
  mediaType: 'image' | 'video' | 'document';
  storageId?: Id<'_storage'>;
};

export default function PortfolioScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const items = useQuery(api.portfolio.listMine);
  const services = useQuery(api.services.getMine);
  const createItem = useMutation(api.portfolio.create);
  const updateItem = useMutation(api.portfolio.update);
  const removeItem = useMutation(api.portfolio.remove);

  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [media, setMedia] = useState<ImagePickerValueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PortfolioDetailItem | null>(null);

  const serviceOptions = useMemo(
    () =>
      (services ?? []).map((item) => ({
        value: item.service._id,
        label: item.service.title,
      })),
    [services],
  );

  const filtered = useMemo(() => {
    if (!items) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const descMatch = (item.description ?? '').toLowerCase().includes(q);
      return titleMatch || descMatch;
    });
  }, [items, search]);

  const resetForm = () => {
    setSheetOpen(false);
    setEditing(null);
    setTitle('');
    setDescription('');
    setServiceId(null);
    setMedia([]);
  };

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setServiceId(null);
    setMedia([]);
    setSheetOpen(true);
  };

  const openEdit = (target: EditTarget) => {
    setEditing(target);
    setTitle(target.title);
    setDescription(target.description ?? '');
    setServiceId(target.serviceId ?? null);
    setMedia(
      target.mediaUrl
        ? [{ uri: target.mediaUrl, storageId: target.storageId }]
        : [],
    );
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const asset = media[0];
    if (!editing && !asset?.storageId) {
      alert({ title: t('portfolio.mediaRequired') });
      return;
    }

    setLoading(true);
    try {
      const mediaType: 'image' | 'video' =
        asset?.mimeType?.startsWith('video/') ? 'video' : 'image';
      const linkedServiceId = (serviceId as Id<'services'> | null) ?? null;

      if (editing) {
        const patch: {
          itemId: Id<'portfolio'>;
          title: string;
          description?: string;
          serviceId: Id<'services'> | null;
          storageId?: Id<'_storage'>;
          mediaType?: 'image' | 'video';
        } = {
          itemId: editing.itemId,
          title: title.trim(),
          description: description.trim() || undefined,
          serviceId: linkedServiceId,
        };
        if (asset?.storageId && asset.storageId !== editing.storageId) {
          patch.storageId = asset.storageId;
          patch.mediaType = mediaType;
        }
        await updateItem(patch);
        resetForm();
        alert({
          title: t('portfolio.updatedTitle'),
          message: t('portfolio.updatedBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
      } else {
        await createItem({
          title: title.trim(),
          description: description.trim() || undefined,
          mediaType,
          storageId: asset!.storageId,
          serviceId: linkedServiceId ?? undefined,
        });
        resetForm();
        alert({
          title: t('portfolio.createdTitle'),
          message: t('portfolio.createdBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
      }
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('portfolio.saveError'),
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (itemId: Id<'portfolio'>, itemTitle: string) => {
    confirm({
      title: t('portfolio.deleteTitle'),
      message: t('portfolio.deleteMessage', { title: itemTitle }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        await removeItem({ itemId });
        alert({
          title: t('portfolio.deletedTitle'),
          message: t('portfolio.deletedBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
      },
    });
  };

  const canSave =
    title.trim().length > 0 &&
    (editing != null || media.some((m) => !!m.storageId));

  const hasNoItems = items !== undefined && items.length === 0;
  const isEmptySearch = filtered !== undefined && filtered.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('service.portfolio')}
        subtitle={t('portfolio.manageSubtitle')}
        showBack
        contentContainerStyle={{ paddingBottom: 100 }}
        headerActions={
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t('portfolio.searchPlaceholder')}
          />
        }
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
          {hasNoItems ? (
            <EmptyState
              icon={Images}
              title={t('portfolio.emptyTitle')}
              description={t('portfolio.emptyDesc')}
              actionLabel={t('portfolio.add')}
              onAction={openCreate}
              actionVariant="primary"
            />
          ) : isEmptySearch ? (
            <EmptyState
              icon={Images}
              title={t('portfolio.emptySearchTitle')}
              description={t('portfolio.emptySearchDesc', { query: search.trim() })}
              actionLabel={t('common.cancel')}
              onAction={() => setSearch('')}
              actionVariant="outline"
            />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: Spacing.two,
              }}
            >
              {filtered?.map((item) => (
                <View key={item._id} style={{ width: '48%', flexGrow: 1 }}>
                  <PortfolioCard
                    item={item}
                    compact
                    onPress={() => setSelected(item)}
                    onEdit={() =>
                      openEdit({
                        itemId: item._id,
                        title: item.title,
                        description: item.description,
                        serviceId: item.serviceId,
                        mediaUrl: item.mediaUrl,
                        mediaType: item.mediaType,
                        storageId: item.storageId,
                      })
                    }
                    onDelete={() => handleDelete(item._id, item.title)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </PageScaffold>

      <FlutterFab
        absolute
        bottom={Math.max(insets.bottom, 8) + 16}
        onPressed={openCreate}
        icon={<Plus size={24} color={colors.onOrbit} weight="bold" />}
        backgroundColor={colors.orbit}
        foregroundColor={colors.onOrbit}
        accessibilityLabel={t('portfolio.add')}
      />

      <AppBottomSheet
        visible={sheetOpen}
        onClose={resetForm}
        title={editing ? t('portfolio.edit') : t('portfolio.add')}
        subtitle={t('portfolio.formSubtitle')}
      >
        <View style={{ alignSelf: 'stretch', width: '100%', gap: Spacing.one }}>
          <AuthField
            label={t('portfolio.fieldTitle')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('portfolio.titlePlaceholder')}
            leftIcon={<Article size={20} />}
          />
          <AuthField
            label={t('portfolio.fieldDescription')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder={t('portfolio.descriptionPlaceholder')}
            style={{
              minHeight: 96,
              textAlignVertical: 'top',
              ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
            }}
          />

          <FormSelect
            label={t('portfolio.fieldService')}
            placeholder={t('portfolio.servicePlaceholder')}
            sheetTitle={t('portfolio.fieldService')}
            options={serviceOptions}
            value={serviceId}
            onChange={setServiceId}
            clearable
            clearLabel={t('portfolio.noService')}
            variant="inline"
          />

          <ImagePickerField
            label={t('portfolio.fieldMedia')}
            value={media}
            onChange={setMedia}
            maxCount={1}
            mode="both"
            mediaTypes="both"
            style={{ marginBottom: Spacing.three }}
          />

          <AuthPrimaryButton
            title={t('common.save')}
            onPress={handleSave}
            loading={loading}
            disabled={!canSave}
            tone="orbit"
            flat
          />
        </View>
      </AppBottomSheet>

      <PortfolioDetailSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        item={selected}
        onOpenService={(sid) => router.push(`/service/${sid}`)}
      />
    </View>
  );
}
