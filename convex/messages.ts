import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { requireAuth, createNotification, now } from './lib';
import { internal } from './_generated/api';

const messageTypeValidator = v.union(
  v.literal('text'),
  v.literal('image'),
  v.literal('audio'),
  v.literal('document'),
);

/** Consider online if heartbeat within this window. */
export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

async function resolvePeer(
  ctx: QueryCtx,
  userId: Id<'users'>,
  participantIds: Id<'users'>[],
) {
  const peerId = participantIds.find((id) => id !== userId) ?? participantIds[0];
  const peerUser = await ctx.db.get(peerId);
  const peerProfile = await ctx.db
    .query('profiles')
    .withIndex('by_user', (q) => q.eq('userId', peerId))
    .first();

  let avatarUrl = peerProfile?.avatarUrl ?? peerUser?.image ?? undefined;
  if (!avatarUrl && peerProfile?.avatarStorageId) {
    avatarUrl = (await ctx.storage.getUrl(peerProfile.avatarStorageId)) ?? undefined;
  }

  const name = peerProfile
    ? `${peerProfile.firstName} ${peerProfile.lastName}`.trim()
    : (peerUser?.name ?? null);

  const lastActiveAt = peerUser?.lastActiveAt ?? null;
  const isOnline =
    lastActiveAt != null && now() - lastActiveAt < ONLINE_WINDOW_MS;

  return {
    _id: peerId,
    name,
    avatarUrl,
    lastActiveAt,
    isOnline,
  };
}

async function unreadCountFor(
  ctx: QueryCtx,
  conversationId: Id<'conversations'>,
  userId: Id<'users'>,
) {
  const messages = await ctx.db
    .query('messages')
    .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
    .collect();

  return messages.filter(
    (m) => m.senderId !== userId && !m.readBy.includes(userId),
  ).length;
}

async function conversationHasUnread(
  ctx: QueryCtx,
  conversationId: Id<'conversations'>,
  userId: Id<'users'>,
) {
  const messages = await ctx.db
    .query('messages')
    .withIndex('by_conversation', (q) => q.eq('conversationId', conversationId))
    .collect();

  return messages.some(
    (m) => m.senderId !== userId && !m.readBy.includes(userId),
  );
}

function sortConversations(conversations: Doc<'conversations'>[]) {
  return [...conversations].sort(
    (a, b) =>
      (b.lastMessageAt ?? b.updatedAt) - (a.lastMessageAt ?? a.updatedAt),
  );
}

function previewForMessage(
  type: 'text' | 'image' | 'audio' | 'document',
  content: string,
) {
  if (type === 'image') return '[Image]';
  if (type === 'audio') return '[Audio]';
  if (type === 'document') return '[Document]';
  return content.slice(0, 100);
}

async function resolveMediaUrl(
  ctx: QueryCtx,
  msg: Pick<Doc<'messages'>, 'mediaUrl' | 'storageId'>,
) {
  if (msg.mediaUrl) return msg.mediaUrl;
  if (msg.storageId) {
    return (await ctx.storage.getUrl(msg.storageId)) ?? undefined;
  }
  return undefined;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);

    const conversations = await ctx.db
      .query('conversations')
      .order('desc')
      .collect();

    const mine = sortConversations(
      conversations.filter((c) => c.participantIds.includes(userId)),
    );

    return await Promise.all(
      mine.map(async (conv) => {
        const peer = await resolvePeer(ctx, userId, conv.participantIds);
        const unreadCount = await unreadCountFor(ctx, conv._id, userId);
        return { ...conv, peer, unreadCount };
      }),
    );
  },
});

export const getConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      return null;
    }

    const peer = await resolvePeer(ctx, userId, conversation.participantIds);
    return { ...conversation, peer };
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
        const mediaUrl = await resolveMediaUrl(ctx, msg);

        let replyTo:
          | {
              _id: Id<'messages'>;
              type: Doc<'messages'>['type'];
              content: string;
              mediaUrl?: string;
              durationMs?: number;
            }
          | null = null;

        if (msg.replyToId) {
          const parent = await ctx.db.get(msg.replyToId);
          if (parent) {
            replyTo = {
              _id: parent._id,
              type: parent.type,
              content: parent.content,
              mediaUrl: await resolveMediaUrl(ctx, parent),
              durationMs: parent.durationMs,
            };
          }
        }

        return { ...msg, mediaUrl, replyTo };
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
    type: v.optional(messageTypeValidator),
    mediaUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    durationMs: v.optional(v.number()),
    replyToId: v.optional(v.id('messages')),
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
    if (messageType === 'audio' && !args.storageId && !mediaUrl) {
      throw new Error('Audio requis');
    }

    if (args.replyToId) {
      const parent = await ctx.db.get(args.replyToId);
      if (!parent || parent.conversationId !== args.conversationId) {
        throw new Error('Message parent introuvable');
      }
    }

    const timestamp = now();
    const defaultContent =
      messageType === 'image'
        ? 'Image'
        : messageType === 'audio'
          ? 'Audio'
          : messageType === 'document'
            ? 'Document'
            : '';
    const content = args.content || defaultContent;
    const preview = previewForMessage(messageType, content);

    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderId: userId,
      type: messageType,
      content,
      mediaUrl,
      storageId: args.storageId,
      durationMs: messageType === 'audio' ? args.durationMs : undefined,
      replyToId: args.replyToId,
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
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participantIds.includes(userId)) {
      throw new Error('Conversation introuvable');
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) =>
        q.eq('conversationId', args.conversationId),
      )
      .collect();

    for (const msg of messages) {
      // Mark incoming messages as read by the current user (drives peer read receipts)
      if (msg.senderId !== userId && !msg.readBy.includes(userId)) {
        await ctx.db.patch(msg._id, {
          readBy: [...msg.readBy, userId],
        });
      }
    }
  },
});

/** Number of conversations where the current user has at least one unread message. */
export const unreadConversationCount = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);

    const conversations = await ctx.db.query('conversations').collect();
    const mine = conversations.filter((c) => c.participantIds.includes(userId));

    let count = 0;
    for (const conv of mine) {
      if (await conversationHasUnread(ctx, conv._id, userId)) {
        count += 1;
      }
    }
    return count;
  },
});
