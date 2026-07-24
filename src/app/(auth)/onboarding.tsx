import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Briefcase,
  MapPin,
  SquaresFour,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { ServiceCard } from '@/components/cards/ServiceCard';
import {
  LeafletMapView,
  type LeafletMapTheme,
  type LeafletMarkerData,
} from '@/components/map/LeafletMapView';
import { CategoryMasonryGrid } from '@/components/ui/CategoryMasonryGrid';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { MVP_CITIES, MVP_CITY_COORDS, MVP_CITY_REGION } from '@/constants/chad';
import { MOCK_CATEGORIES, MOCK_IMAGES } from '@/data/mock_data';
import { getCategoryVisual } from '@/lib/categoryTheme';
import { useAppTheme } from '@/providers/ThemeProvider';
import { markOnboardingSeen } from '@/services/onboardingStorage';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { formatPrice, formatRating } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDE_COUNT = 3;
const LIST_SERVICE_COUNT = 8;
const MAP_SERVICE_COUNT = 24;
/** Hauteur estimée du panel avant onLayout (carte / padding bas). */
const PANEL_H_FALLBACK = 300;
const INDICATOR_TOP_PAD = Spacing.four;
const NDJAMENA = MVP_CITIES[0];
const NDJAMENA_CENTER = MVP_CITY_COORDS[NDJAMENA];

/** Volumes équilibrés pour un masonry lisible (pas de tuiles vides / déséquilibrées). */
const MOCK_CATEGORY_COUNTS = [8, 5, 7, 4, 9, 6, 5, 3, 7, 4] as const;

const SLIDE_ICONS: PhosphorIcon[] = [MapPin, Briefcase, SquaresFour];

const PROVIDER_NAMES = [
  'Fatimé Djimé',
  'Issa Brahim',
  'Hawa Ndolassem',
  'Mahamat Saleh',
  'Amina Hassan',
  'Youssouf Ali',
  'Grace Mbaindiguem',
  'Abakar Oumar',
] as const;

const SERVICE_TITLES = [
  'Site vitrine React / Next.js',
  'Logo & identité visuelle',
  'Robe sur mesure',
  'Couverture photo mariage',
  'Réparation PC portable',
  'Campagne réseaux sociaux',
  'Traduction FR ↔ AR',
  'Cours de maths niveau lycée',
  'Coiffure à domicile',
  'Poterie & artisanat local',
  'App mobile Flutter',
  'Affiche événementielle',
  'Retouches couture express',
  'Shoot produit e-commerce',
  'Dépannage réseau Wi-Fi',
  'Rédaction web SEO',
  'Tutorat anglais débutant',
  'Tresses et nattes',
  'Sculpture bois',
  'Boutique Shopify',
  'Pack branding startup',
  'Tenue traditionnelle',
  'Reportage corporate',
  'Formation WordPress',
] as const;

function hash01(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}

/** Dispersion organique (angle d’or + bruit) — évite l’effet grille / aligné. */
function mapGeo(index: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const t = (index + 0.5) / MAP_SERVICE_COUNT;
  const angle = index * golden + hash01(index * 17 + 3) * 0.55;
  const radius = Math.sqrt(t) * 0.0115 + hash01(index * 31 + 9) * 0.0028;
  const jitterLat = (hash01(index * 41 + 1) - 0.5) * 0.0024;
  const jitterLng = (hash01(index * 53 + 7) - 0.5) * 0.0028;
  return {
    city: NDJAMENA,
    region: MVP_CITY_REGION[NDJAMENA],
    latitude: NDJAMENA_CENTER.lat + Math.cos(angle) * radius + jitterLat,
    longitude: NDJAMENA_CENTER.lng + Math.sin(angle) * radius * 1.12 + jitterLng,
  };
}

function buildMapServices() {
  const photoKeys = Object.keys(MOCK_IMAGES).filter(
    (k) => !k.startsWith('avatar') && k !== 'chatSample',
  ) as Array<keyof typeof MOCK_IMAGES>;

  return Array.from({ length: MAP_SERVICE_COUNT }, (_, i) => {
    const cat = MOCK_CATEGORIES[i % MOCK_CATEGORIES.length]!;
    const title = SERVICE_TITLES[i % SERVICE_TITLES.length]!;
    return {
      id: `onb-svc-${i + 1}`,
      categoryId: cat.id,
      title,
      description: `${title} — prestataire vérifié près de chez vous.`,
      price: 15000 + ((i * 7300) % 140000),
      pricingType: (i % 5 === 0 ? 'negotiable' : 'fixed') as 'fixed' | 'negotiable',
      ...mapGeo(i),
      photo: MOCK_IMAGES[photoKeys[i % photoKeys.length]!],
      rating: 3.8 + ((i * 7) % 12) / 10,
      reviewCount: 3 + ((i * 5) % 28),
      providerName: PROVIDER_NAMES[i % PROVIDER_NAMES.length]!,
      isVerified: i % 3 !== 0,
      isPremium: i % 4 === 0,
    };
  });
}

function AccentTitle({ text, ink, orbit }: { text: string; ink: string; orbit: string }) {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1]!;
  const head = parts.slice(0, -1).join(' ');
  return (
    <Text style={[textStyle('productDisplay'), { color: ink, textAlign: 'center' }]}>
      {head ? `${head} ` : null}
      <Text style={[textStyle('productDisplay'), { color: orbit }]}>{last}</Text>
    </Text>
  );
}

function categoryById(id: string) {
  return MOCK_CATEGORIES.find((c) => c.id === id);
}

function categoryAccent(icon?: string, label?: string) {
  return getCategoryVisual({ icon, label }).pastel.fg;
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [panelH, setPanelH] = useState(PANEL_H_FALLBACK);

  const mapServices = useMemo(() => buildMapServices(), []);

  const featuredService = useMemo(
    () => mapServices[Math.floor(Math.random() * mapServices.length)]!,
    [mapServices],
  );

  const listServices = useMemo(
    () => mapServices.slice(0, LIST_SERVICE_COUNT),
    [mapServices],
  );

  const slides = useMemo(
    () => [
      {
        title: t('onboarding.step1Title'),
        desc: t('onboarding.step1Desc'),
      },
      {
        title: t('onboarding.step2Title'),
        desc: t('onboarding.step2Desc'),
      },
      {
        title: t('onboarding.step3Title'),
        desc: t('onboarding.step3Desc'),
      },
    ],
    [t],
  );

  const mapTheme: LeafletMapTheme = useMemo(
    () => ({
      surface: colors.surfaceCard,
      surfaceStrong: colors.surfaceStrong,
      ink: colors.ink,
      muted: colors.muted,
      border: colors.borderStrong,
      orbit: colors.orbit,
      rating: colors.rating,
      info: colors.info,
    }),
    [colors],
  );

  /** Insets carte : indicateur en haut + panel en bas (le pin reste dans la zone utile). */
  const mapFocusPadding = useMemo(
    () => ({
      top: INDICATOR_TOP_PAD + 28,
      right: 0,
      bottom: panelH + Spacing.four,
      left: 0,
    }),
    [panelH],
  );

  const slideBottomPad = panelH + Spacing.six;

  const mapMarkers: LeafletMarkerData[] = useMemo(
    () =>
      mapServices.map((svc) => {
        const cat = categoryById(svc.categoryId);
        const selected = svc.id === featuredService.id;
        const priceLabel =
          svc.pricingType === 'negotiable'
            ? t('common.negotiable')
            : formatPrice(svc.price);
        return {
          id: svc.id,
          lat: svc.latitude,
          lng: svc.longitude,
          selected,
          categoryIcon: cat?.icon,
          categoryColor: categoryAccent(cat?.icon, cat?.nameFr),
          isPremium: svc.isPremium,
          tooltip: selected
            ? {
                title: svc.title,
                providerName: svc.providerName,
                photoUrl: svc.photo,
                priceLabel,
                ratingLabel: svc.reviewCount > 0 ? formatRating(svc.rating) : undefined,
                categoryLabel: cat?.nameFr,
                isPremium: svc.isPremium,
                isVerified: svc.isVerified,
              }
            : undefined,
        };
      }),
    [featuredService.id, mapServices, t],
  );

  /** Alternance volumes pour équilibrer les 2 colonnes masonry. */
  const masonryCategories = useMemo(() => {
    const items = MOCK_CATEGORIES.map((cat, i) => ({
      id: cat.id,
      label: cat.nameFr,
      icon: cat.icon,
      slug: cat.slug,
      serviceCount: MOCK_CATEGORY_COUNTS[i] ?? 4,
    }));
    return [...items].sort((a, b) => {
      const diff = (b.serviceCount ?? 0) - (a.serviceCount ?? 0);
      if (diff !== 0) return diff;
      return a.label.localeCompare(b.label, 'fr');
    });
  }, []);

  const finish = useCallback(async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/login');
  }, [router]);

  const goNext = useCallback(() => {
    if (index >= SLIDE_COUNT - 1) {
      void finish();
      return;
    }
    const next = index + 1;
    pagerRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    setIndex(next);
  }, [finish, index]);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / SCREEN_W);
    setIndex(Math.max(0, Math.min(SLIDE_COUNT - 1, next)));
  }, []);

  const onPanelLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0) setPanelH(h);
  }, []);

  const active = slides[index]!;
  const isLast = index === SLIDE_COUNT - 1;
  const SlideIcon = SLIDE_ICONS[index] ?? MapPin;

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <View style={styles.stage}>
        {/* Slides full-bleed — passent sous le panel */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          style={StyleSheet.absoluteFill}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Slide 1 — carte avec padding bas = hauteur panel */}
          <View style={[styles.slide, { width: SCREEN_W }]}>
            <View style={styles.visualFill}>
              <LeafletMapView
                center={{ lat: featuredService.latitude, lng: featuredService.longitude }}
                zoom={15}
                markers={mapMarkers}
                orbitColor={colors.orbit}
                theme={mapTheme}
                focusPadding={mapFocusPadding}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          </View>

          {/* Slide 2 — liste verticale type recherche */}
          <View style={[styles.slide, { width: SCREEN_W, backgroundColor: colors.canvas }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listScroll,
                { paddingBottom: slideBottomPad },
              ]}
              nestedScrollEnabled
            >
              <View style={styles.listStack}>
                {listServices.map((svc) => {
                  const cat = categoryById(svc.categoryId);
                  return (
                    <ServiceCard
                      key={svc.id}
                      title={svc.title}
                      description={svc.description}
                      price={svc.price}
                      pricingType={svc.pricingType}
                      photo={svc.photo}
                      rating={svc.rating}
                      reviewCount={svc.reviewCount}
                      providerName={svc.providerName}
                      city={svc.city}
                      isVerified={svc.isVerified}
                      isPremium={svc.isPremium}
                      categoryIcon={cat?.icon}
                      categoryLabel={cat?.nameFr}
                      onPress={() => {}}
                    />
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Slide 3 — masonry catégories */}
          <View style={[styles.slide, { width: SCREEN_W, backgroundColor: colors.canvas }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.categoriesScroll,
                { paddingBottom: slideBottomPad },
              ]}
              nestedScrollEnabled
            >
              <CategoryMasonryGrid categories={masonryCategories} onPressCategory={() => {}} />
            </ScrollView>
          </View>
        </ScrollView>

        {/* Indicateur — reste en haut */}
        <View
          pointerEvents="none"
          style={styles.indicator}
          accessibilityRole="tablist"
        >
          {slides.map((_, i) => (
            <View
              key={`dot-${i}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: i === index }}
              style={{
                width: i === index ? 24 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? colors.orbit : colors.border,
              }}
            />
          ))}
        </View>

        {/* Panel — même ancrage que la sheet map (absolute L/R/bottom 0) */}
        <View
          onLayout={onPanelLayout}
          style={[
            styles.panel,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.borderStrong,
              paddingBottom: Math.max(insets.bottom, Spacing.three) + Spacing.eight,
            },
          ]}
        >
          <View style={[styles.iconWash, { backgroundColor: colors.orbitWash }]}>
            <SlideIcon size={36} color={colors.orbit} weight="fill" />
          </View>

          <AccentTitle text={active.title} ink={colors.ink} orbit={colors.orbit} />

          <Text
            style={[
              textStyle('body'),
              { color: colors.muted, textAlign: 'center', lineHeight: 22 },
            ]}
          >
            {active.desc}
          </Text>

          <View style={styles.ctaFull}>
            <AuthPrimaryButton
              tone="ink"
              title={isLast ? t('onboarding.getStarted') : t('onboarding.next')}
              onPress={goNext}
              icon={<ArrowRight size={18} weight="bold" />}
              flat
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stage: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_TOP_PAD,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.oneHalf,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 0.1,
    borderBottomWidth: 0,
    paddingHorizontal: PAGE_H_PAD,
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  iconWash: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  ctaFull: {
    alignSelf: 'stretch',
    marginTop: Spacing.one,
  },
  slide: {
    flex: 1,
  },
  visualFill: {
    flex: 1,
    overflow: 'hidden',
  },
  listScroll: {
    paddingTop: Spacing.ten,
  },
  listStack: {
    paddingHorizontal: PAGE_H_PAD,
    gap: Spacing.four,
  },
  categoriesScroll: {
    paddingTop: Spacing.ten,
  },
});
