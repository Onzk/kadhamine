import React, { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - Spacing.four * 2;

interface PromoCarouselProps {
  slides: React.ReactNode[];
}

/** Carrousel hero plein-largeur avec pagination à points — snap 1 slide à la fois. */
export function PromoCarousel({ slides }: PromoCarouselProps) {
  const { colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (index !== activeIndex) setActiveIndex(index);
  };

  if (slides.length === 0) return null;

  return (
    <View style={{ marginBottom: Spacing.eight }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SLIDE_WIDTH}
        snapToAlignment="start"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: Spacing.four }}
      >
        {slides.map((slide, index) => (
          <View key={index} style={{ width: SLIDE_WIDTH }}>
            {slide}
          </View>
        ))}
      </ScrollView>

      {slides.length > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginTop: Spacing.three,
          }}
        >
          {slides.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === activeIndex ? colors.ink : colors.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
