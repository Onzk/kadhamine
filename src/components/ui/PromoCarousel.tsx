import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { ArrowRight, MapPin, type Icon as PhosphorIcon } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors, Radius, Spacing, type ThemeColors } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = PAGE_H_PAD;
const SLIDE_GAP = Spacing.four;
/** Largeur slide — laisse entrevoir la slide suivante (~20px). */
const SLIDE_WIDTH = SCREEN_WIDTH - H_PADDING * 2 - Spacing.five;
const SNAP_INTERVAL = SLIDE_WIDTH + SLIDE_GAP;
/** Hauteur fixe uniforme (eyebrow + titre 2L + desc 2L + footer actions). */
const SLIDE_HEIGHT = 192;
/** Aligné sur SearchBar (AuthField light). */
const SEARCH_FIELD_RADIUS = 12;

/** Ink vrai (jamais inversé) — surfaces « premium » et texte sur pastilles blanches. */
const TRUE_INK = BrandColors.ink;
const TRUE_CREAM = BrandColors.canvas;

export type PromoSlideVariant = 'dark' | 'light' | 'warm';

export interface PromoSlideData {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: PhosphorIcon;
  variant: PromoSlideVariant;
  onPress?: () => void;
  /**
   * Dégradé immersif — texte clair sur gradient + filigrane.
   * Le gradient doit venir du thème (`colors.orbitGradient`).
   */
  gradient?: readonly [string, string, ...string[]];
  /** Libellé CTA (pilule) — sinon pastille flèche seule. */
  ctaLabel?: string;
}

interface PromoCarouselProps {
  slides: PromoSlideData[];
}

type SlidePalette = {
  bg: string;
  title: string;
  body: string;
  eyebrowColor: string;
  dotColor: string;
  iconBg: string;
  iconColor: string;
  ctaBg: string;
  ctaFg: string;
  border: string;
  borderWidth: number;
  watermark: string;
};

function resolvePalette(
  variant: PromoSlideVariant,
  colors: ThemeColors,
  isDark: boolean,
): SlidePalette {
  switch (variant) {
    case 'dark':
      // Carte « ink » toujours sombre (premium), accents orbit thème.
      return {
        bg: isDark ? colors.surfaceDark : TRUE_INK,
        title: TRUE_CREAM,
        body: isDark ? 'rgba(243,240,238,0.7)' : '#D1CDC7',
        eyebrowColor: TRUE_CREAM,
        dotColor: colors.orbit,
        iconBg: colors.orbit,
        iconColor: colors.onOrbit,
        ctaBg: TRUE_CREAM,
        ctaFg: TRUE_INK,
        border: isDark ? colors.borderHairline : 'transparent',
        borderWidth: isDark ? 0.1 : 0,
        watermark: 'rgba(243,240,238,0.1)',
      };
    case 'light':
      return {
        bg: colors.surfaceCard,
        title: colors.ink,
        body: colors.muted,
        eyebrowColor: colors.ink,
        dotColor: colors.orbit,
        iconBg: isDark ? colors.orbitWash : colors.iconWash,
        iconColor: isDark ? colors.orbit : colors.ink,
        ctaBg: isDark ? colors.orbit : TRUE_INK,
        ctaFg: isDark ? colors.onOrbit : TRUE_CREAM,
        border: colors.borderStrong,
        borderWidth: 0.1,
        watermark: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(11,61,145,0.08)',
      };
    case 'warm':
    default:
      return {
        bg: isDark ? colors.surfaceStrong : colors.orbitWash,
        title: colors.ink,
        body: colors.muted,
        eyebrowColor: colors.ink,
        dotColor: colors.orbit,
        iconBg: isDark ? colors.orbitWash : '#FFFFFF',
        iconColor: colors.orbit,
        ctaBg: colors.orbit,
        ctaFg: colors.onOrbit,
        border: colors.borderStrong,
        borderWidth: 0.1,
        watermark: isDark ? 'rgba(6,182,212,0.14)' : 'rgba(11,61,145,0.1)',
      };
  }
}

/** Carrousel promo — peek + gap, pagination orbit, palettes adaptées clair/sombre.
 * Conservé pour réutilisation ; l’accueil utilise `PromoSearchHero` (dernier slide + recherche).
 */
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
  const { colors, isDark } = useAppTheme();
  const IconComponent = slide.icon;

  const card = slide.gradient ? (
    <ImmersiveSlide slide={slide} width={width} IconComponent={IconComponent} />
  ) : (
    <FlatSlide
      slide={slide}
      width={width}
      IconComponent={IconComponent}
      palette={resolvePalette(slide.variant, colors, isDark)}
    />
  );

  if (!slide.onPress) return card;

  return (
    <Pressable onPress={slide.onPress} style={{ width }}>
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }}>
          {card}
        </View>
      )}
    </Pressable>
  );
}

function FlatSlide({
  slide,
  width,
  IconComponent,
  palette,
}: {
  slide: PromoSlideData;
  width: number;
  IconComponent: PhosphorIcon;
  palette: SlidePalette;
}) {
  return (
    <View
      style={{
        width,
        height: SLIDE_HEIGHT,
        borderRadius: Radius.lg,
        backgroundColor: palette.bg,
        padding: Spacing.five,
        borderWidth: palette.borderWidth,
        borderColor: palette.border,
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', right: -28, top: -18, opacity: 1 }}>
        <IconComponent size={148} color={palette.watermark} weight="fill" />
      </View>

      <View>
        <Eyebrow label={slide.eyebrow} color={palette.eyebrowColor} dotColor={palette.dotColor} />
        <Text
          numberOfLines={2}
          style={[textStyle('featureHeading'), { color: palette.title, marginBottom: Spacing.one }]}
        >
          {slide.title}
        </Text>
        <Text numberOfLines={2} style={[textStyle('caption'), { color: palette.body }]}>
          {slide.description}
        </Text>
      </View>

      <SlideFooter
        IconComponent={IconComponent}
        iconBg={palette.iconBg}
        iconColor={palette.iconColor}
        ctaBg={palette.ctaBg}
        ctaFg={palette.ctaFg}
        ctaLabel={slide.ctaLabel}
      />
    </View>
  );
}

function ImmersiveSlide({
  slide,
  width,
  IconComponent,
}: {
  slide: PromoSlideData;
  width: number;
  IconComponent: PhosphorIcon;
}) {
  return (
    <LinearGradient
      colors={[...(slide.gradient as readonly [string, string, ...string[]])]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width,
        height: SLIDE_HEIGHT,
        borderRadius: Radius.lg,
        padding: Spacing.five,
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', right: -26, top: -20, opacity: 0.18 }}>
        <IconComponent size={150} color="#FFFFFF" weight="fill" />
      </View>

      <View>
        <Eyebrow label={slide.eyebrow} color="#FFFFFF" dotColor="#FFFFFF" />
        <Text
          numberOfLines={2}
          style={[textStyle('featureHeading'), { color: '#FFFFFF', marginBottom: Spacing.one }]}
        >
          {slide.title}
        </Text>
        <Text numberOfLines={2} style={[textStyle('caption'), { color: 'rgba(255,255,255,0.88)' }]}>
          {slide.description}
        </Text>
      </View>

      <SlideFooter
        IconComponent={IconComponent}
        iconBg="rgba(255,255,255,0.22)"
        iconColor="#FFFFFF"
        ctaBg="#FFFFFF"
        ctaFg={TRUE_INK}
        ctaLabel={slide.ctaLabel}
      />
    </LinearGradient>
  );
}

function SlideFooter({
  IconComponent,
  iconBg,
  iconColor,
  ctaBg,
  ctaFg,
  ctaLabel,
}: {
  IconComponent: PhosphorIcon;
  iconBg: string;
  iconColor: string;
  ctaBg: string;
  ctaFg: string;
  ctaLabel?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.three,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconComponent size={22} color={iconColor} weight="bold" />
      </View>

      {ctaLabel ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.two,
            backgroundColor: ctaBg,
            paddingVertical: Spacing.two,
            paddingHorizontal: Spacing.four,
            borderRadius: Radius.pill,
          }}
        >
          <Text style={[textStyle('button'), { color: ctaFg }]}>{ctaLabel}</Text>
          <ArrowRight size={16} color={ctaFg} weight="bold" />
        </View>
      ) : (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: ctaBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowRight size={16} color={ctaFg} weight="bold" />
        </View>
      )}
    </View>
  );
}

export interface PromoSearchHeroProps {
  slide: PromoSlideData;
  searchPlaceholder: string;
  onSearchPress: () => void;
}

/**
 * Dernier slide promo + barre de recherche fusionnés (accueil).
 * Le carrousel reste exporté ci-dessus pour une réactivation ultérieure.
 */
export function PromoSearchHero({ slide, searchPlaceholder, onSearchPress }: PromoSearchHeroProps) {
  const { colors, isDark } = useAppTheme();
  const IconComponent = slide.icon;
  const width = SCREEN_WIDTH - H_PADDING * 2;
  const hasGradient = Boolean(slide.gradient && slide.gradient.length >= 2);
  /** Même chrome que la SearchBar sur le slide (adapté clair / sombre). */
  const fieldBg = isDark ? colors.surfaceCard : TRUE_CREAM;
  const fieldFg = colors.ink;

  const body = hasGradient ? (
    <LinearGradient
      colors={[...(slide.gradient as readonly [string, string, ...string[]])]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: '100%',
        borderRadius: Radius.lg,
        padding: Spacing.five,
        overflow: 'hidden',
        gap: Spacing.five,
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', right: -26, top: -20, opacity: 0.18 }}>
        <IconComponent size={150} color="#FFFFFF" weight="fill" />
      </View>

      <Pressable
        onPress={slide.onPress}
        disabled={!slide.onPress}
        style={({ pressed }) => [{ opacity: pressed && slide.onPress ? 0.92 : 1 }]}
      >
        <View>
          <Eyebrow label={slide.eyebrow} color="#FFFFFF" dotColor="#FFFFFF" />
          <Text
            numberOfLines={2}
            style={[textStyle('featureHeading'), { color: '#FFFFFF', marginBottom: Spacing.one }]}
          >
            {slide.title}
          </Text>
          <Text numberOfLines={2} style={[textStyle('caption'), { color: 'rgba(255,255,255,0.88)' }]}>
            {slide.description}
          </Text>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <SearchBar
            value=""
            onChangeText={() => {}}
            onPress={onSearchPress}
            placeholder={searchPlaceholder}
            style={{
              backgroundColor: fieldBg,
              borderColor: 'transparent',
            }}
          />
        </View>
        {slide.onPress ? (
          <Pressable
            onPress={slide.onPress}
            accessibilityRole="button"
            accessibilityLabel={slide.ctaLabel ?? 'Ouvrir la carte'}
            style={({ pressed }) => [{ width: 52, height: 52, opacity: pressed ? 0.9 : 1 }]}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: SEARCH_FIELD_RADIUS,
                backgroundColor: fieldBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={22} color={fieldFg} weight="bold" />
            </View>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  ) : (
    <FlatPromoSearchHero
      slide={slide}
      width={width}
      IconComponent={IconComponent}
      palette={resolvePalette(slide.variant, colors, isDark)}
      searchPlaceholder={searchPlaceholder}
      onSearchPress={onSearchPress}
    />
  );

  return (
    <View
      style={{
        paddingHorizontal: H_PADDING,
        marginTop: Spacing.four,
        marginBottom: Spacing.eight,
      }}
    >
      {body}
    </View>
  );
}

function FlatPromoSearchHero({
  slide,
  width,
  IconComponent,
  palette,
  searchPlaceholder,
  onSearchPress,
}: {
  slide: PromoSlideData;
  width: number;
  IconComponent: PhosphorIcon;
  palette: SlidePalette;
  searchPlaceholder: string;
  onSearchPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        width,
        borderRadius: Radius.lg,
        backgroundColor: palette.bg,
        padding: Spacing.five,
        borderWidth: palette.borderWidth,
        borderColor: palette.border,
        overflow: 'hidden',
        gap: Spacing.five,
      }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', right: -28, top: -18 }}>
        <IconComponent size={148} color={palette.watermark} weight="fill" />
      </View>

      <Pressable
        onPress={slide.onPress}
        disabled={!slide.onPress}
        style={({ pressed }) => [{ opacity: pressed && slide.onPress ? 0.92 : 1 }]}
      >
        <View>
          <Eyebrow label={slide.eyebrow} color={palette.eyebrowColor} dotColor={palette.dotColor} />
          <Text
            numberOfLines={2}
            style={[textStyle('featureHeading'), { color: palette.title, marginBottom: Spacing.one }]}
          >
            {slide.title}
          </Text>
          <Text numberOfLines={2} style={[textStyle('caption'), { color: palette.body }]}>
            {slide.description}
          </Text>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <SearchBar
            value=""
            onChangeText={() => {}}
            onPress={onSearchPress}
            placeholder={searchPlaceholder}
          />
        </View>
        {slide.onPress ? (
          <Pressable
            onPress={slide.onPress}
            accessibilityRole="button"
            accessibilityLabel={slide.ctaLabel ?? 'Ouvrir la carte'}
            style={({ pressed }) => [{ width: 52, height: 52, opacity: pressed ? 0.9 : 1 }]}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: SEARCH_FIELD_RADIUS,
                backgroundColor: colors.surfaceCard,
                borderWidth: 0.1,
                borderColor: colors.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={22} color={colors.ink} weight="bold" />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
