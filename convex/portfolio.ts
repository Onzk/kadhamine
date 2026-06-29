import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, requireRole, now } from './lib';

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (!profile) return [];

    const items = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect();

    return await Promise.all(
      items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(async (item) => {
          const mediaUrl = item.storageId
            ? await ctx.storage.getUrl(item.storageId)
            : item.mediaUrl;
          return { ...item, mediaUrl };
        }),
    );
  },
});

export const listByProfile = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    return await Promise.all(
      items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(async (item) => {
          const mediaUrl = item.storageId
            ? await ctx.storage.getUrl(item.storageId)
            : item.mediaUrl;
          return { ...item, mediaUrl };
        }),
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal('image'), v.literal('video'), v.literal('document')),
    storageId: v.optional(v.id('_storage')),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (!profile) throw new Error('Profil requis');

    const existing = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect();

    const timestamp = now();
    return await ctx.db.insert('portfolio', {
      profileId: profile._id,
      providerId: userId,
      title: args.title,
      description: args.description,
      mediaType: args.mediaType,
      storageId: args.storageId,
      mediaUrl: args.mediaUrl,
      sortOrder: existing.length,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const update = mutation({
  args: {
    itemId: v.id('portfolio'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.providerId !== userId) throw new Error('Élément introuvable');

    const { itemId, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(itemId, patch);
  },
});

export const remove = mutation({
  args: { itemId: v.id('portfolio') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.providerId !== userId) throw new Error('Élément introuvable');

    if (item.storageId) {
      await ctx.storage.delete(item.storageId);
    }
    await ctx.db.delete(args.itemId);
  },
});
