/**
 * Données de test TalentTchad (CDC §10).
 * Images Unsplash vérifiées le 2026-07-19 (HEAD → 200, content-type image/*).
 */

import { MVP_CITIES, MVP_CITY_COORDS, MVP_CITY_REGION, type MvpCity } from '@/constants/chad';

/** Vérifiées 2026-07-19 */
export const MOCK_IMAGES = {
  developpement: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
  design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  couture: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
  coiffure: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  photographie: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80',
  reparation: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
  marketing: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80',
  traduction: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  formation: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
  artisanat: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80',
  avatarMan: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  avatarWoman: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  avatarWoman2: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80',
  avatarMan2: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
  chatSample: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
} as const;

function geo(city: MvpCity, seed: number) {
  const base = MVP_CITY_COORDS[city];
  const a = ((seed * 17) % 11) - 5;
  const b = ((seed * 29) % 11) - 5;
  return {
    city,
    region: MVP_CITY_REGION[city],
    latitude: base.lat + a * 0.0012,
    longitude: base.lng + b * 0.0012,
  };
}

export const MOCK_CATEGORIES = [
  { id: 'cat-dev', slug: 'developpement', nameFr: 'Développement web & mobile', icon: 'code' },
  { id: 'cat-design', slug: 'design', nameFr: 'Design graphique', icon: 'palette' },
  { id: 'cat-couture', slug: 'couture', nameFr: 'Couture', icon: 'scissors' },
  { id: 'cat-coiffure', slug: 'coiffure', nameFr: 'Coiffure', icon: 'scissors' },
  { id: 'cat-photo', slug: 'photographie', nameFr: 'Photographie', icon: 'camera' },
  { id: 'cat-repair', slug: 'reparation', nameFr: 'Réparation informatique', icon: 'wrench' },
  { id: 'cat-marketing', slug: 'marketing', nameFr: 'Marketing digital', icon: 'megaphone' },
  { id: 'cat-trad', slug: 'traduction', nameFr: 'Traduction', icon: 'translate' },
  { id: 'cat-formation', slug: 'formation', nameFr: 'Formation & tutorat', icon: 'book' },
  { id: 'cat-artisanat', slug: 'artisanat', nameFr: 'Artisanat', icon: 'hammer' },
] as const;

export const MOCK_USERS = [
  {
    id: 'user-client-1',
    role: 'client' as const,
    firstName: 'Amina',
    lastName: 'Hassan',
    ...geo(MVP_CITIES[0], 1),
    avatarUrl: MOCK_IMAGES.avatarWoman,
  },
  {
    id: 'user-client-2',
    role: 'client' as const,
    firstName: 'Mahamat',
    lastName: 'Oumar',
    ...geo(MVP_CITIES[1], 2),
    avatarUrl: MOCK_IMAGES.avatarMan,
  },
  {
    id: 'user-provider-1',
    role: 'provider' as const,
    firstName: 'Fatimé',
    lastName: 'Djimé',
    ...geo(MVP_CITIES[0], 3),
    avatarUrl: MOCK_IMAGES.avatarWoman2,
    isVerified: true,
    isPremium: true,
    averageRating: 4.9,
    bio: 'Développeuse web freelance à N’Djaména.',
  },
  {
    id: 'user-provider-2',
    role: 'provider' as const,
    firstName: 'Issa',
    lastName: 'Brahim',
    ...geo(MVP_CITIES[2], 4),
    avatarUrl: MOCK_IMAGES.avatarMan2,
    isVerified: true,
    isPremium: false,
    averageRating: 4.6,
    bio: 'Photographe événementiel à Abéché.',
  },
  {
    id: 'user-provider-3',
    role: 'provider' as const,
    firstName: 'Hawa',
    lastName: 'Ndolassem',
    ...geo(MVP_CITIES[1], 5),
    avatarUrl: MOCK_IMAGES.avatarWoman,
    isVerified: false,
    isPremium: false,
    averageRating: 4.2,
    bio: 'Couturière et créatrice de mode à Moundou.',
  },
];

export const MOCK_SERVICES = [
  {
    id: 'svc-1',
    providerId: 'user-provider-1',
    categoryId: 'cat-dev',
    title: 'Site vitrine React / Next.js',
    description: 'Création de site professionnel responsive, livraison en 10 jours.',
    price: 150000,
    pricingType: 'fixed' as const,
    // Hérite de la position profil (même jitter seed 3)
    ...geo(MVP_CITIES[0], 3),
    photo: MOCK_IMAGES.developpement,
    rating: 4.9,
    reviewCount: 18,
    providerName: 'Fatimé Djimé',
    isVerified: true,
    isPremium: true,
  },
  {
    id: 'svc-2',
    providerId: 'user-provider-2',
    categoryId: 'cat-photo',
    title: 'Couverture photo mariage',
    description: 'Reportage complet + 100 photos retouchées.',
    price: 80000,
    pricingType: 'fixed' as const,
    // Position propre (offset vs profil Abéché seed 4)
    ...geo(MVP_CITIES[2], 14),
    photo: MOCK_IMAGES.photographie,
    rating: 4.6,
    reviewCount: 12,
    providerName: 'Issa Brahim',
    isVerified: true,
    isPremium: false,
  },
  {
    id: 'svc-3',
    providerId: 'user-provider-3',
    categoryId: 'cat-couture',
    title: 'Robe sur mesure',
    description: 'Création et retouches de tenues traditionnelles et modernes.',
    price: 25000,
    pricingType: 'negotiable' as const,
    ...geo(MVP_CITIES[1], 5),
    photo: MOCK_IMAGES.couture,
    rating: 4.2,
    reviewCount: 7,
    providerName: 'Hawa Ndolassem',
    isVerified: false,
    isPremium: false,
  },
  {
    id: 'svc-4',
    providerId: 'user-provider-1',
    categoryId: 'cat-design',
    title: 'Logo & identité visuelle',
    description: 'Pack logo + charte couleurs + déclinaisons réseaux.',
    price: 45000,
    pricingType: 'fixed' as const,
    // Position propre à N'Djamena (autre quartier)
    ...geo(MVP_CITIES[0], 21),
    photo: MOCK_IMAGES.design,
    rating: 4.8,
    reviewCount: 22,
    providerName: 'Fatimé Djimé',
    isVerified: true,
    isPremium: true,
  },
];

export const MOCK_ORDERS = [
  {
    id: 'ord-1',
    title: 'Site vitrine React / Next.js',
    status: 'pending' as const,
    agreedPrice: 150000,
    isOffPlatformPayment: false,
  },
  {
    id: 'ord-2',
    title: 'Couverture photo mariage',
    status: 'accepted' as const,
    agreedPrice: 80000,
    isOffPlatformPayment: false,
  },
  {
    id: 'ord-3',
    title: 'Robe sur mesure',
    status: 'completed' as const,
    agreedPrice: 25000,
    isOffPlatformPayment: true,
  },
  {
    id: 'ord-4',
    title: 'Logo & identité visuelle',
    status: 'cancelled' as const,
    agreedPrice: 45000,
    isOffPlatformPayment: false,
  },
];

export const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    type: 'text' as const,
    content: 'Bonjour, êtes-vous disponible la semaine prochaine ?',
    mine: false,
  },
  {
    id: 'msg-2',
    type: 'text' as const,
    content: 'Oui, je peux commencer mardi.',
    mine: true,
  },
  {
    id: 'msg-3',
    type: 'image' as const,
    content: 'Image',
    mediaUrl: MOCK_IMAGES.chatSample,
    mine: false,
  },
];

export const MOCK_REVIEWS = [
  {
    id: 'rev-1',
    rating: 5,
    comment: 'Travail impeccable et délais respectés.',
    providerName: 'Fatimé Djimé',
  },
  {
    id: 'rev-2',
    rating: 4,
    comment: 'Très bonnes photos du mariage.',
    providerName: 'Issa Brahim',
  },
];

export const MOCK_PAYMENTS = [
  {
    id: 'pay-1',
    method: 'fedapay' as const,
    status: 'held' as const,
    amount: 80000,
    commission: 8000,
  },
  {
    id: 'pay-2',
    method: 'off_platform' as const,
    status: 'released' as const,
    amount: 25000,
    commission: 0,
  },
];

export const MOCK_PREMIUM_PLAN = {
  name: 'Premium',
  price: 5000,
  currency: 'XAF',
  durationDays: 30,
  benefits: [
    'Profil mis en avant dans les recherches',
    'Badge Premium visible',
    'Statistiques avancées',
    'Priorité dans les résultats',
  ],
};
