import {
  Code,
  Palette,
  Scissors,
  Camera,
  Wrench,
  Megaphone,
  Translate,
  BookOpen,
  Hammer,
  Desktop,
  PencilLine,
  VideoCamera,
  CalendarStar,
  CookingPot,
  HairDryer,
  Truck,
  Plant,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

/** Slug ou clé icône Convex → composant Phosphor. */
export const CATEGORY_ICON_MAP: Record<string, PhosphorIcon> = {
  code: Code,
  desktop: Desktop,
  palette: Palette,
  scissors: Scissors,
  camera: Camera,
  video: VideoCamera,
  wrench: Wrench,
  megaphone: Megaphone,
  translate: Translate,
  pencil: PencilLine,
  book: BookOpen,
  hammer: Hammer,
  beauty: HairDryer,
  food: CookingPot,
  event: CalendarStar,
  transport: Truck,
  agriculture: Plant,
  // Aliases / slugs DB historiques
  developpement: Code,
  informatique: Desktop,
  design: Palette,
  marketing: Megaphone,
  redaction: PencilLine,
  'photo-video': VideoCamera,
  photographie: Camera,
  evenementiel: CalendarStar,
  bricolage: Hammer,
  cuisine: CookingPot,
  beaute: HairDryer,
  coiffure: HairDryer,
  formation: BookOpen,
  couture: Scissors,
  reparation: Wrench,
  traduction: Translate,
  artisanat: Hammer,
};

/** Pastel par famille — fond doux + accent icône (clair & sombre lisibles). */
export const CATEGORY_PASTELS: Record<string, { bg: string; fg: string }> = {
  code: { bg: '#DBEAFE', fg: '#1D4ED8' },
  desktop: { bg: '#DBEAFE', fg: '#1D4ED8' },
  developpement: { bg: '#DBEAFE', fg: '#1D4ED8' },
  informatique: { bg: '#DBEAFE', fg: '#1D4ED8' },
  palette: { bg: '#FCE7F3', fg: '#BE185D' },
  design: { bg: '#FCE7F3', fg: '#BE185D' },
  scissors: { bg: '#EDE9FE', fg: '#6D28D9' },
  couture: { bg: '#EDE9FE', fg: '#6D28D9' },
  beauty: { bg: '#FCE7F3', fg: '#DB2777' },
  beaute: { bg: '#FCE7F3', fg: '#DB2777' },
  coiffure: { bg: '#FCE7F3', fg: '#DB2777' },
  camera: { bg: '#CFFAFE', fg: '#0E7490' },
  video: { bg: '#CFFAFE', fg: '#0E7490' },
  photographie: { bg: '#CFFAFE', fg: '#0E7490' },
  'photo-video': { bg: '#CFFAFE', fg: '#0E7490' },
  wrench: { bg: '#FFEDD5', fg: '#C2410C' },
  reparation: { bg: '#FFEDD5', fg: '#C2410C' },
  megaphone: { bg: '#FFEDD5', fg: '#EA580C' },
  marketing: { bg: '#FFEDD5', fg: '#EA580C' },
  translate: { bg: '#DCFCE7', fg: '#15803D' },
  pencil: { bg: '#DCFCE7', fg: '#15803D' },
  redaction: { bg: '#DCFCE7', fg: '#15803D' },
  traduction: { bg: '#DCFCE7', fg: '#15803D' },
  book: { bg: '#EDE9FE', fg: '#5B21B6' },
  formation: { bg: '#EDE9FE', fg: '#5B21B6' },
  hammer: { bg: '#FEF3C7', fg: '#B45309' },
  bricolage: { bg: '#FEF3C7', fg: '#B45309' },
  artisanat: { bg: '#FEF3C7', fg: '#B45309' },
  food: { bg: '#FEF3C7', fg: '#B45309' },
  cuisine: { bg: '#FEF3C7', fg: '#B45309' },
  event: { bg: '#F3E8FF', fg: '#7E22CE' },
  evenementiel: { bg: '#F3E8FF', fg: '#7E22CE' },
  transport: { bg: '#DBEAFE', fg: '#1D4ED8' },
  agriculture: { bg: '#DCFCE7', fg: '#15803D' },
};

const DEFAULT_PASTEL = { bg: '#E8E2DA', fg: '#141413' };

const NAME_HINTS: Array<{ test: RegExp; key: string }> = [
  { test: /web|mobile|d[eé]velopp/i, key: 'code' },
  { test: /informatique|tech/i, key: 'desktop' },
  { test: /design|cr[eé]ation|graphique/i, key: 'palette' },
  { test: /marketing|communication/i, key: 'megaphone' },
  { test: /r[eé]daction/i, key: 'pencil' },
  { test: /traduction/i, key: 'translate' },
  { test: /photo|vid[eé]o/i, key: 'video' },
  { test: /[eé]v[eé]nement/i, key: 'event' },
  { test: /bricolage|r[eé]paration|r[eé]parer/i, key: 'wrench' },
  { test: /cuisine|traiteur/i, key: 'food' },
  { test: /beaut[eé]|coiffure/i, key: 'beauty' },
  { test: /cours|formation|tutorat/i, key: 'book' },
  { test: /transport|livraison/i, key: 'transport' },
  { test: /agriculture/i, key: 'agriculture' },
  { test: /couture/i, key: 'scissors' },
  { test: /artisanat/i, key: 'hammer' },
];

/** Résout la clé visuelle (icône + pastel) depuis icon / slug / label. */
export function resolveCategoryKey(opts: {
  icon?: string;
  slug?: string;
  label?: string;
}): string {
  const candidates = [opts.icon, opts.slug]
    .filter(Boolean)
    .map((s) => s!.toLowerCase().trim());

  for (const key of candidates) {
    if (CATEGORY_ICON_MAP[key]) return key;
  }

  if (opts.label) {
    for (const hint of NAME_HINTS) {
      if (hint.test.test(opts.label)) return hint.key;
    }
  }

  return candidates[0] ?? 'wrench';
}

export function getCategoryIcon(slug?: string): PhosphorIcon {
  if (!slug) return Wrench;
  return CATEGORY_ICON_MAP[slug] ?? CATEGORY_ICON_MAP[resolveCategoryKey({ icon: slug })] ?? Wrench;
}

export function getCategoryPastel(icon?: string) {
  if (!icon) return DEFAULT_PASTEL;
  const key = resolveCategoryKey({ icon });
  return CATEGORY_PASTELS[key] ?? CATEGORY_PASTELS[icon] ?? DEFAULT_PASTEL;
}

export function getCategoryVisual(opts: { icon?: string; slug?: string; label?: string }) {
  const key = resolveCategoryKey(opts);
  return {
    key,
    Icon: CATEGORY_ICON_MAP[key] ?? Wrench,
    pastel: CATEGORY_PASTELS[key] ?? DEFAULT_PASTEL,
  };
}
