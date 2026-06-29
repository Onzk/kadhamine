import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, now } from './lib';

export const create = mutation({
  args: {
    targetType: v.union(
      v.literal('user'),
      v.literal('review'),
      v.literal('service'),
      v.literal('order'),
    ),
    targetId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const timestamp = now();

    return await ctx.db.insert('reports', {
      reporterId: userId,
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason,
      description: args.description,
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    return await ctx.db
      .query('reports')
      .withIndex('by_reporter', (q) => q.eq('reporterId', userId))
      .order('desc')
      .collect();
  },
});
