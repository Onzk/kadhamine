import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, createNotification, now } from './lib';
import { internal } from './_generated/api';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);

    const conversations = await ctx.db
      .query('conversations')
      .order('desc')
      .collect();

    return conversations.filter((c) => c.participantIds.includes(userId));
  },
});

export const getMessages = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new Error('Conversation introuvable');
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation_time', (q) =>
        q.eq('conversationId', args.conversationId),
      )
      .order('asc')
      .collect();

    return await Promise.all(
      messages.map(async (msg) => {
        let mediaUrl = msg.mediaUrl;
        if (!mediaUrl && msg.storageId) {
          mediaUrl = (await ctx.storage.getUrl(msg.storageId)) ?? undefined;
        }
        return { ...msg, mediaUrl };
      }),
    );
  },
});

export const getOrCreate = mutation({
  args: {
    participantId: v.id('users'),
    orderId: v.optional(v.id('orders')),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);

    const conversations = await ctx.db.query('conversations').collect();
    const existing = conversations.find(
      (c) =>
        c.participantIds.includes(userId) &&
        c.participantIds.includes(args.participantId) &&
        c.participantIds.length === 2,
    );

    if (existing) return existing._id;

    const timestamp = now();
    return await ctx.db.insert('conversations', {
      participantIds: [userId, args.participantId],
      orderId: args.orderId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const send = mutation({
  args: {
    conversationId: v.id('conversations'),
    content: v.string(),
    type: v.optional(
      v.union(v.literal('text'), v.literal('image'), v.literal('document')),
    ),
    mediaUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new Error('Conversation introuvable');
    }

    const messageType = args.type ?? 'text';
    let mediaUrl = args.mediaUrl;
    if (args.storageId && !mediaUrl) {
      mediaUrl = (await ctx.storage.getUrl(args.storageId)) ?? undefined;
    }

    if (messageType === 'image' && !args.storageId && !mediaUrl) {
      throw new Error('Image requise');
    }

    const timestamp = now();
    const preview =
      messageType === 'image' ? '[Image]' : args.content.slice(0, 100);

    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderId: userId,
      type: messageType,
      content: args.content || (messageType === 'image' ? 'Image' : ''),
      mediaUrl,
      storageId: args.storageId,
      readBy: [userId],
      createdAt: timestamp,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: timestamp,
      lastMessagePreview: preview,
      updatedAt: timestamp,
    });

    const recipients = conversation.participantIds.filter((id) => id !== userId);
    for (const recipientId of recipients) {
      await createNotification(ctx, {
        userId: recipientId,
        type: 'message',
        title: 'Nouveau message',
        body: preview,
        data: { conversationId: args.conversationId, messageId },
      });

      await ctx.scheduler.runAfter(0, internal.notifications.sendPush, {
        userId: recipientId,
        title: 'Nouveau message',
        body: preview,
        data: {
          conversationId: args.conversationId,
          type: 'message',
        },
      });
    }

    return messageId;
  },
});

export const markRead = mutation({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) =>
        q.eq('conversationId', args.conversationId),
      )
      .collect();

    for (const msg of messages) {
      if (!msg.readBy.includes(userId)) {
        await ctx.db.patch(msg._id, {
          readBy: [...msg.readBy, userId],
        });
      }
    }
  },
});
