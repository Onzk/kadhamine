import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { QueryCtx, MutationCtx } from './_generated/server';
import { requireAdmin, now } from './lib';

const PLATFORM_KEY = 'platform';
const DEFAULT_COMMISSION_RATE = 0.1;

export async function readCommissionRate(ctx: QueryCtx | MutationCtx): Promise<number> {
  const row = await ctx.db
    .query('settings')
    .withIndex('by_key', (q) => q.eq('key', PLATFORM_KEY))
    .first();

  const value = row?.value as { commissionRate?: number } | undefined;
  const rate = value?.commissionRate;
  if (typeof rate === 'number' && rate >= 0 && rate <= 1) {
    return rate;
  }
  return DEFAULT_COMMISSION_RATE;
}

export const getCommissionRate = query({
  args: {},
  handler: async (ctx) => {
    return await readCommissionRate(ctx);
  },
});

export const getPlatform = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const row = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', PLATFORM_KEY))
      .first();

    const value = (row?.value as Record<string, unknown> | undefined) ?? {};
    return {
      commissionRate:
        typeof value.commissionRate === 'number'
          ? value.commissionRate
          : DEFAULT_COMMISSION_RATE,
      name: typeof value.name === 'string' ? value.name : 'Kadhamine',
      currency: typeof value.currency === 'string' ? value.currency : 'XAF',
      supportEmail:
        typeof value.supportEmail === 'string'
          ? value.supportEmail
          : 'support@talenttchad.com',
      supportPhone:
        typeof value.supportPhone === 'string' ? value.supportPhone : '',
    };
  },
});

export const updateCommissionRate = mutation({
  args: {
    rate: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.rate < 0 || args.rate > 1) {
      throw new Error('Le taux de commission doit être entre 0 et 1');
    }

    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', PLATFORM_KEY))
      .first();

    const timestamp = now();

    if (existing) {
      const prev = (existing.value as Record<string, unknown>) ?? {};
      await ctx.db.patch(existing._id, {
        value: { ...prev, commissionRate: args.rate },
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.insert('settings', {
        key: PLATFORM_KEY,
        value: {
          name: 'Kadhamine',
          commissionRate: args.rate,
          currency: 'XAF',
          supportEmail: 'support@talenttchad.com',
        },
        updatedAt: timestamp,
      });
    }

    return { commissionRate: args.rate };
  },
});

export const updatePlatform = mutation({
  args: {
    name: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    supportPhone: v.optional(v.string()),
    currency: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.commissionRate !== undefined) {
      if (args.commissionRate < 0 || args.commissionRate > 1) {
        throw new Error('Le taux de commission doit être entre 0 et 1');
      }
    }

    const existing = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', PLATFORM_KEY))
      .first();

    const timestamp = now();
    const patchValue: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) patchValue[key] = value;
    }

    if (existing) {
      const prev = (existing.value as Record<string, unknown>) ?? {};
      const next = { ...prev, ...patchValue };
      await ctx.db.patch(existing._id, {
        value: next,
        updatedAt: timestamp,
      });
      return next;
    }

    const next = {
      name: 'Kadhamine',
      commissionRate: DEFAULT_COMMISSION_RATE,
      currency: 'XAF',
      supportEmail: 'support@talenttchad.com',
      supportPhone: '',
      ...patchValue,
    };
    await ctx.db.insert('settings', {
      key: PLATFORM_KEY,
      value: next,
      updatedAt: timestamp,
    });
    return next;
  },
});
