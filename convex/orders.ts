import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  requireAuth,
  createNotification,
  PLATFORM_COMMISSION_RATE,
  now,
} from './lib';

export const listMine = query({
  args: {
    role: v.union(v.literal('client'), v.literal('provider')),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('accepted'),
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('cancelled'),
        v.literal('rejected'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);

    let orders;
    if (args.role === 'client') {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_client', (q) => q.eq('clientId', userId))
        .order('desc')
        .collect();
    } else {
      orders = await ctx.db
        .query('orders')
        .withIndex('by_provider', (q) => q.eq('providerId', userId))
        .order('desc')
        .collect();
    }

    if (args.status) {
      orders = orders.filter((o) => o.status === args.status);
    }

    return await Promise.all(
      orders.map(async (order) => {
        const service = await ctx.db.get(order.serviceId);
        const payment = await ctx.db
          .query('payments')
          .withIndex('by_order', (q) => q.eq('orderId', order._id))
          .first();
        return { order, service, payment };
      }),
    );
  },
});

export const create = mutation({
  args: {
    serviceId: v.id('services'),
    description: v.optional(v.string()),
    agreedPrice: v.optional(v.number()),
    deliveryDate: v.optional(v.string()),
    paymentMethod: v.optional(
      v.union(
        v.literal('fedapay'),
        v.literal('airtel_money'),
        v.literal('moov_money'),
        v.literal('off_platform'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (!service || !service.isActive) {
      throw new Error('Service introuvable');
    }

    const isOffPlatform = args.paymentMethod === 'off_platform';
    const timestamp = now();

    const orderId = await ctx.db.insert('orders', {
      clientId: userId,
      providerId: service.providerId,
      serviceId: args.serviceId,
      status: 'pending',
      title: service.title,
      description: args.description,
      agreedPrice: args.agreedPrice ?? service.price,
      currency: 'XAF',
      deliveryDate: args.deliveryDate,
      paymentMethod: args.paymentMethod,
      isOffPlatformPayment: isOffPlatform,
      canReview: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await createNotification(ctx, {
      userId: service.providerId,
      type: 'order',
      title: 'Nouvelle commande',
      body: `Vous avez reçu une nouvelle commande : ${service.title}`,
      data: { orderId },
    });

    return orderId;
  },
});

export const respond = mutation({
  args: {
    orderId: v.id('orders'),
    accept: v.boolean(),
    providerNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.providerId !== userId) {
      throw new Error('Commande introuvable');
    }
    if (order.status !== 'pending') {
      throw new Error('Cette commande ne peut plus être modifiée');
    }

    const timestamp = now();
    await ctx.db.patch(args.orderId, {
      status: args.accept ? 'accepted' : 'rejected',
      providerNotes: args.providerNotes,
      acceptedAt: args.accept ? timestamp : undefined,
      updatedAt: timestamp,
    });

    await createNotification(ctx, {
      userId: order.clientId,
      type: args.accept ? 'validation' : 'rejection',
      title: args.accept ? 'Commande acceptée' : 'Commande refusée',
      body: args.accept
        ? 'Votre commande a été acceptée par le prestataire.'
        : 'Votre commande a été refusée par le prestataire.',
      data: { orderId: args.orderId },
    });
  },
});

export const startProgress = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.providerId !== userId) throw new Error('Commande introuvable');
    if (order.status !== 'accepted') throw new Error('Statut invalide');

    await ctx.db.patch(args.orderId, {
      status: 'in_progress',
      updatedAt: now(),
    });
  },
});

export const complete = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.providerId !== userId) throw new Error('Commande introuvable');
    if (order.status !== 'in_progress') throw new Error('Statut invalide');

    await ctx.db.patch(args.orderId, {
      status: 'completed',
      completedAt: now(),
      updatedAt: now(),
    });

    await createNotification(ctx, {
      userId: order.clientId,
      type: 'order',
      title: 'Prestation terminée',
      body: 'Le prestataire a marqué la prestation comme terminée. Validez pour finaliser.',
      data: { orderId: args.orderId },
    });
  },
});

export const validate = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.clientId !== userId) throw new Error('Commande introuvable');
    if (order.status !== 'completed') throw new Error('La prestation doit être terminée');

    const canReview = !order.isOffPlatformPayment;
    await ctx.db.patch(args.orderId, {
      canReview,
      updatedAt: now(),
    });

    const payment = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();

    if (payment && payment.status === 'held') {
      await ctx.db.patch(payment._id, {
        status: 'released',
        releasedAt: now(),
        updatedAt: now(),
      });

      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', order.providerId))
        .first();

      if (profile) {
        await ctx.db.patch(profile._id, {
          completedOrders: profile.completedOrders + 1,
          updatedAt: now(),
        });
      }

      await createNotification(ctx, {
        userId: order.providerId,
        type: 'payment',
        title: 'Paiement libéré',
        body: 'Le paiement de votre prestation a été libéré.',
        data: { orderId: args.orderId, paymentId: payment._id },
      });
    }

    if (canReview) {
      await createNotification(ctx, {
        userId: order.clientId,
        type: 'review',
        title: 'Laissez un avis',
        body: 'Votre paiement intégré vous permet de noter ce prestataire.',
        data: { orderId: args.orderId },
      });
    }
  },
});

export const cancel = mutation({
  args: {
    orderId: v.id('orders'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error('Commande introuvable');
    if (order.clientId !== userId && order.providerId !== userId) {
      throw new Error('Non autorisé');
    }
    if (['completed', 'cancelled'].includes(order.status)) {
      throw new Error('Cette commande ne peut plus être annulée');
    }

    await ctx.db.patch(args.orderId, {
      status: 'cancelled',
      cancelledAt: now(),
      clientNotes: args.reason,
      updatedAt: now(),
    });

    if (order.providerId === userId) {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .first();
      if (profile) {
        await ctx.db.patch(profile._id, {
          cancelledOrders: profile.cancelledOrders + 1,
          updatedAt: now(),
        });
      }
    }
  },
});
