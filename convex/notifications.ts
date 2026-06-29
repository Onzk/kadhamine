import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, now } from './lib';

export const list = query({
  args: { unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
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
    const { userId } = await requireAuth(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) return;
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
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
    const { userId } = await requireAuth(ctx);
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('isRead', false),
      )
      .collect();
    return unread.length;
  },
});
