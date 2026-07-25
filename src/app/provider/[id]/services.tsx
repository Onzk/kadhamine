import React, { useMemo, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wrench } from 'phosphor-react-native';
import type { Id } from '../../../../convex/_generated/dataModel';

import { ServiceCard } from '@/components/cards/ServiceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

const ALL_KEY = 'all';

function categoryLabel(
  category: { nameFr: string; nameAr?: string; nameSara?: string } | null | undefined,
  lang: string,
) {
  if (!category) return null;
  if (lang === 'ar' && category.nameAr) return category.nameAr;
  if (lang === 'sara' && category.nameSara) return category.nameSara;
  return category.nameFr;
}

export default function ProviderServicesListScreen() {
  const rawId = useLocalSearchParams<{ id?: string | string[] }>().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [categoryKey, setCategoryKey] = useState(ALL_KEY);

  const profileId =
    typeof id === 'string' && id.length > 0 ? (id as Id<'profiles'>) : null;

  const data = useQuery(
    api.profiles.getPublicProvider,
    profileId ? { profileId } : 'skip',
  );

  const profile = data?.profile ?? null;
  const services = data?.services ?? [];
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';

  const categoryTabs = useMemo((): PillTabItem[] => {
    const seen = new Map<string, string>();
    for (const service of services) {
      const cat = service.category;
      if (!cat?._id) continue;
      if (!seen.has(cat._id)) {
        seen.set(cat._id, categoryLabel(cat, i18n.language) ?? cat.nameFr);
      }
    }
    return [
      { key: ALL_KEY, label: t('common.all') },
      ...Array.from(seen.entries()).map(([key, label]) => ({ key, label })),
    ];
  }, [services, i18n.language, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((service) => {
      if (categoryKey !== ALL_KEY && service.category?._id !== categoryKey) {
        return false;
      }
      if (!q) return true;
      const titleMatch = service.title.toLowerCase().includes(q);
      const descMatch = service.description.toLowerCase().includes(q);
      const catMatch = (categoryLabel(service.category, i18n.language) ?? '')
        .toLowerCase()
        .includes(q);
      return titleMatch || descMatch || catMatch;
    });
  }, [services, search, categoryKey, i18n.language]);

  const bottomPad = Math.max(insets.bottom, Spacing.three) + Spacing.eight;

  if (data === undefined) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.orbit} />
      </View>
    );
  }

  if (data === null || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <PageScaffold title={t('common.services')} showBack>
          <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.eight }}>
            <Text style={[textStyle('featureHeading'), { color: colors.ink, textAlign: 'center' }]}>
              {t('provider.notFound')}
            </Text>
            <Text
              style={[
                textStyle('body'),
                { color: colors.muted, textAlign: 'center', marginTop: Spacing.two },
              ]}
            >
              {t('provider.notFoundDesc')}
            </Text>
          </View>
        </PageScaffold>
      </View>
    );
  }

  const hasNoServices = services.length === 0;
  const isEmptyFilter = !hasNoServices && filtered.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('common.services')}
        subtitle={t('provider.servicesListSubtitle', { name: fullName })}
        showBack
        contentContainerStyle={{ paddingBottom: bottomPad }}
        headerActions={
          <View style={{ gap: Spacing.three }}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('services.searchPlaceholder')}
            />
            {categoryTabs.length > 1 ? (
              <PillTabs
                tabs={categoryTabs}
                activeKey={categoryKey}
                onChange={setCategoryKey}
              />
            ) : null}
          </View>
        }
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.three }}>
          {hasNoServices ? (
            <EmptyState
              icon={Wrench}
              title={t('provider.noServices')}
              description={t('provider.servicesListEmptyDesc')}
            />
          ) : isEmptyFilter ? (
            <EmptyState
              icon={Wrench}
              title={t('services.emptySearchTitle')}
              description={
                search.trim()
                  ? t('services.emptySearchDesc', { query: search.trim() })
                  : t('provider.servicesFilterEmpty')
              }
              actionLabel={t('common.cancel')}
              onAction={() => {
                setSearch('');
                setCategoryKey(ALL_KEY);
              }}
              actionVariant="outline"
            />
          ) : (
            filtered.map((service, index) => {
              const catLabel = categoryLabel(service.category, i18n.language);
              return (
                <ServiceCard
                  key={service._id}
                  layout="list"
                  title={service.title}
                  description={service.description}
                  price={service.price}
                  pricingType={service.pricingType}
                  photo={service.photos?.[0]}
                  rating={service.averageRating}
                  reviewCount={service.reviewCount}
                  providerName={fullName}
                  providerAvatar={profile.avatarUrl}
                  city={service.city}
                  isVerified={profile.isVerified}
                  isPremium={profile.isPremium}
                  categoryIcon={service.category?.icon}
                  categoryLabel={catLabel ?? undefined}
                  onPress={() => router.push(`/service/${service._id}`)}
                  showChevron
                  enterIndex={index}
                />
              );
            })
          )}
        </View>
      </PageScaffold>
    </View>
  );
}
