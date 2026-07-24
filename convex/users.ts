import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { coordsForCity } from './cities';
import { requireAuth, now } from './lib';

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    return { ...user, profile };
  },
});

export const registerProfile = mutation({
  args: {
    role: v.union(v.literal('client'), v.literal('provider')),
    firstName: v.string(),
    lastName: v.string(),
    city: v.string(),
    region: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireAuth(ctx);

    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (existing) throw new Error('Profil déjà créé');

    const timestamp = now();
    await ctx.db.patch(userId, {
      role: args.role,
      status: args.role === 'provider' ? 'pending' : 'active',
      phone: args.phone,
      updatedAt: timestamp,
    });

    const { lat, lng } = coordsForCity(args.city);

    const profileId = await ctx.db.insert('profiles', {
      userId,
      firstName: args.firstName,
      lastName: args.lastName,
      city: args.city,
      region: args.region,
      phone: args.phone,
      latitude: lat,
      longitude: lng,
      skills: [],
      availability: 'available',
      isVerified: false,
      isPremium: false,
      averageRating: 0,
      reviewCount: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      trustScore: 0,
      viewCount: 0,
      clickCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { userId, profileId };
  },
});

export const updatePushToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    await ctx.db.patch(userId, {
      pushToken: args.pushToken,
      updatedAt: now(),
    });
  },
});

export const updateLanguage = mutation({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    await ctx.db.patch(userId, {
      language: args.language,
      updatedAt: now(),
    });
  },
});

/** Mark the current user as active (client presence heartbeat). */
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    await ctx.db.patch(userId, { lastActiveAt: now() });
  },
});
