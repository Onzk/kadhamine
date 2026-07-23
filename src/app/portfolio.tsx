import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Trash,
  Article,
  TextAlignLeft,
  Images,
  CheckCircle,
  PencilSimple,
} from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { FlutterFab } from '@/components/ui/FlutterFab';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import {
  PortfolioDetailSheet,
  type PortfolioDetailItem,
} from '@/components/portfolio/PortfolioDetailSheet';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
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
  const [serviceId, setServiceId] = useState<Id<'services'> | null>(null);
  const [media, setMedia] = useState<ImagePickerValueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PortfolioDetailItem | null>(null);

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
          serviceId,
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
          serviceId: serviceId ?? undefined,
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
            filtered?.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => setSelected(item)}
                style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.95 : 1 }]}
              >
                <View
                  style={{
                    backgroundColor: colors.surfaceCard,
                    borderRadius: Radius.xl,
                    marginBottom: 12,
                    overflow: 'hidden',
                    borderWidth: 0.1,
                    borderColor: colors.border,
                  }}
                >
                  {item.mediaUrl && item.mediaType === 'image' ? (
                    <Image
                      source={{ uri: item.mediaUrl }}
                      style={{ width: '100%', height: 160 }}
                      contentFit="cover"
                    />
                  ) : null}
                  <View style={{ padding: 14 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={[
                          textStyle('body'),
                          { fontWeight: '600', color: colors.ink, flex: 1 },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            openEdit({
                              itemId: item._id,
                              title: item.title,
                              description: item.description,
                              serviceId: item.serviceId,
                              mediaUrl: item.mediaUrl,
                              mediaType: item.mediaType,
                              storageId: item.storageId,
                            });
                          }}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            width: 36,
                            height: 36,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <PencilSimple size={18} color={colors.ink} />
                          </View>
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            handleDelete(item._id, item.title);
                          }}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            width: 36,
                            height: 36,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash size={18} color={colors.error} />
                          </View>
                        </Pressable>
                      </View>
                    </View>
                    {item.description ? (
                      <Text style={{ fontSize: 13, color: colors.body, marginTop: 4 }}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))
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
            numberOfLines={2}
            placeholder={t('portfolio.descriptionPlaceholder')}
            leftIcon={<TextAlignLeft size={20} />}
          />

          <Text
            style={[
              textStyle('body'),
              { color: colors.ink, fontWeight: '600', marginBottom: Spacing.two },
            ]}
          >
            {t('portfolio.fieldService')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.three }}
          >
            <CategoryChip
              label={t('portfolio.noService')}
              selected={serviceId == null}
              onPress={() => setServiceId(null)}
            />
            {services?.map((item) => (
              <CategoryChip
                key={item.service._id}
                label={item.service.title}
                selected={serviceId === item.service._id}
                onPress={() => setServiceId(item.service._id)}
              />
            ))}
          </ScrollView>

          <ImagePickerField
            label={t('portfolio.fieldMedia')}
            value={media}
            onChange={setMedia}
            maxCount={1}
            mode="both"
            mediaTypes="both"
            style={{ marginBottom: Spacing.three }}
          />

          <SheetActionsFooter style={{ marginTop: Spacing.one }}>
            <SheetSingleAction>
              <AuthPrimaryButton
                title={t('common.save')}
                onPress={handleSave}
                loading={loading}
                disabled={!canSave}
                tone="ink"
                flat
              />
            </SheetSingleAction>
            <SheetSingleAction>
              <AuthPrimaryButton
                title={t('common.cancel')}
                onPress={resetForm}
                disabled={loading}
                tone="outline"
                flat
              />
            </SheetSingleAction>
          </SheetActionsFooter>
        </View>
      </AppBottomSheet>

      <PortfolioDetailSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        item={selected}
        onOpenService={(id) => router.push(`/service/${id}`)}
      />
    </View>
  );
}
