import type { Id } from '../../../convex/_generated/dataModel';

export type HomeProviderItem = {
  profile: {
    _id: Id<'profiles'>;
    firstName: string;
    lastName: string;
    city: string;
    region: string;
    avatarUrl?: string;
    bio?: string;
    isVerified: boolean;
    isPremium: boolean;
    badge?: string;
    averageRating: number;
    reviewCount: number;
    completedOrders: number;
    trustScore: number;
    skills: string[];
  };
  serviceCount: number;
  topServiceId: Id<'services'>;
  category: {
    icon?: string;
    slug?: string;
    nameFr: string;
    nameAr?: string;
    nameSara?: string;
  } | null;
};

export function categoryLabel(
  category: HomeProviderItem['category'],
  lang: string,
): string | null {
  if (!category) return null;
  if (lang === 'ar' && category.nameAr) return category.nameAr;
  if (lang === 'sara' && category.nameSara) return category.nameSara;
  return category.nameFr;
}

export function distinctionLabel(
  badge: string | undefined,
  isPremium: boolean,
  isVerified: boolean,
  t: (key: string) => string,
): string | null {
  if (isPremium) return t('common.premium');
  if (badge && badge !== 'beginner') {
    const key = `badges.${badge}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  if (isVerified) return t('common.verified');
  return null;
}
