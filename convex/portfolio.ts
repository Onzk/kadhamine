import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { requireRole, now } from './lib';

async function enrichPortfolioItem(ctx: QueryCtx, item: {
  _id: Id<'portfolio'>;
  profileId: Id<'profiles'>;
  providerId: Id<'users'>;
  title: string;
  description?: string;
  mediaType: 'image' | 'video' | 'document';
  mediaUrl?: string;
  storageId?: Id<'_storage'>;
  thumbnailUrl?: string;
  serviceId?: Id<'services'>;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}) {
  const mediaUrl = item.storageId
    ? await ctx.storage.getUrl(item.storageId)
    : item.mediaUrl;

  let relatedService: { _id: Id<'services'>; title: string } | null = null;
  if (item.serviceId) {
    const service = await ctx.db.get(item.serviceId);
    if (service && service.isActive) {
      relatedService = { _id: service._id, title: service.title };
    }
  }

  return { ...item, mediaUrl: mediaUrl ?? item.mediaUrl, relatedService };
}

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
        .map((item) => enrichPortfolioItem(ctx, item)),
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
        .map((item) => enrichPortfolioItem(ctx, item)),
    );
  },
});

export const getById = query({
  args: { itemId: v.id('portfolio') },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return null;
    return enrichPortfolioItem(ctx, item);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    mediaType: v.union(v.literal('image'), v.literal('video'), v.literal('document')),
    storageId: v.optional(v.id('_storage')),
    mediaUrl: v.optional(v.string()),
    serviceId: v.optional(v.id('services')),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (!profile) throw new Error('Profil requis');

    if (args.serviceId) {
      const service = await ctx.db.get(args.serviceId);
      if (!service || service.providerId !== userId) {
        throw new Error('Service associé introuvable');
      }
    }

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
      serviceId: args.serviceId,
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
    serviceId: v.optional(v.union(v.id('services'), v.null())),
    storageId: v.optional(v.id('_storage')),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(
      v.union(v.literal('image'), v.literal('video'), v.literal('document')),
    ),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.providerId !== userId) throw new Error('Élément introuvable');

    const { itemId, serviceId, storageId, ...rest } = args;
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) patch[key] = value;
    }

    if (storageId !== undefined) {
      if (item.storageId && item.storageId !== storageId) {
        await ctx.storage.delete(item.storageId);
      }
      patch.storageId = storageId;
    }

    if (serviceId !== undefined) {
      if (serviceId === null) {
        patch.serviceId = undefined;
      } else {
        const service = await ctx.db.get(serviceId);
        if (!service || service.providerId !== userId) {
          throw new Error('Service associé introuvable');
        }
        patch.serviceId = serviceId;
      }
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
