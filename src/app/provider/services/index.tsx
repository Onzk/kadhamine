import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wrench,
  Plus,
  Trash,
  PencilSimple,
  CaretRight,
  CheckCircle,
} from 'phosphor-react-native';
import type { Id } from '../../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { FlutterFab } from '@/components/ui/FlutterFab';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

export default function ProviderServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');

  const services = useQuery(api.services.getMine);
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
              onAction={() => router.push('/provider/services/form')}
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
              <Pressable
                key={item.service._id}
                onPress={() =>
                  router.push({
                    pathname: '/provider/services/[id]',
                    params: { id: item.service._id },
                  })
                }
                style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.95 : 1 }]}
              >
                <View
                  style={{
                    backgroundColor: colors.surfaceCard,
                    borderRadius: Radius.lg,
                    padding: Spacing.five,
                    marginBottom: Spacing.three,
                    borderWidth: 0.1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: Spacing.two,
                    }}
                  >
                    <Text
                      style={[
                        textStyle('body'),
                        { fontWeight: '600', color: colors.ink, flex: 1 },
                      ]}
                    >
                      {item.service.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.oneHalf,
                      }}
                    >
                      <Badge
                        label={
                          item.service.isActive
                            ? t('services.active')
                            : t('services.paused')
                        }
                        variant={item.service.isActive ? 'verified' : 'danger'}
                      />
                      <CaretRight size={16} color={colors.muted} />
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.muted,
                      marginTop: Spacing.one,
                    }}
                    numberOfLines={2}
                  >
                    {item.service.description}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.orbit,
                      fontWeight: '600',
                      marginTop: Spacing.two,
                    }}
                  >
                    {item.category?.nameFr}
                    {item.service.price != null
                      ? ` · ${formatPrice(item.service.price)}`
                      : ` · ${t('common.negotiable')}`}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: Spacing.two,
                      marginTop: Spacing.four,
                    }}
                  >
                    <Pressable
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        router.push({
                          pathname: '/provider/services/form',
                          params: { id: item.service._id },
                        });
                      }}
                      style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.9 : 1 }]}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: Spacing.oneHalf,
                          paddingVertical: Spacing.four,
                          paddingHorizontal: Spacing.three,
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
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        toggleActive(item.service._id, item.service.isActive);
                      }}
                      style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.9 : 1 }]}
                    >
                      <View
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: Spacing.four,
                          paddingHorizontal: Spacing.three,
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
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleDelete(item.service._id, item.service.title);
                      }}
                      hitSlop={6}
                      style={({ pressed }) => ({
                        width: 52,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <View
                        style={{
                          height: 52,
                          width: 52,
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
              </Pressable>
            ))
          )}
        </View>
      </PageScaffold>

      <FlutterFab
        absolute
        bottom={Math.max(insets.bottom, 8) + 16}
        onPressed={() => router.push('/provider/services/form')}
        icon={<Plus size={24} color={colors.onOrbit} weight="bold" />}
        backgroundColor={colors.orbit}
        foregroundColor={colors.onOrbit}
        accessibilityLabel={t('services.new')}
      />
    </View>
  );
}
