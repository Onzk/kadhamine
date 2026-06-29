import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin, now } from './lib';

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query('categories')
        .withIndex('by_active', (q) => q.eq('isActive', true))
        .collect();
    }
    return await ctx.db.query('categories').collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
  },
});

export const create = mutation({
  args: {
    nameFr: v.string(),
    nameAr: v.optional(v.string()),
    nameSara: v.optional(v.string()),
    slug: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const timestamp = now();
    return await ctx.db.insert('categories', {
      nameFr: args.nameFr,
      nameAr: args.nameAr,
      nameSara: args.nameSara,
      slug: args.slug,
      icon: args.icon,
      description: args.description,
      isActive: true,
      sortOrder: args.sortOrder ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const update = mutation({
  args: {
    categoryId: v.id('categories'),
    nameFr: v.optional(v.string()),
    nameAr: v.optional(v.string()),
    nameSara: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { categoryId, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(categoryId, patch);
  },
});

export const remove = mutation({
  args: { categoryId: v.id('categories') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.categoryId, {
      isActive: false,
      updatedAt: now(),
    });
  },
});
