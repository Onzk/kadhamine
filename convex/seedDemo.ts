/**
 * Seed massif TalentTchad — un seul fichier.
 *
 * Usage :
 *   npx convex run seedDemo:seedAll
 *   npx convex run seedDemo:seedAll '{"force": true}'
 *   npx convex run seedDemo:updateDemoGeoPositionsDev
 *   (internal: seedDemo:updateDemoGeoPositions)
 *
 * Images Unsplash vérifiées le 2026-07-22 (HEAD → 200, content-type image/*).
 * Mot de passe des comptes démo : Demo2026! (non créés dans authAccounts — données browse-only).
 */

import { v } from 'convex/values';
import { internalMutation, mutation } from './_generated/server';
import {
  calculateBadge,
  calculateTrustScore,
  DEFAULT_COMMISSION_RATE,
  now,
  PREMIUM_MONTHLY_PRICE,
} from './lib';
import { coordsForCity, jitterCoords, MVP_CITIES } from './cities';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';

// ---------------------------------------------------------------------------
// Constantes & images (vérifiées 2026-07-22)
// ---------------------------------------------------------------------------

const DEMO_DOMAIN = '@demo.talenttchad.com';
const SEED_MARKER_EMAIL = `seed-marker${DEMO_DOMAIN}`;
const COMMISSION = DEFAULT_COMMISSION_RATE;

/** URLs vérifiées — ne pas remplacer sans re-vérifier (HEAD 200). */
const IMG = {
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
  avatarWoman: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  avatarWoman2: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80',
  avatarWoman3: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
  avatarMan: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  avatarMan2: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80',
  avatarMan3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  chatSample: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
  portfolio1: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
  portfolio2: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  portfolio3: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=80',
  portfolio4: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  portfolio5: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
  portfolio6: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
  portfolio7: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
} as const;

const CATEGORY_DEFS = [
  {
    nameFr: 'Développement web & mobile',
    nameAr: 'تطوير الويب والجوال',
    nameSara: 'Développement web & mobile',
    slug: 'developpement',
    icon: 'code',
    sortOrder: 1,
    image: IMG.developpement,
    skills: ['React', 'Next.js', 'TypeScript', 'API REST', 'Mobile Expo'],
  },
  {
    nameFr: 'Design graphique',
    nameAr: 'تصميم جرافيك',
    nameSara: 'Design graphique',
    slug: 'design',
    icon: 'palette',
    sortOrder: 2,
    image: IMG.design,
    skills: ['Logo', 'Identité visuelle', 'Figma', 'Affiche', 'UI/UX'],
  },
  {
    nameFr: 'Couture',
    nameAr: 'خياطة',
    nameSara: 'Couture',
    slug: 'couture',
    icon: 'scissors',
    sortOrder: 3,
    image: IMG.couture,
    skills: ['Robe sur mesure', 'Retouches', 'Mode traditionnelle', 'Broderie'],
  },
  {
    nameFr: 'Coiffure',
    nameAr: 'تصفيف الشعر',
    nameSara: 'Coiffure',
    slug: 'coiffure',
    icon: 'scissors',
    sortOrder: 4,
    image: IMG.coiffure,
    skills: ['Tresses', 'Coupe homme', 'Coloration', 'Mariage'],
  },
  {
    nameFr: 'Photographie',
    nameAr: 'تصوير',
    nameSara: 'Photographie',
    slug: 'photographie',
    icon: 'camera',
    sortOrder: 5,
    image: IMG.photographie,
    skills: ['Mariage', 'Portrait', 'Événementiel', 'Retouche photo'],
  },
  {
    nameFr: 'Réparation informatique',
    nameAr: 'إصلاح الحاسوب',
    nameSara: 'Réparation informatique',
    slug: 'reparation',
    icon: 'wrench',
    sortOrder: 6,
    image: IMG.reparation,
    skills: ['PC', 'Imprimante', 'Réseau', 'Installation Windows'],
  },
  {
    nameFr: 'Marketing digital',
    nameAr: 'تسويق رقمي',
    nameSara: 'Marketing digital',
    slug: 'marketing',
    icon: 'megaphone',
    sortOrder: 7,
    image: IMG.marketing,
    skills: ['Réseaux sociaux', 'Community management', 'Publicité Facebook', 'SEO'],
  },
  {
    nameFr: 'Traduction',
    nameAr: 'ترجمة',
    nameSara: 'Traduction',
    slug: 'traduction',
    icon: 'translate',
    sortOrder: 8,
    image: IMG.traduction,
    skills: ['Français-Arabe', 'Français-Sara', 'Traduction juridique', 'Interprétariat'],
  },
  {
    nameFr: 'Formation & tutorat',
    nameAr: 'تكوين ودروس',
    nameSara: 'Formation & tutorat',
    slug: 'formation',
    icon: 'book',
    sortOrder: 9,
    image: IMG.formation,
    skills: ['Mathématiques', 'Informatique', 'Anglais', 'Préparation examens'],
  },
  {
    nameFr: 'Artisanat',
    nameAr: 'حرف يدوية',
    nameSara: 'Artisanat',
    slug: 'artisanat',
    icon: 'hammer',
    sortOrder: 10,
    image: IMG.artisanat,
    skills: ['Vannerie', 'Sculpture bois', 'Poterie', 'Bijoux artisanaux'],
  },
] as const;

type CategorySlug = (typeof CATEGORY_DEFS)[number]['slug'];

const CITIES = MVP_CITIES;

const FEMALE_NAMES = [
  'Amina', 'Fatimé', 'Hawa', 'Khadija', 'Mariam', 'Zara', 'Salma', 'Aïcha',
  'Fanta', 'Rachida', 'Nadia', 'Yasmine',
];
const MALE_NAMES = [
  'Mahamat', 'Issa', 'Oumar', 'Abdoulaye', 'Idriss', 'Youssouf', 'Ali', 'Hassan',
  'Brahim', 'Adam', 'Moussa', 'Saleh',
];
const LAST_NAMES = [
  'Hassan', 'Djimé', 'Oumar', 'Brahim', 'Ndolassem', 'Mahamat', 'Abakar', 'Doudou',
  'Saleh', 'Moussa', 'Ali', 'Khalil', 'Adam', 'Zakaria', 'Haroun', 'Tahir',
];

const AVATARS = [
  IMG.avatarWoman, IMG.avatarWoman2, IMG.avatarWoman3,
  IMG.avatarMan, IMG.avatarMan2, IMG.avatarMan3,
];

const PORTFOLIO_IMAGES = [
  IMG.portfolio1, IMG.portfolio2, IMG.portfolio3, IMG.portfolio4,
  IMG.portfolio5, IMG.portfolio6, IMG.portfolio7,
];

const POSITIVE_REVIEWS = [
  'Travail impeccable, délais respectés. Je recommande vivement !',
  'Professionnelle et à l\'écoute. Résultat au-delà de mes attentes.',
  'Excellente communication du début à la fin. Merci !',
  'Service rapide et soigné. Je referai appel à ce talent.',
  'Très satisfait, qualité premium pour un prix raisonnable.',
  'Ponctuel, compétent et sympathique. Note méritée.',
  'Livraison conforme au brief, retouches incluses sans problème.',
  'Une référence à N\'Djaména. Je recommande les yeux fermés.',
];

const NEUTRAL_REVIEWS = [
  'Bon travail dans l\'ensemble, quelques retours nécessaires.',
  'Correct, délai légèrement dépassé mais résultat acceptable.',
  'Prestation honnête, pourrait mieux communiquer en amont.',
];

const NEGATIVE_REVIEWS = [
  'Délai non respecté malgré plusieurs relances.',
  'Résultat en dessous du brief initial.',
];

const PROVIDER_RESPONSES = [
  'Merci pour votre confiance ! Ce fut un plaisir de collaborer.',
  'Merci pour ce retour, ravi que le résultat vous convienne.',
  'Votre satisfaction est notre priorité. À bientôt !',
];

const SERVICE_TITLES: Record<CategorySlug, string[]> = {
  developpement: [
    'Site vitrine React / Next.js',
    'Application mobile Expo',
    'Landing page professionnelle',
    'Maintenance site WordPress',
  ],
  design: [
    'Logo & identité visuelle',
    'Affiche événementielle',
    'Charte graphique complète',
    'Design réseaux sociaux',
  ],
  couture: [
    'Robe sur mesure',
    'Tenue traditionnelle brodée',
    'Retouches express',
    'Ensemble mariage sur mesure',
  ],
  coiffure: [
    'Coiffure mariage',
    'Tresses & nattes',
    'Coupe & barbe homme',
    'Forfait événementiel',
  ],
  photographie: [
    'Couverture photo mariage',
    'Shooting portrait studio',
    'Reportage événementiel',
    'Photos produits e-commerce',
  ],
  reparation: [
    'Dépannage PC à domicile',
    'Installation réseau bureau',
    'Réparation imprimante',
    'Nettoyage & optimisation PC',
  ],
  marketing: [
    'Gestion réseaux sociaux (1 mois)',
    'Campagne Facebook Ads',
    'Stratégie digitale PME',
    'Création contenu Instagram',
  ],
  traduction: [
    'Traduction FR ↔ AR (10 pages)',
    'Interprétariat événement',
    'Traduction documents officiels',
    'Sous-titrage vidéo bilingue',
  ],
  formation: [
    'Cours particuliers maths',
    'Initiation informatique',
    'Préparation Baccalauréat',
    'Formation bureautique',
  ],
  artisanat: [
    'Panier vannerie artisanal',
    'Sculpture bois sur commande',
    'Bijoux traditionnels',
    'Poterie décorative',
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length]!;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function daysAgo(days: number) {
  return now() - days * 86_400_000;
}

function hoursAgo(hours: number) {
  return now() - hours * 3_600_000;
}

function commissionSplit(amount: number) {
  const commission = Math.round(amount * COMMISSION);
  return { commission, providerAmount: amount - commission };
}

type PaymentMethod = 'fedapay' | 'airtel_money' | 'moov_money' | 'off_platform';
type OrderStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

function paymentMethodForIndex(i: number, offPlatform: boolean): PaymentMethod {
  if (offPlatform) return 'off_platform';
  const methods: PaymentMethod[] = ['fedapay', 'airtel_money', 'moov_money', 'fedapay'];
  return methods[i % methods.length]!;
}

function ratingForIndex(i: number): number {
  if (i % 50 === 49) return 2;
  if (i % 25 === 24) return 3;
  if (i % 5 === 4) return 4;
  return 5;
}

function reviewComment(rating: number, i: number): string {
  if (rating >= 4) return pick(POSITIVE_REVIEWS, i);
  if (rating === 3) return pick(NEUTRAL_REVIEWS, i);
  return pick(NEGATIVE_REVIEWS, i);
}

async function ensureCategories(ctx: MutationCtx) {
  const ts = now();
  const map = new Map<string, Id<'categories'>>();
  const existing = await ctx.db.query('categories').collect();
  for (const c of existing) map.set(c.slug, c._id);

  for (const cat of CATEGORY_DEFS) {
    if (map.has(cat.slug)) continue;
    const id = await ctx.db.insert('categories', {
      nameFr: cat.nameFr,
      nameAr: cat.nameAr,
      nameSara: cat.nameSara,
      slug: cat.slug,
      icon: cat.icon,
      description: `Prestations ${cat.nameFr.toLowerCase()} au Tchad.`,
      isActive: true,
      sortOrder: cat.sortOrder,
      createdAt: ts,
      updatedAt: ts,
    });
    map.set(cat.slug, id);
  }
  return map;
}

async function ensureSettings(ctx: MutationCtx) {
  const existing = await ctx.db
    .query('settings')
    .withIndex('by_key', (q) => q.eq('key', 'platform'))
    .first();
  if (existing) return;
  await ctx.db.insert('settings', {
    key: 'platform',
    value: {
      name: 'TalentTchad',
      commissionRate: COMMISSION,
      currency: 'XAF',
      supportEmail: 'support@talenttchad.com',
      supportPhone: '+235 66 00 00 00',
    },
    updatedAt: now(),
  });
}

async function isAlreadySeeded(ctx: MutationCtx) {
  const marker = await ctx.db
    .query('users')
    .withIndex('email', (q) => q.eq('email', SEED_MARKER_EMAIL))
    .first();
  return Boolean(marker);
}

async function clearDemoData(ctx: MutationCtx) {
  const allUsers = await ctx.db.query('users').collect();
  const demoIds = new Set(
    allUsers.filter((u) => u.email?.endsWith(DEMO_DOMAIN)).map((u) => u._id),
  );
  if (demoIds.size === 0) return;

  const isDemo = (id: Id<'users'>) => demoIds.has(id);
  const touchesDemo = (ids: Id<'users'>[]) => ids.some(isDemo);

  for (const msg of await ctx.db.query('messages').collect()) {
    if (isDemo(msg.senderId)) await ctx.db.delete(msg._id);
  }
  for (const conv of await ctx.db.query('conversations').collect()) {
    if (touchesDemo(conv.participantIds)) await ctx.db.delete(conv._id);
  }
  for (const r of await ctx.db.query('reviews').collect()) {
    if (isDemo(r.clientId) || isDemo(r.providerId)) await ctx.db.delete(r._id);
  }
  for (const p of await ctx.db.query('payments').collect()) {
    if (isDemo(p.clientId) || isDemo(p.providerId)) await ctx.db.delete(p._id);
  }
  for (const o of await ctx.db.query('orders').collect()) {
    if (isDemo(o.clientId) || isDemo(o.providerId)) await ctx.db.delete(o._id);
  }
  for (const item of await ctx.db.query('portfolio').collect()) {
    if (isDemo(item.providerId)) await ctx.db.delete(item._id);
  }
  for (const s of await ctx.db.query('services').collect()) {
    if (isDemo(s.providerId)) await ctx.db.delete(s._id);
  }
  for (const f of await ctx.db.query('favorites').collect()) {
    if (isDemo(f.userId)) await ctx.db.delete(f._id);
  }
  for (const n of await ctx.db.query('notifications').collect()) {
    if (isDemo(n.userId)) await ctx.db.delete(n._id);
  }
  for (const sub of await ctx.db.query('subscriptions').collect()) {
    if (isDemo(sub.userId)) await ctx.db.delete(sub._id);
  }
  for (const sh of await ctx.db.query('searchHistory').collect()) {
    if (isDemo(sh.userId)) await ctx.db.delete(sh._id);
  }
  for (const rep of await ctx.db.query('reports').collect()) {
    if (isDemo(rep.reporterId)) await ctx.db.delete(rep._id);
  }
  for (const p of await ctx.db.query('profiles').collect()) {
    if (isDemo(p.userId)) await ctx.db.delete(p._id);
  }
  for (const id of demoIds) {
    await ctx.db.delete(id);
  }
}

async function recalculateProfileAndServiceStats(ctx: MutationCtx, profileIds: Id<'profiles'>[]) {
  for (const profileId of profileIds) {
    const profile = await ctx.db.get(profileId);
    if (!profile) continue;

    const providerReviews = await ctx.db
      .query('reviews')
      .withIndex('by_provider', (q) => q.eq('providerId', profile.userId))
      .filter((q) => q.eq(q.field('isVisible'), true))
      .collect();

    const avgRating =
      providerReviews.length > 0
        ? Math.round(
            (providerReviews.reduce((s, r) => s + r.rating, 0) / providerReviews.length) * 10,
          ) / 10
        : 0;

    const providerOrders = await ctx.db
      .query('orders')
      .withIndex('by_provider', (q) => q.eq('providerId', profile.userId))
      .collect();

    const completedOrders = providerOrders.filter((o) => o.status === 'completed').length;
    const cancelledOrders = providerOrders.filter((o) => o.status === 'cancelled').length;

    const stats = {
      averageRating: avgRating,
      reviewCount: providerReviews.length,
      completedOrders,
      cancelledOrders,
      responseTimeMinutes: profile.responseTimeMinutes,
      isVerified: profile.isVerified,
      isPremium: profile.isPremium,
    };

    await ctx.db.patch(profileId, {
      averageRating: avgRating,
      reviewCount: providerReviews.length,
      completedOrders,
      cancelledOrders,
      trustScore: calculateTrustScore(stats),
      badge: calculateBadge(stats),
      updatedAt: now(),
    });

    const services = await ctx.db
      .query('services')
      .withIndex('by_provider', (q) => q.eq('providerId', profile.userId))
      .collect();

    for (const service of services) {
      const serviceReviews = providerReviews.filter((r) => r.serviceId === service._id);
      const svcAvg =
        serviceReviews.length > 0
          ? Math.round(
              (serviceReviews.reduce((s, r) => s + r.rating, 0) / serviceReviews.length) * 10,
            ) / 10
          : 0;
      const svcOrders = providerOrders.filter((o) => o.serviceId === service._id);
      await ctx.db.patch(service._id, {
        averageRating: svcAvg,
        reviewCount: serviceReviews.length,
        orderCount: svcOrders.length,
        updatedAt: now(),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Seed principal
// ---------------------------------------------------------------------------

async function runSeed(ctx: MutationCtx, force: boolean) {
  if (!force && (await isAlreadySeeded(ctx))) {
    return { seeded: false, message: 'Données démo déjà présentes. Utilisez force:true pour réinitialiser.' };
  }

  if (force) await clearDemoData(ctx);

  await ensureSettings(ctx);
  const categoryMap = await ensureCategories(ctx);
  const ts = now();

  const counts = {
    users: 0,
    profiles: 0,
    services: 0,
    portfolio: 0,
    orders: 0,
    payments: 0,
    reviews: 0,
    conversations: 0,
    messages: 0,
    favorites: 0,
    notifications: 0,
    subscriptions: 0,
    reports: 0,
    searchHistory: 0,
  };

  // --- Admin ---
  const adminId = await ctx.db.insert('users', {
    name: 'Admin TalentTchad',
    email: `admin${DEMO_DOMAIN}`,
    phone: '+23566000001',
    role: 'admin',
    status: 'active',
    language: 'fr',
    createdAt: ts,
    updatedAt: ts,
  });
  counts.users++;
  const adminProfileId = await ctx.db.insert('profiles', {
    userId: adminId,
    firstName: 'Admin',
    lastName: 'TalentTchad',
    city: CITIES[0].city,
    region: CITIES[0].region,
    skills: ['Modération', 'Support'],
    availability: 'available',
    isVerified: true,
    isPremium: false,
    averageRating: 0,
    reviewCount: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    trustScore: 50,
    viewCount: 0,
    clickCount: 0,
    createdAt: ts,
    updatedAt: ts,
  });
  counts.profiles++;

  // --- Marqueur idempotence ---
  await ctx.db.insert('users', {
    name: 'Seed Marker',
    email: SEED_MARKER_EMAIL,
    role: 'admin',
    status: 'active',
    createdAt: ts,
    updatedAt: ts,
  });
  counts.users++;

  const clientIds: Id<'users'>[] = [];
  const providerRecords: Array<{
    userId: Id<'users'>;
    profileId: Id<'profiles'>;
    categorySlug: CategorySlug;
    cityIndex: number;
    latitude: number;
    longitude: number;
  }> = [];
  const serviceRecords: Array<{
    id: Id<'services'>;
    providerId: Id<'users'>;
    profileId: Id<'profiles'>;
    categorySlug: CategorySlug;
    title: string;
    price: number;
  }> = [];
  const profileIds: Id<'profiles'>[] = [adminProfileId];

  // --- 15 clients (toutes villes + quelques doublons) ---
  for (let i = 0; i < 15; i++) {
    const city = CITIES[i % CITIES.length]!;
    const isFemale = i % 3 !== 0;
    const firstName = pick(isFemale ? FEMALE_NAMES : MALE_NAMES, i);
    const lastName = pick(LAST_NAMES, i + 3);
    const email = `client.${slugify(firstName)}.${slugify(lastName)}${i}${DEMO_DOMAIN}`;

    const userId = await ctx.db.insert('users', {
      name: `${firstName} ${lastName}`,
      email,
      phone: `+23566${String(100000 + i).slice(-6)}`,
      image: pick(AVATARS, i),
      role: 'client',
      status: i === 14 ? 'suspended' : 'active',
      language: i % 4 === 0 ? 'ar' : i % 4 === 1 ? 'sara' : 'fr',
      createdAt: daysAgo(90 - i),
      updatedAt: ts,
    });
    counts.users++;
    clientIds.push(userId);

    await ctx.db.insert('profiles', {
      userId,
      firstName,
      lastName,
      gender: isFemale ? 'female' : 'male',
      city: city.city,
      region: city.region,
      phone: `+23566${String(100000 + i).slice(-6)}`,
      avatarUrl: pick(AVATARS, i),
      bio: i % 2 === 0 ? `Cliente active à ${city.city}, à la recherche de talents locaux.` : undefined,
      skills: [],
      availability: 'available',
      ...jitterCoords(city.lat, city.lng, i + 10, 0.012),
      isVerified: false,
      isPremium: false,
      averageRating: 0,
      reviewCount: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      trustScore: 20,
      viewCount: 10 + i * 3,
      clickCount: i * 2,
      createdAt: daysAgo(90 - i),
      updatedAt: ts,
    });
    counts.profiles++;
  }

  // --- 25 prestataires (2-3 par catégorie, profils variés) ---
  for (let i = 0; i < 25; i++) {
    const catDef = CATEGORY_DEFS[i % CATEGORY_DEFS.length]!;
    const city = CITIES[(i + 2) % CITIES.length]!;
    const isFemale = i % 2 === 0;
    const firstName = pick(isFemale ? FEMALE_NAMES : MALE_NAMES, i + 5);
    const lastName = pick(LAST_NAMES, i);
    const email = `provider.${slugify(catDef.slug)}.${i}${DEMO_DOMAIN}`;

    const isVerified = i % 5 !== 4;
    const isPremium = i % 4 === 0;
    const isPending = i === 23;
    const isRejected = i === 24;
    const availability = (['available', 'busy', 'unavailable'] as const)[i % 3]!;

    const userId = await ctx.db.insert('users', {
      name: `${firstName} ${lastName}`,
      email,
      phone: `+23577${String(200000 + i).slice(-6)}`,
      image: pick(AVATARS, i + 2),
      role: 'provider',
      status: isRejected ? 'rejected' : isPending ? 'pending' : 'active',
      language: 'fr',
      createdAt: daysAgo(180 - i * 3),
      updatedAt: ts,
    });
    counts.users++;

    const experienceYears = 1 + (i % 12);
    const providerGeo = jitterCoords(city.lat, city.lng, i + 40, 0.014);
    const profileId = await ctx.db.insert('profiles', {
      userId,
      firstName,
      lastName,
      gender: isFemale ? 'female' : 'male',
      city: city.city,
      region: city.region,
      phone: `+23577${String(200000 + i).slice(-6)}`,
      bio: `${catDef.nameFr} à ${city.city}. ${experienceYears} ans d'expérience, clients satisfaits.`,
      avatarUrl: pick(AVATARS, i + 1),
      skills: [...catDef.skills],
      experienceYears,
      hourlyRate: 2000 + (i % 8) * 1500,
      availability,
      socialLinks:
        i % 3 === 0
          ? { facebook: `https://facebook.com/${slugify(firstName)}`, instagram: `@${slugify(firstName)}_td` }
          : undefined,
      latitude: providerGeo.latitude,
      longitude: providerGeo.longitude,
      isVerified,
      isPremium,
      averageRating: 0,
      reviewCount: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      responseTimeMinutes: 5 + (i % 20) * 3,
      trustScore: 0,
      viewCount: 50 + i * 15,
      clickCount: 20 + i * 8,
      createdAt: daysAgo(180 - i * 3),
      updatedAt: ts,
    });
    counts.profiles++;
    profileIds.push(profileId);

    providerRecords.push({
      userId,
      profileId,
      categorySlug: catDef.slug,
      cityIndex: (i + 2) % CITIES.length,
      latitude: providerGeo.latitude,
      longitude: providerGeo.longitude,
    });

    if (isPremium && !isPending && !isRejected) {
      const start = daysAgo(10);
      await ctx.db.insert('subscriptions', {
        userId,
        profileId,
        plan: 'premium',
        status: i % 8 === 0 ? 'expired' : 'active',
        startDate: start,
        endDate: start + 30 * 86_400_000,
        amount: PREMIUM_MONTHLY_PRICE,
        currency: 'XAF',
        createdAt: start,
        updatedAt: ts,
      });
      counts.subscriptions++;
    }
  }

  // --- Services (2-3 par prestataire actif ≈ 55 services) ---
  let serviceIndex = 0;
  for (const provider of providerRecords) {
    const user = await ctx.db.get(provider.userId);
    if (user?.status !== 'active') continue;

    const catDef = CATEGORY_DEFS.find((c) => c.slug === provider.categorySlug)!;
    const city = CITIES[provider.cityIndex]!;
    const titles = SERVICE_TITLES[provider.categorySlug];
    const serviceCount = 2 + (serviceIndex % 2);

    for (let j = 0; j < serviceCount; j++) {
      const title = pick(titles, serviceIndex + j);
      const price = 15000 + (serviceIndex % 10) * 12000 + j * 5000;
      const categoryId = categoryMap.get(provider.categorySlug);
      if (!categoryId) {
        throw new Error(`Catégorie introuvable: ${provider.categorySlug}`);
      }
      // ~half inherit provider geo; others get a distinct service offset (demo own position)
      const inheritProviderGeo = j === 0 || serviceIndex % 3 === 0;
      const serviceGeo = inheritProviderGeo
        ? { latitude: provider.latitude, longitude: provider.longitude }
        : jitterCoords(provider.latitude, provider.longitude, serviceIndex * 3 + j + 7, 0.018);
      const serviceId = await ctx.db.insert('services', {
        providerId: provider.userId,
        profileId: provider.profileId,
        title,
        description: `${title} — prestation professionnelle à ${city.city}. Devis détaillé, satisfaction garantie.`,
        categoryId,
        pricingType: j % 3 === 0 ? 'negotiable' : 'fixed',
        price,
        currency: 'XAF',
        deliveryDays: 3 + (serviceIndex % 14),
        photos: [catDef.image, pick(PORTFOLIO_IMAGES, serviceIndex)],
        availability: (['available', 'busy', 'available'] as const)[serviceIndex % 3]!,
        isActive: serviceIndex % 17 !== 16,
        viewCount: 30 + serviceIndex * 5,
        orderCount: 0,
        averageRating: 0,
        reviewCount: 0,
        city: city.city,
        region: city.region,
        latitude: serviceGeo.latitude,
        longitude: serviceGeo.longitude,
        createdAt: daysAgo(120 - serviceIndex),
        updatedAt: ts,
      });
      counts.services++;
      serviceRecords.push({
        id: serviceId,
        providerId: provider.userId,
        profileId: provider.profileId,
        categorySlug: provider.categorySlug,
        title,
        price,
      });
      serviceIndex++;
    }

    // Portfolio (2-3 items)
    for (let p = 0; p < 2 + (provider.userId.length % 2); p++) {
      await ctx.db.insert('portfolio', {
        profileId: provider.profileId,
        providerId: provider.userId,
        title: `Réalisation ${p + 1} — ${catDef.nameFr}`,
        description: `Exemple de travail récent à ${city.city}.`,
        mediaType: 'image',
        mediaUrl: pick(PORTFOLIO_IMAGES, serviceIndex + p),
        thumbnailUrl: pick(PORTFOLIO_IMAGES, serviceIndex + p + 1),
        sortOrder: p,
        createdAt: daysAgo(60 - p * 5),
        updatedAt: ts,
      });
      counts.portfolio++;
    }
  }

  // --- Commandes (~100, priorité aux cas positifs) ---
  const orderStatuses: OrderStatus[] = [
    'completed', 'completed', 'completed', 'completed', 'completed', 'completed',
    'accepted', 'accepted',
    'pending', 'pending',
    'cancelled',
  ];

  let orderSeq = 0;
  for (let si = 0; si < serviceRecords.length; si++) {
    const service = serviceRecords[si]!;
    if (si % 2 !== 0 && si % 3 !== 0) continue;

    const numOrders = 1 + (si % 3);
    for (let o = 0; o < numOrders; o++) {
      const clientId = pick(clientIds, orderSeq + o);
      const status = pick(orderStatuses, orderSeq);
      const offPlatform = orderSeq % 11 === 10;
      const method = paymentMethodForIndex(orderSeq, offPlatform);
      const amount = service.price + (orderSeq % 5) * 5000;
      const created = daysAgo(45 - (orderSeq % 40));
      const acceptedAt = status !== 'pending' ? created + 86_400_000 : undefined;
      const completedAt =
        status === 'completed' ? (acceptedAt ?? created) + 3 * 86_400_000 : undefined;
      const cancelledAt = status === 'cancelled' ? created + 2 * 86_400_000 : undefined;

      const canReview =
        status === 'completed' && !offPlatform && method !== 'off_platform';

      const orderId = await ctx.db.insert('orders', {
        clientId,
        providerId: service.providerId,
        serviceId: service.id,
        status,
        title: service.title,
        description: `Commande démo #${orderSeq + 1} — ${service.title}`,
        agreedPrice: amount,
        currency: 'XAF',
        deliveryDate: new Date(created + 7 * 86_400_000).toISOString().slice(0, 10),
        paymentMethod: method,
        isOffPlatformPayment: offPlatform,
        canReview,
        clientNotes: orderSeq % 4 === 0 ? 'Merci de confirmer la date de début.' : undefined,
        providerNotes: status === 'accepted' ? 'Créneau confirmé, démarrage lundi.' : undefined,
        acceptedAt,
        completedAt,
        cancelledAt,
        createdAt: created,
        updatedAt: ts,
      });
      counts.orders++;

      // Conversation + messages pour commandes actives/terminées
      if (status !== 'cancelled' || orderSeq % 3 === 0) {
        const convId = await ctx.db.insert('conversations', {
          participantIds: [clientId, service.providerId],
          orderId,
          lastMessageAt: hoursAgo(orderSeq % 48),
          lastMessagePreview: 'Merci pour votre message !',
          createdAt: created,
          updatedAt: ts,
        });
        counts.conversations++;
        await ctx.db.patch(orderId, { conversationId: convId });

        const msgTemplates = [
          { fromClient: true, text: 'Bonjour, êtes-vous disponible cette semaine ?' },
          { fromClient: false, text: 'Bonjour ! Oui, je peux commencer dès mardi.' },
          { fromClient: true, text: 'Parfait, voici le brief détaillé en pièce jointe.' },
          { fromClient: false, text: 'Bien reçu, je vous envoie une proposition.' },
        ];
        for (let m = 0; m < msgTemplates.length; m++) {
          const tpl = msgTemplates[m]!;
          const senderId = tpl.fromClient ? clientId : service.providerId;
          await ctx.db.insert('messages', {
            conversationId: convId,
            senderId,
            type: m === 2 && orderSeq % 5 === 0 ? 'image' : 'text',
            content: m === 2 && orderSeq % 5 === 0 ? 'Photo de référence' : tpl.text,
            mediaUrl: m === 2 && orderSeq % 5 === 0 ? IMG.chatSample : undefined,
            readBy: m < msgTemplates.length - 1 ? [senderId] : [clientId, service.providerId],
            createdAt: created + (m + 1) * 3_600_000,
          });
          counts.messages++;
        }
      }

      // Paiements
      if (status !== 'pending' || orderSeq % 4 === 0) {
        const { commission, providerAmount } = offPlatform
          ? { commission: 0, providerAmount: amount }
          : commissionSplit(amount);

        let paymentStatus: 'pending' | 'held' | 'released' | 'refunded' | 'failed' =
          'pending';
        if (status === 'accepted') paymentStatus = 'held';
        if (status === 'completed') paymentStatus = 'released';
        if (status === 'cancelled') paymentStatus = orderSeq % 2 === 0 ? 'refunded' : 'failed';

        await ctx.db.insert('payments', {
          orderId,
          clientId,
          providerId: service.providerId,
          amount,
          commission,
          providerAmount,
          currency: 'XAF',
          method,
          status: paymentStatus,
          fedapayReference:
            method === 'fedapay' ? `DEMO-FP-${orderSeq}-${Date.now()}` : undefined,
          phoneNumber:
            method === 'airtel_money' || method === 'moov_money'
              ? `+23566${String(300000 + orderSeq).slice(-6)}`
              : undefined,
          heldAt: paymentStatus === 'held' || paymentStatus === 'released' ? acceptedAt : undefined,
          releasedAt: paymentStatus === 'released' ? completedAt : undefined,
          createdAt: created + 86_400_000,
          updatedAt: ts,
        });
        counts.payments++;
      }

      // Avis (commandes terminées + paiement intégré)
      if (canReview && orderSeq % 3 !== 2) {
        const rating = ratingForIndex(orderSeq);
        const isVisible = orderSeq % 29 !== 28;
        const isModerated = !isVisible;
        const reviewTs = (completedAt ?? created) + 86_400_000;

        await ctx.db.insert('reviews', {
          orderId,
          clientId,
          providerId: service.providerId,
          serviceId: service.id,
          rating,
          comment: reviewComment(rating, orderSeq),
          photos: orderSeq % 6 === 0 ? [pick(PORTFOLIO_IMAGES, orderSeq)] : undefined,
          providerResponse:
            rating >= 4 && orderSeq % 2 === 0
              ? pick(PROVIDER_RESPONSES, orderSeq)
              : undefined,
          providerRespondedAt:
            rating >= 4 && orderSeq % 2 === 0 ? reviewTs + 86_400_000 : undefined,
          isOfficial: true,
          isModerated,
          isVisible,
          createdAt: reviewTs,
          updatedAt: ts,
        });
        counts.reviews++;
      }

      orderSeq++;
    }
  }

  // --- Favoris ---
  for (let i = 0; i < clientIds.length; i++) {
    const clientId = clientIds[i]!;
    const favCount = 2 + (i % 4);
    for (let f = 0; f < favCount; f++) {
      const targetService = serviceRecords[(i * 3 + f) % serviceRecords.length]!;
      await ctx.db.insert('favorites', {
        userId: clientId,
        targetType: f % 3 === 0 ? 'provider' : 'service',
        targetId: f % 3 === 0 ? targetService.providerId : targetService.id,
        providerId: targetService.providerId,
        serviceId: f % 3 === 0 ? undefined : targetService.id,
        createdAt: daysAgo(20 - f),
      });
      counts.favorites++;
    }
  }

  // --- Notifications variées ---
  const notifTemplates: Array<{
    type: 'order' | 'payment' | 'message' | 'review' | 'validation' | 'subscription' | 'system';
    title: string;
    body: string;
  }> = [
    { type: 'order', title: 'Nouvelle commande', body: 'Vous avez reçu une nouvelle demande.' },
    { type: 'payment', title: 'Paiement confirmé', body: 'Le paiement a été sécurisé sur la plateforme.' },
    { type: 'message', title: 'Nouveau message', body: 'Un client vous a écrit.' },
    { type: 'review', title: 'Nouvel avis', body: 'Vous avez reçu une note de 5/5.' },
    { type: 'validation', title: 'Profil validé', body: 'Félicitations, votre compte prestataire est actif.' },
    { type: 'subscription', title: 'Premium activé', body: 'Votre abonnement Premium est actif.' },
    { type: 'system', title: 'Bienvenue', body: 'Bienvenue sur TalentTchad !' },
  ];

  for (let i = 0; i < providerRecords.length; i++) {
    const provider = providerRecords[i]!;
    for (let n = 0; n < 3; n++) {
      const tpl = pick(notifTemplates, i + n);
      await ctx.db.insert('notifications', {
        userId: provider.userId,
        type: tpl.type,
        title: tpl.title,
        body: tpl.body,
        isRead: n === 0,
        createdAt: daysAgo(n * 2 + i),
      });
      counts.notifications++;
    }
  }
  for (let i = 0; i < Math.min(clientIds.length, 8); i++) {
    await ctx.db.insert('notifications', {
      userId: clientIds[i]!,
      type: 'order',
      title: 'Commande acceptée',
      body: 'Votre prestataire a accepté la commande.',
      isRead: i % 2 === 0,
      createdAt: daysAgo(i),
    });
    counts.notifications++;
  }

  // --- Signalements (admin) ---
  const reportTargets = [
    { type: 'service' as const, reason: 'Contenu inapproprié', status: 'open' as const },
    { type: 'review' as const, reason: 'Avis suspect', status: 'in_review' as const },
    { type: 'user' as const, reason: 'Comportement abusif', status: 'resolved' as const },
    { type: 'order' as const, reason: 'Litige paiement', status: 'dismissed' as const },
  ];
  for (let i = 0; i < reportTargets.length; i++) {
    const rt = reportTargets[i]!;
    const targetService = serviceRecords[i * 5]!;
    await ctx.db.insert('reports', {
      reporterId: clientIds[i]!,
      targetType: rt.type,
      targetId:
        rt.type === 'service'
          ? targetService.id
          : rt.type === 'user'
            ? targetService.providerId
            : `demo-target-${i}`,
      reason: rt.reason,
      description: `Signalement démo — ${rt.reason}`,
      status: rt.status,
      resolvedBy: rt.status === 'resolved' || rt.status === 'dismissed' ? adminId : undefined,
      resolution:
        rt.status === 'resolved'
          ? 'Avertissement envoyé au prestataire.'
          : rt.status === 'dismissed'
            ? 'Signalement non fondé.'
            : undefined,
      createdAt: daysAgo(15 - i * 2),
      updatedAt: ts,
    });
    counts.reports++;
  }

  // --- Historique de recherche ---
  const queries = [
    'développeur web N\'Djamena',
    'photographe mariage',
    'couturière Moundou',
    'logo pas cher',
    'réparation ordinateur',
    'community manager',
    'cours anglais',
    'coiffure tresses',
  ];
  for (let i = 0; i < clientIds.length; i++) {
    for (let q = 0; q < 2; q++) {
      await ctx.db.insert('searchHistory', {
        userId: clientIds[i]!,
        query: pick(queries, i + q),
        filters: q === 0 ? { city: pick(CITIES, i).city } : { minRating: 4 },
        createdAt: daysAgo(7 - q),
      });
      counts.searchHistory++;
    }
  }

  // --- Recalcul stats profils & services ---
  await recalculateProfileAndServiceStats(ctx, profileIds);

  return {
    seeded: true,
    message: 'Base démo TalentTchad initialisée avec succès.',
    counts,
    demoAccounts: {
      admin: `admin${DEMO_DOMAIN}`,
      clients: `${clientIds.length} comptes client*${DEMO_DOMAIN}`,
      providers: `${providerRecords.length} comptes provider*${DEMO_DOMAIN}`,
      note: 'Comptes browse-only (pas de authAccounts). Connectez-vous avec un vrai compte ou utilisez l’admin bootstrap.',
    },
  };
}

export const seedAll = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => runSeed(ctx, args.force ?? false),
});

/** Wrapper public pour lancer depuis le dashboard Convex en dev. */
export const seedAllDev = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => runSeed(ctx, args.force ?? false),
});

/**
 * Re-patch lat/lng on existing profiles & services (no inserts).
 * Spreads pins across MVP cities with jitter. Safe to re-run.
 */
async function runUpdateDemoGeoPositions(ctx: MutationCtx) {
  const ts = now();
  let profilesPatched = 0;
  let servicesPatched = 0;

  const profiles = await ctx.db.query('profiles').collect();
  const profileGeo = new Map<Id<'profiles'>, { latitude: number; longitude: number; city: string; region: string }>();

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i]!;
    const base = coordsForCity(profile.city);
    const geo = jitterCoords(base.lat, base.lng, i + 100, 0.014);
    await ctx.db.patch(profile._id, {
      latitude: geo.latitude,
      longitude: geo.longitude,
      // keep city/region; only refresh region if empty mismatch from known city
      region: profile.region || base.region,
      updatedAt: ts,
    });
    profileGeo.set(profile._id, {
      latitude: geo.latitude,
      longitude: geo.longitude,
      city: profile.city,
      region: profile.region || base.region,
    });
    profilesPatched++;
  }

  const services = await ctx.db.query('services').collect();
  for (let i = 0; i < services.length; i++) {
    const service = services[i]!;
    const providerPos = profileGeo.get(service.profileId);
    const base = coordsForCity(service.city || providerPos?.city || "N'Djamena");
    // Alternate: inherit provider coords vs own offset (demo both modes)
    const geo =
      i % 2 === 0 && providerPos
        ? { latitude: providerPos.latitude, longitude: providerPos.longitude }
        : jitterCoords(
            providerPos?.latitude ?? base.lat,
            providerPos?.longitude ?? base.lng,
            i + 200,
            0.018,
          );
    await ctx.db.patch(service._id, {
      latitude: geo.latitude,
      longitude: geo.longitude,
      city: service.city || providerPos?.city || "N'Djamena",
      region: service.region || providerPos?.region || base.region,
      updatedAt: ts,
    });
    servicesPatched++;
  }

  return {
    updated: true,
    message: 'Positions géo démo mises à jour (patch only).',
    profilesPatched,
    servicesPatched,
  };
}

export const updateDemoGeoPositions = internalMutation({
  args: {},
  handler: async (ctx) => runUpdateDemoGeoPositions(ctx),
});

/** Wrapper public pour lancer depuis le CLI / dashboard Convex. */
export const updateDemoGeoPositionsDev = mutation({
  args: {},
  handler: async (ctx) => runUpdateDemoGeoPositions(ctx),
});
