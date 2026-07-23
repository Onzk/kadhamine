import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wrench,
  Plus,
  TextAlignLeft,
  CurrencyCircleDollar,
  Article,
  CalendarBlank,
  MapPin,
  CheckCircle,
  Trash,
  PencilSimple,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { FlutterFab } from '@/components/ui/FlutterFab';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

type PricingType = 'fixed' | 'negotiable';
type Availability = 'available' | 'busy' | 'unavailable';

type EditTarget = {
  serviceId: Id<'services'>;
  title: string;
  description: string;
  price?: number;
  pricingType: PricingType;
  categoryId: Id<'categories'>;
  deliveryDays?: number;
  availability: Availability;
  city: string;
  region: string;
  photos: string[];
  photoStorageIds?: Id<'_storage'>[];
};

const MAX_PHOTOS = 5;

export default function ProviderServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('fixed');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [deliveryDays, setDeliveryDays] = useState('');
  const [availability, setAvailability] = useState<Availability>('available');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [photos, setPhotos] = useState<ImagePickerValueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const services = useQuery(api.services.getMine);
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const removeService = useMutation(api.services.remove);

  const filtered = useMemo(() => {
    if (!services) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((item) => {
      const titleMatch = item.service.title.toLowerCase().includes(q);
      const catMatch = (item.category?.nameFr ?? '').toLowerCase().includes(q);
      return titleMatch || catMatch;
    });
  }, [services, search]);

  const resetForm = () => {
    setSheetOpen(false);
    setEditing(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setPricingType('fixed');
    setCategoryId(undefined);
    setDeliveryDays('');
    setAvailability('available');
    setCity('');
    setRegion('');
    setPhotos([]);
  };

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setPricingType('fixed');
    setCategoryId(undefined);
    setDeliveryDays('');
    setAvailability('available');
    setCity('');
    setRegion('');
    setPhotos([]);
    setSheetOpen(true);
  };

  const openEdit = (target: EditTarget) => {
    setEditing(target);
    setTitle(target.title);
    setDescription(target.description);
    setPrice(target.price != null ? String(target.price) : '');
    setPricingType(target.pricingType);
    setCategoryId(target.categoryId);
    setDeliveryDays(target.deliveryDays != null ? String(target.deliveryDays) : '');
    setAvailability(target.availability);
    setCity(target.city);
    setRegion(target.region);
    setPhotos(
      target.photos.map((uri, i) => ({
        uri,
        storageId: target.photoStorageIds?.[i],
      })),
    );
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;
    if (!editing && !categoryId) return;
    if (pricingType === 'fixed' && !price.trim()) return;

    setLoading(true);
    try {
      const photoStorageIds = photos
        .map((p) => p.storageId)
        .filter((id): id is Id<'_storage'> => !!id);
      const photoUrls = photos.map((p) => p.uri);
      const parsedPrice =
        pricingType === 'fixed' && price.trim()
          ? parseInt(price, 10)
          : undefined;
      const parsedDays = deliveryDays.trim()
        ? parseInt(deliveryDays, 10)
        : undefined;

      const allPhotosHaveStorage =
        photos.length > 0 && photos.every((p) => !!p.storageId);
      const photoPayload =
        photos.length === 0
          ? { photos: [] as string[], photoStorageIds: [] as Id<'_storage'>[] }
          : allPhotosHaveStorage
            ? { photoStorageIds }
            : { photos: photoUrls };

      if (editing) {
        await updateService({
          serviceId: editing.serviceId,
          title: title.trim(),
          description: description.trim(),
          categoryId: (categoryId as Id<'categories'>) ?? editing.categoryId,
          pricingType,
          price: parsedPrice,
          deliveryDays: parsedDays,
          availability,
          city: city.trim() || undefined,
          region: region.trim() || undefined,
          ...photoPayload,
        });
        resetForm();
        alert({
          title: t('services.updatedTitle'),
          message: t('services.updatedBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
      } else {
        await createService({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId as Id<'categories'>,
          pricingType,
          price: parsedPrice,
          deliveryDays: parsedDays,
          availability,
          useProviderLocation: true,
          ...photoPayload,
        });
        resetForm();
        alert({
          title: t('services.createdTitle'),
          message: t('services.createdBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
      }
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (serviceId: Id<'services'>, isActive: boolean) => {
    try {
      await updateService({ serviceId, isActive: !isActive });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.error'),
      });
    }
  };

  const handleDelete = (serviceId: Id<'services'>, serviceTitle: string) => {
    confirm({
      title: t('services.deleteTitle'),
      message: t('services.deleteMessage', { title: serviceTitle }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        await removeService({ serviceId });
        alert({
          title: t('services.deletedTitle'),
          message: t('services.deletedBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
      },
    });
  };

  const canSave =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    (!!editing || !!categoryId) &&
    (pricingType === 'negotiable' || !!price.trim());

  const isEmptyList = filtered !== undefined && filtered.length === 0;
  const hasNoServices = services !== undefined && services.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('profile.myServices')}
        subtitle={t('services.manageSubtitle')}
        showBack
        contentContainerStyle={{ paddingBottom: 100 }}
        headerActions={
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t('services.searchPlaceholder')}
          />
        }
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
          {hasNoServices ? (
            <EmptyState
              icon={Wrench}
              title={t('services.emptyTitle')}
              description={t('services.emptyDesc')}
              actionLabel={t('services.new')}
              onAction={openCreate}
              actionVariant="primary"
            />
          ) : isEmptyList ? (
            <EmptyState
              icon={Wrench}
              title={t('services.emptySearchTitle')}
              description={t('services.emptySearchDesc', { query: search.trim() })}
              actionLabel={t('common.cancel')}
              onAction={() => setSearch('')}
              actionVariant="outline"
            />
          ) : (
            filtered?.map((item) => (
              <View
                key={item.service._id}
                style={{
                  backgroundColor: colors.surfaceCard,
                  borderRadius: Radius.xl,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 0.1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text
                    style={[
                      textStyle('body'),
                      { fontWeight: '600', color: colors.ink, flex: 1 },
                    ]}
                  >
                    {item.service.title}
                  </Text>
                  <Badge
                    label={
                      item.service.isActive
                        ? t('services.active')
                        : t('services.paused')
                    }
                    variant={item.service.isActive ? 'verified' : 'danger'}
                  />
                </View>
                <Text
                  style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}
                  numberOfLines={2}
                >
                  {item.service.description}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.primary,
                    fontWeight: '600',
                    marginTop: 8,
                  }}
                >
                  {item.category?.nameFr}
                  {item.service.price != null
                    ? ` · ${formatPrice(item.service.price)}`
                    : ` · ${t('common.negotiable')}`}
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Pressable
                    onPress={() =>
                      openEdit({
                        serviceId: item.service._id,
                        title: item.service.title,
                        description: item.service.description,
                        price: item.service.price,
                        pricingType: item.service.pricingType,
                        categoryId: item.service.categoryId,
                        deliveryDays: item.service.deliveryDays,
                        availability: item.service.availability,
                        city: item.service.city,
                        region: item.service.region,
                        photos: item.service.photos ?? [],
                        photoStorageIds: item.service.photoStorageIds,
                      })
                    }
                    style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 12,
                        borderRadius: Radius.md,
                        borderWidth: 0.1,
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceCard,
                      }}
                    >
                      <PencilSimple size={16} color={colors.ink} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>
                        {t('services.edit')}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      toggleActive(item.service._id, item.service.isActive)
                    }
                    style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.9 : 1 }]}
                  >
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: Radius.md,
                        backgroundColor: item.service.isActive
                          ? colors.iconWash
                          : colors.orbit,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: item.service.isActive
                            ? colors.ink
                            : colors.onOrbit,
                        }}
                      >
                        {item.service.isActive
                          ? t('services.pause')
                          : t('services.activate')}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      handleDelete(item.service._id, item.service.title)
                    }
                    hitSlop={6}
                    style={({ pressed }) => ({
                      width: 48,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View
                      style={{
                        height: 44,
                        width: 48,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: Radius.md,
                        backgroundColor: colors.error + '14',
                      }}
                    >
                      <Trash size={18} color={colors.error} />
                    </View>
                  </Pressable>
                </View>
              </View>
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
        accessibilityLabel={t('services.new')}
      />

      <AppBottomSheet
        visible={sheetOpen}
        onClose={resetForm}
        title={editing ? t('services.edit') : t('services.new')}
        subtitle={t('services.formSubtitle')}
      >
        <View style={{ alignSelf: 'stretch', width: '100%', gap: Spacing.one }}>
          <AuthField
            label={t('services.fieldTitle')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('services.titlePlaceholder')}
            leftIcon={<Article size={20} />}
          />
          <AuthField
            label={t('services.fieldDescription')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholder={t('services.descriptionPlaceholder')}
            leftIcon={<TextAlignLeft size={20} />}
          />

          <Text
            style={[
              textStyle('body'),
              { color: colors.ink, fontWeight: '600', marginBottom: Spacing.two },
            ]}
          >
            {t('services.fieldCategory')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.three }}
          >
            {categories?.map((cat) => (
              <CategoryChip
                key={cat._id}
                label={cat.nameFr}
                icon={cat.icon}
                selected={categoryId === cat._id}
                onPress={() => setCategoryId(cat._id)}
              />
            ))}
          </ScrollView>

          <Text
            style={[
              textStyle('body'),
              { color: colors.ink, fontWeight: '600', marginBottom: Spacing.two },
            ]}
          >
            {t('services.fieldPricing')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.three }}>
            <CategoryChip
              label={t('service.fixedPrice')}
              selected={pricingType === 'fixed'}
              onPress={() => setPricingType('fixed')}
            />
            <CategoryChip
              label={t('common.negotiable')}
              selected={pricingType === 'negotiable'}
              onPress={() => {
                setPricingType('negotiable');
                setPrice('');
              }}
            />
          </View>

          {pricingType === 'fixed' ? (
            <AuthField
              label={t('services.fieldPrice')}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="25000"
              leftIcon={<CurrencyCircleDollar size={20} />}
            />
          ) : null}

          <AuthField
            label={t('services.fieldDeliveryDays')}
            value={deliveryDays}
            onChangeText={setDeliveryDays}
            keyboardType="numeric"
            placeholder="3"
            leftIcon={<CalendarBlank size={20} />}
          />

          <Text
            style={[
              textStyle('body'),
              { color: colors.ink, fontWeight: '600', marginBottom: Spacing.two },
            ]}
          >
            {t('services.fieldAvailability')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.three }}>
            {(
              [
                ['available', t('common.available')],
                ['busy', t('common.busy')],
                ['unavailable', t('common.unavailable')],
              ] as const
            ).map(([value, label]) => (
              <CategoryChip
                key={value}
                label={label}
                selected={availability === value}
                onPress={() => setAvailability(value)}
              />
            ))}
          </View>

          {editing ? (
            <>
              <AuthField
                label={t('services.fieldCity')}
                value={city}
                onChangeText={setCity}
                placeholder="N'Djamena"
                leftIcon={<MapPin size={20} />}
              />
              <AuthField
                label={t('services.fieldRegion')}
                value={region}
                onChangeText={setRegion}
                placeholder="N'Djamena"
                leftIcon={<MapPin size={20} />}
              />
            </>
          ) : (
            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                marginBottom: Spacing.three,
                lineHeight: 18,
              }}
            >
              {t('services.useProfileLocationHint')}
            </Text>
          )}

          <ImagePickerField
            label={t('services.fieldPhotos')}
            value={photos}
            onChange={setPhotos}
            maxCount={MAX_PHOTOS}
            mode="both"
            mediaTypes="images"
            style={{ marginBottom: Spacing.three }}
          />

          <SheetActionsFooter style={{ marginTop: Spacing.one }}>
            <SheetSingleAction>
              <AuthPrimaryButton
                title={t('services.save')}
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
    </View>
  );
}
