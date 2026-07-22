import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { ArrowRight, type Icon as PhosphorIcon } from 'phosphor-react-native';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Text } from '@/components/ui/ThemedText';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = PAGE_H_PAD;
const SLIDE_GAP = Spacing.four;
/** Largeur slide — laisse entrevoir la slide suivante (~20px). */
const SLIDE_WIDTH = SCREEN_WIDTH - H_PADDING * 2 - Spacing.five;
const SNAP_INTERVAL = SLIDE_WIDTH + SLIDE_GAP;

export type PromoSlideVariant = 'dark' | 'light' | 'warm';

export interface PromoSlideData {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: PhosphorIcon;
  variant: PromoSlideVariant;
  onPress?: () => void;
}

interface PromoCarouselProps {
  slides: PromoSlideData[];
}

/** Carrousel promo — peek + gap 16px entre slides, pagination accent orange. */
export function PromoCarousel({ slides }: PromoCarouselProps) {
  const { colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  };

  if (slides.length === 0) return null;

  return (
    <View style={{ marginBottom: Spacing.eight }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: H_PADDING,
          gap: SLIDE_GAP,
        }}
      >
        {slides.map((slide) => (
          <PromoSlideCard key={slide.id} slide={slide} width={SLIDE_WIDTH} />
        ))}
      </ScrollView>

      {slides.length > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: Spacing.four,
          }}
        >
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={{
                width: index === activeIndex ? 24 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === activeIndex ? colors.orbit : colors.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface PromoSlideCardProps {
  slide: PromoSlideData;
  width: number;
}

function PromoSlideCard({ slide, width }: PromoSlideCardProps) {
  const { colors } = useAppTheme();
  const IconComponent = slide.icon;

  const styles = {
    dark: {
      bg: colors.ink,
      title: colors.onPrimary,
      body: colors.dust,
      eyebrowColor: colors.onPrimary,
      dotColor: colors.orbit,
      iconBg: colors.orbit,
      iconColor: colors.onPrimary,
      ctaBg: colors.surfaceCard,
      ctaIcon: colors.ink,
      border: 'transparent',
    },
    light: {
      bg: colors.surfaceCard,
      title: colors.ink,
      body: colors.muted,
      eyebrowColor: colors.ink,
      dotColor: colors.orbit,
      iconBg: colors.iconWash,
      iconColor: colors.ink,
      ctaBg: colors.ink,
      ctaIcon: colors.onPrimary,
      border: colors.border,
    },
    warm: {
      bg: colors.surfaceStrong,
      title: colors.ink,
      body: colors.muted,
      eyebrowColor: colors.ink,
      dotColor: colors.orbit,
      iconBg: '#FFE8DC',
      iconColor: colors.orbit,
      ctaBg: colors.orbit,
      ctaIcon: colors.onPrimary,
      border: colors.border,
    },
  }[slide.variant];

  const content = (
    <View
      style={{
        width,
        minHeight: 148,
        borderRadius: Radius.lg,
        backgroundColor: styles.bg,
        padding: Spacing.five,
        borderWidth: slide.variant === 'dark' ? 0 : 1,
        borderColor: styles.border,
        justifyContent: 'space-between',
        ...Shadows.nav,
      }}
    >
      <View>
        <Eyebrow label={slide.eyebrow} color={styles.eyebrowColor} dotColor={styles.dotColor} />
        <Text
          style={[
            textStyle('featureHeading'),
            { color: styles.title, marginBottom: Spacing.one },
          ]}
        >
          {slide.title}
        </Text>
        <Text numberOfLines={2} style={[textStyle('caption'), { color: styles.body }]}>
          {slide.description}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: Spacing.four,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: styles.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={22} color={styles.iconColor} weight="bold" />
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: styles.ctaBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowRight size={16} color={styles.ctaIcon} weight="bold" />
        </View>
      </View>
    </View>
  );

  if (slide.onPress) {
    return (
      <Pressable
        onPress={slide.onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
