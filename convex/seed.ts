import { mutation } from './_generated/server';
import { now, requireAuth } from './lib';

const DEFAULT_CATEGORIES = [
  { nameFr: 'Informatique & Tech', slug: 'informatique', icon: '💻', sortOrder: 1 },
  { nameFr: 'Design & Création', slug: 'design', icon: '🎨', sortOrder: 2 },
  { nameFr: 'Marketing & Communication', slug: 'marketing', icon: '📢', sortOrder: 3 },
  { nameFr: 'Rédaction & Traduction', slug: 'redaction', icon: '✍️', sortOrder: 4 },
  { nameFr: 'Photo & Vidéo', slug: 'photo-video', icon: '📷', sortOrder: 5 },
  { nameFr: 'Événementiel', slug: 'evenementiel', icon: '🎉', sortOrder: 6 },
  { nameFr: 'Bricolage & Réparation', slug: 'bricolage', icon: '🔧', sortOrder: 7 },
  { nameFr: 'Cuisine & Traiteur', slug: 'cuisine', icon: '🍳', sortOrder: 8 },
  { nameFr: 'Beauté & Coiffure', slug: 'beaute', icon: '💇', sortOrder: 9 },
  { nameFr: 'Cours & Formation', slug: 'formation', icon: '📚', sortOrder: 10 },
  { nameFr: 'Transport & Livraison', slug: 'transport', icon: '🚗', sortOrder: 11 },
  { nameFr: 'Agriculture', slug: 'agriculture', icon: '🌾', sortOrder: 12 },
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
