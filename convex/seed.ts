import { mutation } from './_generated/server';
import { now, requireAuth } from './lib';

const DEFAULT_CATEGORIES = [
  {
    nameFr: 'Informatique & Tech',
    nameAr: 'معلومatics & تقنية',
    nameSara: 'Informatique & Tech',
    slug: 'informatique',
    icon: 'desktop',
    sortOrder: 1,
  },
  {
    nameFr: 'Développement web & mobile',
    nameAr: 'تطوير الويب والجوال',
    nameSara: 'Développement web & mobile',
    slug: 'developpement',
    icon: 'code',
    sortOrder: 2,
  },
  {
    nameFr: 'Design & Création',
    nameAr: 'تصميم وإبداع',
    nameSara: 'Design & Création',
    slug: 'design',
    icon: 'palette',
    sortOrder: 3,
  },
  {
    nameFr: 'Marketing & Communication',
    nameAr: 'تسويق واتصال',
    nameSara: 'Marketing & Communication',
    slug: 'marketing',
    icon: 'megaphone',
    sortOrder: 4,
  },
  {
    nameFr: 'Rédaction & Traduction',
    nameAr: 'كتابة وترجمة',
    nameSara: 'Rédaction & Traduction',
    slug: 'redaction',
    icon: 'pencil',
    sortOrder: 5,
  },
  {
    nameFr: 'Photo & Vidéo',
    nameAr: 'صورة وفيديو',
    nameSara: 'Photo & Vidéo',
    slug: 'photo-video',
    icon: 'video',
    sortOrder: 6,
  },
  {
    nameFr: 'Événementiel',
    nameAr: 'فعاليات',
    nameSara: 'Événementiel',
    slug: 'evenementiel',
    icon: 'event',
    sortOrder: 7,
  },
  {
    nameFr: 'Bricolage & Réparation',
    nameAr: 'أشغال يدوية وإصلاح',
    nameSara: 'Bricolage & Réparation',
    slug: 'bricolage',
    icon: 'hammer',
    sortOrder: 8,
  },
  {
    nameFr: 'Cuisine & Traiteur',
    nameAr: 'طبخ وتموين',
    nameSara: 'Cuisine & Traiteur',
    slug: 'cuisine',
    icon: 'food',
    sortOrder: 9,
  },
  {
    nameFr: 'Beauté & Coiffure',
    nameAr: 'جمال وتصفيف',
    nameSara: 'Beauté & Coiffure',
    slug: 'beaute',
    icon: 'beauty',
    sortOrder: 10,
  },
  {
    nameFr: 'Cours & Formation',
    nameAr: 'دروس وتكوين',
    nameSara: 'Cours & Formation',
    slug: 'formation',
    icon: 'book',
    sortOrder: 11,
  },
  {
    nameFr: 'Transport & Livraison',
    nameAr: 'نقل وتوصيل',
    nameSara: 'Transport & Livraison',
    slug: 'transport',
    icon: 'transport',
    sortOrder: 12,
  },
  {
    nameFr: 'Agriculture',
    nameAr: 'زراعة',
    nameSara: 'Agriculture',
    slug: 'agriculture',
    icon: 'agriculture',
    sortOrder: 13,
  },
  {
    nameFr: 'Couture',
    nameAr: 'خياطة',
    nameSara: 'Couture',
    slug: 'couture',
    icon: 'scissors',
    sortOrder: 14,
  },
  {
    nameFr: 'Photographie',
    nameAr: 'تصوير',
    nameSara: 'Photographie',
    slug: 'photographie',
    icon: 'camera',
    sortOrder: 15,
  },
  {
    nameFr: 'Réparation informatique',
    nameAr: 'إصلاح الحاسوب',
    nameSara: 'Réparation informatique',
    slug: 'reparation',
    icon: 'wrench',
    sortOrder: 16,
  },
  {
    nameFr: 'Traduction',
    nameAr: 'ترجمة',
    nameSara: 'Traduction',
    slug: 'traduction',
    icon: 'translate',
    sortOrder: 17,
  },
  {
    nameFr: 'Artisanat',
    nameAr: 'حرف يدوية',
    nameSara: 'Artisanat',
    slug: 'artisanat',
    icon: 'hammer',
    sortOrder: 18,
  },
];

export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('categories').first();
    if (existing) return { seeded: false, message: 'Catégories déjà initialisées' };

    const timestamp = now();
    for (const cat of DEFAULT_CATEGORIES) {
      await ctx.db.insert('categories', {
        ...cat,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    return { seeded: true, count: DEFAULT_CATEGORIES.length };
  },
});

export const seedSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', 'platform'))
      .first();

    if (existing) return { seeded: false };

    await ctx.db.insert('settings', {
      key: 'platform',
      value: {
        name: 'TalentTchad',
        commissionRate: 0.1,
        currency: 'XAF',
        supportEmail: 'support@talenttchad.com',
        supportPhone: '+235 XX XX XX XX',
      },
      updatedAt: now(),
    });

    return { seeded: true };
  },
});

/** Premier utilisateur connecté devient admin si aucun admin n'existe */
export const bootstrapAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    if (users.some((u) => u.role === 'admin')) {
      return { bootstrapped: false, message: 'Un admin existe déjà' };
    }
    const { userId } = await requireAuth(ctx);
    await ctx.db.patch(userId, {
      role: 'admin',
      status: 'active',
      updatedAt: now(),
    });
    return { bootstrapped: true, userId };
  },
});
