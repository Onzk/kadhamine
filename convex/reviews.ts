import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, createNotification, now } from './lib';

export const listByProvider = query({
  args: {
    providerId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('reviews')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .filter((q) => q.eq(q.field('isVisible'), true))
      .order('desc')
      .take(args.limit ?? 20);
  },
});

export const getByOrder = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    if (order.clientId !== userId && order.providerId !== userId) {
      throw new Error('Non autorisé');
    }
    return await ctx.db
      .query('reviews')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
  },
});

export const create = mutation({
  args: {
    orderId: v.id('orders'),
    rating: v.number(),
    comment: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);

    if (!order || order.clientId !== userId) {
      throw new Error('Commande introuvable');
    }
    if (!order.canReview || order.isOffPlatformPayment) {
      throw new Error(
        'Seuls les paiements intégrés permettent de laisser un avis officiel.',
      );
    }
    if (order.status !== 'completed') {
      throw new Error('La prestation doit être validée');
    }

    const existing = await ctx.db
      .query('reviews')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
    if (existing) throw new Error('Avis déjà laissé pour cette commande');

    if (args.rating < 1 || args.rating > 5) {
      throw new Error('La note doit être entre 1 et 5');
    }

    const timestamp = now();
    const reviewId = await ctx.db.insert('reviews', {
      orderId: args.orderId,
      clientId: userId,
      providerId: order.providerId,
      serviceId: order.serviceId,
      rating: args.rating,
      comment: args.comment,
      photos: args.photos,
      isOfficial: true,
      isModerated: false,
      isVisible: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', order.providerId))
      .first();

    if (profile) {
      const newCount = profile.reviewCount + 1;
      const newAvg =
        (profile.averageRating * profile.reviewCount + args.rating) / newCount;
      await ctx.db.patch(profile._id, {
        reviewCount: newCount,
        averageRating: Math.round(newAvg * 10) / 10,
        updatedAt: timestamp,
      });
    }

    const service = await ctx.db.get(order.serviceId);
    if (service) {
      const newCount = service.reviewCount + 1;
      const newAvg =
        (service.averageRating * service.reviewCount + args.rating) / newCount;
      await ctx.db.patch(order.serviceId, {
        reviewCount: newCount,
        averageRating: Math.round(newAvg * 10) / 10,
        updatedAt: timestamp,
      });
    }

    await createNotification(ctx, {
      userId: order.providerId,
      type: 'review',
      title: 'Nouvel avis',
      body: `Vous avez reçu une note de ${args.rating}/5.`,
      data: { reviewId },
    });

    return reviewId;
  },
});

export const respond = mutation({
  args: {
    reviewId: v.id('reviews'),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.providerId !== userId) {
      throw new Error('Avis introuvable');
    }

    await ctx.db.patch(args.reviewId, {
      providerResponse: args.response,
      providerRespondedAt: now(),
      updatedAt: now(),
    });
  },
});
