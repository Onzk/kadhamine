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
};

/** Pastel par famille — fond doux + accent icône. */
export const CATEGORY_PASTELS: Record<string, { bg: string; fg: string }> = {
  code: { bg: '#E8F0FE', fg: '#3860BE' },
  desktop: { bg: '#E8F0FE', fg: '#3860BE' },
  palette: { bg: '#FCE8F3', fg: '#BE3860' },
  scissors: { bg: '#F3E8FC', fg: '#7B38BE' },
  camera: { bg: '#E8F8FC', fg: '#0891B2' },
  video: { bg: '#E8F8FC', fg: '#0891B2' },
  wrench: { bg: '#FFF4E8', fg: '#CF4500' },
  megaphone: { bg: '#FFF0E8', fg: '#F37338' },
  translate: { bg: '#E8F5EE', fg: '#027A48' },
  pencil: { bg: '#E8F5EE', fg: '#027A48' },
  book: { bg: '#F0E8FC', fg: '#5B38BE' },
  hammer: { bg: '#F5F0E8', fg: '#9A3A0A' },
  beauty: { bg: '#FCE8F0', fg: '#E11D48' },
  food: { bg: '#FFF8E8', fg: '#B45309' },
  event: { bg: '#FCE8FF', fg: '#9333EA' },
  transport: { bg: '#E8EEFC', fg: '#2563EB' },
  agriculture: { bg: '#E8FCE8', fg: '#15803D' },
};

const DEFAULT_PASTEL = { bg: '#E8E2DA', fg: '#141413' };

export function getCategoryIcon(slug?: string): PhosphorIcon {
  if (!slug) return Wrench;
  return CATEGORY_ICON_MAP[slug] ?? Wrench;
}

export function getCategoryPastel(icon?: string) {
  if (!icon) return DEFAULT_PASTEL;
  return CATEGORY_PASTELS[icon] ?? DEFAULT_PASTEL;
}
