import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import {
  internalAction,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { internal } from './_generated/api';

export const list = query({
  args: { unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    let notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(50);

    if (args.unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }

    return notifications;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) return;
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('isRead', false),
      )
      .collect();

    for (const n of notifications) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('isRead', false),
      )
      .collect();
    return unread.length;
  },
});

export const getUserPushToken = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.pushToken ?? null;
  },
});

/** Envoie une notification push Expo si un token est enregistré. */
export const sendPush = internalAction({
  args: {
    userId: v.id('users'),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ sent: boolean; reason?: string; status?: number }> => {
    const pushToken: string | null = await ctx.runQuery(
      internal.notifications.getUserPushToken,
      { userId: args.userId },
    );

    if (!pushToken) {
      return { sent: false, reason: 'no_token' };
    }

    try {
      const response: Response = await fetch(
        'https://exp.host/--/api/v2/push/send',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: pushToken,
            sound: 'default',
            title: args.title,
            body: args.body,
            data: args.data ?? {},
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        console.error('Expo push failed:', response.status, text);
        return { sent: false, reason: 'expo_error', status: response.status };
      }

      return { sent: true };
    } catch (err) {
      console.error('Expo push exception:', err);
      return { sent: false, reason: 'exception' };
    }
  },
});
