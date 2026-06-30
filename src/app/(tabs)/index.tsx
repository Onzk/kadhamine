import React, { useEffect } from 'react';
import { View, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { FlashList } from '@shopify/flash-list';
import { Search, Bell, Moon, Sun, MapPin, Hand, Wrench } from 'lucide-react-native';

import { ServiceCard } from '@/components/cards/ServiceCard';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/ThemedText';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, toggle, isDark } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const featured = useQuery(api.services.getFeatured, { limit: 10 });
  const seedCategories = useMutation(api.seed.seedCategories);
  const seedSettings = useMutation(api.seed.seedSettings);

  useEffect(() => {
    seedCategories({}).catch(() => {});
    seedSettings({}).catch(() => {});
  }, [seedCategories, seedSettings]);

  const firstName = user?.profile?.firstName ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 14, color: colors.muted }} weight="medium">{t('home.greeting')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, color: colors.ink }} weight="bold">
                {firstName || 'TalentTchad'}
              </Text>
              <Hand size={22} color={colors.accent} style={{ marginLeft: 6 }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => router.push('/map' as never)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.surfaceCard,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MapPin size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={toggle}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.surfaceCard,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {isDark ? <Sun size={18} color={colors.ink} /> : <Moon size={18} color={colors.ink} />}
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.surfaceCard,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Bell size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/search')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceCard,
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 48,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 10,
          }}
        >
          <Search size={18} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 15 }}>{t('home.searchPlaceholder')}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 20,
            backgroundColor: BrandColors.blue,
            borderRadius: 16,
            padding: 20,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: -20,
              top: -20,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: BrandColors.yellow + '30',
            }}
          />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 }}>
            {t('payment.integratedBenefit')}
          </Text>
          <Text style={{ fontSize: 13, color: '#FFFFFFCC', lineHeight: 18 }}>
            {t('payment.offPlatformWarning')}
          </Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>
              {t('home.categories')}
            </Text>
            <Pressable onPress={() => router.push('/map' as never)}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                {t('home.nearYou')} →
              </Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {categories === undefined
              ? Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={{ width: 100, height: 40, marginRight: 8 }} />
                ))
              : categories.map((cat) => (
                  <CategoryChip
                    key={cat._id}
                    label={cat.nameFr}
                    icon={cat.icon}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/search', params: { categoryId: cat._id } })
                    }
                  />
                ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>
            {t('home.featured')}
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/search')}>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
              {t('common.seeAll')}
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          {featured === undefined ? (
            <>
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
            </>
          ) : featured.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Wrench size={40} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12 }}>
                Aucun service pour le moment.{'\n'}Soyez le premier prestataire !
              </Text>
            </View>
          ) : (
            featured.map((item) => (
              <ServiceCard
                key={item.service._id}
                title={item.service.title}
                description={item.service.description}
                price={item.service.price}
                pricingType={item.service.pricingType}
                photo={item.service.photos[0]}
                rating={item.service.averageRating}
                reviewCount={item.service.reviewCount}
                providerName={
                  item.profile
                    ? `${item.profile.firstName} ${item.profile.lastName}`
                    : 'Prestataire'
                }
                city={item.service.city}
                isVerified={item.profile?.isVerified}
                isPremium={item.profile?.isPremium}
                categoryIcon={item.category?.icon}
                onPress={() => router.push(`/service/${item.service._id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
