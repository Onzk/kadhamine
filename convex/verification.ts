import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, requireRole, now } from './lib';

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    const request = await ctx.db
      .query('verificationRequests')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();
    return request;
  },
});

export const submit = mutation({
  args: {
    documentType: v.union(v.literal('national_id'), v.literal('passport')),
    documentStorageId: v.id('_storage'),
    selfieStorageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (!profile) throw new Error('Profil requis');

    const pending = await ctx.db
      .query('verificationRequests')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect();
    const existing = pending.find((r) => r.userId === userId);
    if (existing) throw new Error('Une demande est déjà en cours');

    const timestamp = now();
    return await ctx.db.insert('verificationRequests', {
      userId,
      profileId: profile._id,
      documentType: args.documentType,
      documentStorageId: args.documentStorageId,
      selfieStorageId: args.selfieStorageId,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});
