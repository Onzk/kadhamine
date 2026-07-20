import { mutation } from './_generated/server';
import { now, requireAuth } from './lib';

const DEFAULT_CATEGORIES = [
  {
    nameFr: 'Développement web & mobile',
    nameAr: 'تطوير الويب والجوال',
    nameSara: 'Développement web & mobile',
    slug: 'developpement',
    icon: 'code',
    sortOrder: 1,
  },
  {
    nameFr: 'Design graphique',
    nameAr: 'تصميم جرافيك',
    nameSara: 'Design graphique',
    slug: 'design',
    icon: 'palette',
    sortOrder: 2,
  },
  {
    nameFr: 'Couture',
    nameAr: 'خياطة',
    nameSara: 'Couture',
    slug: 'couture',
    icon: 'scissors',
    sortOrder: 3,
  },
  {
    nameFr: 'Coiffure',
    nameAr: 'تصفيف الشعر',
    nameSara: 'Coiffure',
    slug: 'coiffure',
    icon: 'scissors',
    sortOrder: 4,
  },
  {
    nameFr: 'Photographie',
    nameAr: 'تصوير',
    nameSara: 'Photographie',
    slug: 'photographie',
    icon: 'camera',
    sortOrder: 5,
  },
  {
    nameFr: 'Réparation informatique',
    nameAr: 'إصلاح الحاسوب',
    nameSara: 'Réparation informatique',
    slug: 'reparation',
    icon: 'wrench',
    sortOrder: 6,
  },
  {
    nameFr: 'Marketing digital',
    nameAr: 'تسويق رقمي',
    nameSara: 'Marketing digital',
    slug: 'marketing',
    icon: 'megaphone',
    sortOrder: 7,
  },
  {
    nameFr: 'Traduction',
    nameAr: 'ترجمة',
    nameSara: 'Traduction',
    slug: 'traduction',
    icon: 'translate',
    sortOrder: 8,
  },
  {
    nameFr: 'Formation & tutorat',
    nameAr: 'تكوين ودروس',
    nameSara: 'Formation & tutorat',
    slug: 'formation',
    icon: 'book',
    sortOrder: 9,
  },
  {
    nameFr: 'Artisanat',
    nameAr: 'حرف يدوية',
    nameSara: 'Artisanat',
    slug: 'artisanat',
    icon: 'hammer',
    sortOrder: 10,
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
