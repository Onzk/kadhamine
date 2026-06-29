import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, requireRole, calculateTrustScore, calculateBadge, now } from './lib';

export const getById = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);
    const services = await ctx.db
      .query('services')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const portfolio = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_provider', (q) => q.eq('providerId', profile.userId))
      .filter((q) => q.eq(q.field('isVisible'), true))
      .order('desc')
      .take(10);

    return { profile, user, services, portfolio, reviews };
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    return await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
  },
});

export const update = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    gender: v.optional(
      v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    ),
    dateOfBirth: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    experienceYears: v.optional(v.number()),
    hourlyRate: v.optional(v.number()),
    availability: v.optional(
      v.union(
        v.literal('available'),
        v.literal('busy'),
        v.literal('unavailable'),
      ),
    ),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
      }),
    ),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) throw new Error('Profil introuvable');

    const updates: Record<string, unknown> = { updatedAt: now() };
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});

export const updateStats = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['admin', 'provider']);
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error('Profil introuvable');

    const trustScore = calculateTrustScore(profile);
    const badge = calculateBadge(profile);

    await ctx.db.patch(args.profileId, { trustScore, badge });
  },
});

export const incrementView = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return;
    await ctx.db.patch(args.profileId, {
      viewCount: profile.viewCount + 1,
    });
  },
});
