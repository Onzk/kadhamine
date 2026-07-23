import { v } from 'convex/values';
import { action, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import {
  getAuthUserId,
  retrieveAccount,
  modifyAccountCredentials,
  invalidateSessions,
} from '@convex-dev/auth/server';

export const getUserEmail = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return { email: user.email ?? null };
  },
});

export const eraseUser = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const { userId } = args;

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (profile) {
      if (profile.avatarStorageId) {
        await ctx.storage.delete(profile.avatarStorageId);
      }
      await ctx.db.delete(profile._id);
    }

    const favorites = await ctx.db
      .query('favorites')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const fav of favorites) {
      await ctx.db.delete(fav._id);
    }

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }

    const accounts = await ctx.db
      .query('authAccounts')
      .withIndex('userIdAndProvider', (q) => q.eq('userId', userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query('authVerificationCodes')
        .withIndex('accountId', (q) => q.eq('accountId', account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
      }
      await ctx.db.delete(account._id);
    }

    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .collect();
    for (const session of sessions) {
      const tokens = await ctx.db
        .query('authRefreshTokens')
        .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
        .collect();
      for (const token of tokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(userId);
  },
});

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Non authentifié');

    const user = await ctx.runQuery(internal.account.getUserEmail, { userId });
    if (!user?.email) throw new Error('Email introuvable');

    const retrieved = await retrieveAccount(ctx, {
      provider: 'password',
      account: { id: user.email, secret: args.currentPassword },
    });
    if (retrieved === null) throw new Error('Mot de passe actuel incorrect');

    if (args.newPassword.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: user.email, secret: args.newPassword },
    });
  },
});

export const deleteAccount = action({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Non authentifié');

    const user = await ctx.runQuery(internal.account.getUserEmail, { userId });
    if (!user?.email) throw new Error('Email introuvable');

    const retrieved = await retrieveAccount(ctx, {
      provider: 'password',
      account: { id: user.email, secret: args.password },
    });
    if (retrieved === null) throw new Error('Mot de passe incorrect');

    await ctx.runMutation(internal.account.eraseUser, { userId });
    await invalidateSessions(ctx, { userId });
  },
});
