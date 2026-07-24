import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from 'convex/react';
import { CaretDown, MagnifyingGlass } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { CategoryMasonryGrid } from '@/components/ui/CategoryMasonryGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

export type CategoryPickerItem = {
  id: string;
  label: string;
  icon?: string;
  slug?: string;
  serviceCount?: number;
};

function useCategoryPickerItems(
  override?: CategoryPickerItem[],
): CategoryPickerItem[] | undefined {
  const queried = useQuery(
    api.categories.listWithCounts,
    override ? 'skip' : { activeOnly: true },
  );

  return useMemo(() => {
    if (override) return override;
    if (queried === undefined) return undefined;
    return queried.map((cat) => ({
      id: cat._id,
      label: cat.nameFr,
      icon: cat.icon,
      slug: cat.slug,
      serviceCount: cat.serviceCount,
    }));
  }, [override, queried]);
}

export interface CategoryPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** When omitted, loads `api.categories.listWithCounts`. */
  categories?: CategoryPickerItem[];
  onSelect: (categoryId: string) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  clearSearchLabel?: string;
}

/**
 * Bottom sheet mirroring the categories tab: search + masonry grid.
 */
export function CategoryPickerSheet({
  visible,
  onClose,
  title,
  subtitle,
  categories: categoriesProp,
  onSelect,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  clearSearchLabel,
}: CategoryPickerSheetProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const categories = useCategoryPickerItems(categoriesProp);

  const filtered = useMemo(() => {
    if (!categories) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.label.toLowerCase().includes(q));
  }, [categories, search]);

  const isEmptyResult = filtered !== undefined && filtered.length === 0;

  const handleSelect = (id: string) => {
    onSelect(id);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      maxHeightRatio={0.92}
      contentContainerStyle={{ paddingHorizontal: 0 }}
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, marginBottom: Spacing.four }}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={
            searchPlaceholder ?? t('services.categorySearchPlaceholder')
          }
        />
      </View>

      <View style={{ marginBottom: Spacing.two }}>
        {isEmptyResult ? (
          <View style={{ paddingHorizontal: PAGE_H_PAD }}>
            <EmptyState
              compact
              icon={MagnifyingGlass}
              title={emptyTitle ?? t('services.categoryEmptyTitle')}
              description={
                emptyDescription ??
                t('services.categoryEmptyDesc', { query: search.trim() })
              }
              actionLabel={clearSearchLabel ?? t('services.categoryClearSearch')}
              onAction={() => setSearch('')}
              actionVariant="outline"
            />
          </View>
        ) : (
          <CategoryMasonryGrid
            categories={filtered}
            onPressCategory={handleSelect}
            variant="picker"
          />
        )}
      </View>
    </AppBottomSheet>
  );
}

export interface CategoryPickerFieldProps {
  label: string;
  placeholder: string;
  value: string | null | undefined;
  onChange: (categoryId: string | null) => void;
  sheetTitle?: string;
  sheetSubtitle?: string;
  disabled?: boolean;
  /** Optional preloaded categories (same shape as sheet items). */
  categories?: CategoryPickerItem[];
}

/**
 * Form field that opens {@link CategoryPickerSheet} — drop-in for category select.
 */
export function CategoryPickerField({
  label,
  placeholder,
  value,
  onChange,
  sheetTitle,
  sheetSubtitle,
  disabled = false,
  categories: categoriesProp,
}: CategoryPickerFieldProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const categories = useCategoryPickerItems(categoriesProp);

  const selectedLabel = useMemo(() => {
    if (value == null || value === '') return null;
    return categories?.find((c) => c.id === value)?.label ?? null;
  }, [categories, value]);

  const display = selectedLabel ?? placeholder;
  const isPlaceholder = selectedLabel == null;

  return (
    <View style={{ marginBottom: Spacing.three }}>
      <Text
        style={[
          textStyle('caption'),
          {
            fontFamily: fontFamily('body', 'medium'),
            color: colors.ink,
            marginBottom: Spacing.two,
          },
        ]}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => {
          if (disabled) return;
          setOpen(true);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        })}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 52,
            paddingHorizontal: Spacing.four,
            backgroundColor: colors.surfaceCard,
            borderRadius: 12,
            borderWidth: 0.1,
            borderColor: open ? colors.orbit : colors.borderStrong,
            gap: Spacing.two,
          }}
        >
          <Text
            style={[
              textStyle('body'),
              {
                flex: 1,
                color: isPlaceholder ? colors.muted : colors.ink,
              },
            ]}
            numberOfLines={1}
          >
            {display}
          </Text>
          <CaretDown size={18} color={colors.muted} weight="bold" />
        </View>
      </Pressable>

      <CategoryPickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={sheetTitle ?? label}
        subtitle={sheetSubtitle ?? t('services.categorySheetSubtitle')}
        categories={categories}
        onSelect={(id) => onChange(id)}
      />
    </View>
  );
}
