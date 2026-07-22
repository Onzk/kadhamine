import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Wrench } from 'phosphor-react-native';

import { ServiceCard } from '@/components/cards/ServiceCard';
import { Text } from '@/components/ui/ThemedText';
import { ServiceCardSkeleton } from '@/components/ui/Skeleton';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

export const CAROUSEL_CARD_WIDTH = 280;
const GAP = Spacing.four;

interface ServiceCarouselItem {
  service: {
    _id: string;
    title: string;
    description: string;
    price?: number;
    pricingType: 'fixed' | 'negotiable';
    photos: string[];
    averageRating: number;
    reviewCount: number;
    city: string;
  };
  profile?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    isVerified?: boolean;
    isPremium?: boolean;
  } | null;
  category?: {
    icon?: string;
    nameFr: string;
  } | null;
}

interface ServiceCarouselProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  items: ServiceCarouselItem[] | undefined;
  emptyMessage?: string;
  onPressItem: (serviceId: string) => void;
}

/** Section titre + carrousel horizontal de ServiceCard — snap par carte. */
export function ServiceCarousel({
  title,
  actionLabel,
  onAction,
  items,
  emptyMessage = 'Aucun service pour le moment.',
  onPressItem,
}: ServiceCarouselProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ marginBottom: Spacing.eight }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: Spacing.four,
          marginBottom: Spacing.four,
        }}
      >
        <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={[textStyle('button'), { color: colors.ink }]}>{actionLabel} →</Text>
          </Pressable>
        ) : null}
      </View>

      {items === undefined ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.four, gap: GAP }}
        >
          <View style={{ width: CAROUSEL_CARD_WIDTH }}>
            <ServiceCardSkeleton />
          </View>
          <View style={{ width: CAROUSEL_CARD_WIDTH }}>
            <ServiceCardSkeleton />
          </View>
        </ScrollView>
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.nine, paddingHorizontal: Spacing.six }}>
          <Wrench size={36} color={colors.muted} />
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12 }}>{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CAROUSEL_CARD_WIDTH + GAP}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: Spacing.four, gap: GAP }}
        >
          {items.map((item) => (
            <View key={item.service._id} style={{ width: CAROUSEL_CARD_WIDTH }}>
              <ServiceCard
                title={item.service.title}
                description={item.service.description}
                price={item.service.price}
                pricingType={item.service.pricingType}
                photo={item.service.photos[0]}
                rating={item.service.averageRating}
                reviewCount={item.service.reviewCount}
                providerName={
                  item.profile ? `${item.profile.firstName} ${item.profile.lastName}` : 'Prestataire'
                }
                providerAvatar={item.profile?.avatarUrl}
                city={item.service.city}
                isVerified={item.profile?.isVerified}
                isPremium={item.profile?.isPremium}
                categoryIcon={item.category?.icon}
                categoryLabel={item.category?.nameFr}
                onPress={() => onPressItem(item.service._id)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
