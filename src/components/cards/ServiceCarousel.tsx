import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Wrench } from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';

import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { ServiceCard } from '@/components/cards/ServiceCard';
import { EmptyState, type EmptyStateAction } from '@/components/ui/EmptyState';
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
  /** @deprecated Préférer emptyTitle */
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: PhosphorIcon;
  emptyActions?: EmptyStateAction[];
  onPressItem: (serviceId: string) => void;
  /** `horizontal` (défaut) = carrousel ; `vertical` = liste pleine largeur. */
  layout?: 'horizontal' | 'vertical';
}

function ServiceCardFromItem({
  item,
  onPress,
  enterIndex = 0,
}: {
  item: ServiceCarouselItem;
  onPress: () => void;
  enterIndex?: number;
}) {
  return (
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
      onPress={onPress}
      enterIndex={enterIndex}
    />
  );
}

/** Section titre + carrousel horizontal ou liste verticale de ServiceCard. */
export function ServiceCarousel({
  title,
  actionLabel,
  onAction,
  items,
  emptyMessage = 'Aucun service pour le moment.',
  emptyTitle,
  emptyDescription,
  emptyIcon = Wrench,
  emptyActions,
  onPressItem,
  layout = 'horizontal',
}: ServiceCarouselProps) {
  const { colors } = useAppTheme();
  const isVertical = layout === 'vertical';
  const resolvedEmptyTitle = emptyTitle ?? emptyMessage;

  return (
    <View style={{ marginBottom: Spacing.eight }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: PAGE_H_PAD,
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
        isVertical ? (
          <View style={{ paddingHorizontal: PAGE_H_PAD, gap: GAP }}>
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: PAGE_H_PAD, gap: GAP }}
          >
            <View style={{ width: CAROUSEL_CARD_WIDTH }}>
              <ServiceCardSkeleton />
            </View>
            <View style={{ width: CAROUSEL_CARD_WIDTH }}>
              <ServiceCardSkeleton />
            </View>
          </ScrollView>
        )
      ) : items.length === 0 ? (
        <EmptyState
          compact={!isVertical}
          icon={emptyIcon}
          title={resolvedEmptyTitle}
          description={emptyDescription}
          actions={emptyActions}
        />
      ) : isVertical ? (
        <View style={{ paddingHorizontal: PAGE_H_PAD, gap: GAP }}>
          {items.map((item, index) => (
            <ServiceCardFromItem
              key={item.service._id}
              item={item}
              enterIndex={index}
              onPress={() => onPressItem(item.service._id)}
            />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CAROUSEL_CARD_WIDTH + GAP}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: PAGE_H_PAD, gap: GAP }}
        >
          {items.map((item, index) => (
            <View key={item.service._id} style={{ width: CAROUSEL_CARD_WIDTH }}>
              <ServiceCardFromItem
                item={item}
                enterIndex={index}
                onPress={() => onPressItem(item.service._id)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
