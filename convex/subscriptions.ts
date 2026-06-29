import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  requireAuth,
  requireRole,
  createNotification,
  refreshProfileStats,
  PREMIUM_MONTHLY_PRICE,
  now,
} from './lib';

const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    if (!subscription || subscription.status !== 'active') return null;
    if (subscription.endDate < now()) return null;
    return subscription;
  },
});

export const getPlans = query({
  args: {},
  handler: async () => ({
    premium: {
      name: 'Premium',
      price: PREMIUM_MONTHLY_PRICE,
      currency: 'XAF',
      durationDays: 30,
      benefits: [
        'Profil mis en avant dans les recherches',
        'Badge Premium visible',
        'Statistiques avancées',
        'Priorité dans les résultats',
        'Mise en avant des services',
      ],
    },
  }),
});

export const subscribe = mutation({
  args: {
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (!profile) throw new Error('Profil requis');

    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const active = existing.find((s) => s.status === 'active' && s.endDate > now());
    if (active) throw new Error('Abonnement Premium déjà actif');

    const timestamp = now();
    const endDate = timestamp + PREMIUM_DURATION_MS;

    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId,
      profileId: profile._id,
      plan: 'premium',
      status: 'active',
      startDate: timestamp,
      endDate,
      amount: PREMIUM_MONTHLY_PRICE,
      currency: 'XAF',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.patch(profile._id, {
      isPremium: true,
      badge: 'premium',
      updatedAt: timestamp,
    });

    await refreshProfileStats(ctx, profile._id);

    await createNotification(ctx, {
      userId,
      type: 'subscription',
      title: 'Bienvenue Premium !',
      body: 'Votre profil est maintenant mis en avant pendant 30 jours.',
      data: { subscriptionId, reference: args.paymentReference },
    });

    return subscriptionId;
  },
});

export const cancel = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    if (!subscription || subscription.status !== 'active') {
      throw new Error('Aucun abonnement actif');
    }

    await ctx.db.patch(subscription._id, {
      status: 'cancelled',
      updatedAt: now(),
    });
  },
});

export const expireCheck = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    if (!profile) return;

    const hasActive = subscriptions.some(
      (s) => s.status === 'active' && s.endDate > now(),
    );

    if (!hasActive && profile.isPremium) {
      await ctx.db.patch(profile._id, {
        isPremium: false,
        updatedAt: now(),
      });
      await refreshProfileStats(ctx, profile._id);

      for (const sub of subscriptions) {
        if (sub.status === 'active' && sub.endDate <= now()) {
          await ctx.db.patch(sub._id, { status: 'expired', updatedAt: now() });
        }
      }
    }
  },
});
