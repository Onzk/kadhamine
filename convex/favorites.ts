import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, now } from './lib';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    return await ctx.db
      .query('favorites')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

export const toggle = mutation({
  args: {
    targetType: v.union(v.literal('provider'), v.literal('service')),
    targetId: v.string(),
    providerId: v.optional(v.id('users')),
    serviceId: v.optional(v.id('services')),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);

    const existing = await ctx.db
      .query('favorites')
      .withIndex('by_user_target', (q) =>
        q
          .eq('userId', userId)
          .eq('targetType', args.targetType)
          .eq('targetId', args.targetId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }

    await ctx.db.insert('favorites', {
      userId,
      targetType: args.targetType,
      targetId: args.targetId,
      providerId: args.providerId,
      serviceId: args.serviceId,
      createdAt: now(),
    });

    return { favorited: true };
  },
});

export const isFavorited = query({
  args: {
    targetType: v.union(v.literal('provider'), v.literal('service')),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    let userId;
    try {
      ({ userId } = await requireAuth(ctx));
    } catch {
      return false;
    }

    const existing = await ctx.db
      .query('favorites')
      .withIndex('by_user_target', (q) =>
        q
          .eq('userId', userId)
          .eq('targetType', args.targetType)
          .eq('targetId', args.targetId),
      )
      .first();

    return Boolean(existing);
  },
});
