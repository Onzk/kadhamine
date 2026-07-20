import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, createNotification, now } from './lib';
import { readCommissionRate } from './settings';

export const initiate = mutation({
  args: {
    orderId: v.id('orders'),
    method: v.union(
      v.literal('fedapay'),
      v.literal('airtel_money'),
      v.literal('moov_money'),
      v.literal('off_platform'),
    ),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.clientId !== userId) throw new Error('Commande introuvable');
    if (!['pending', 'accepted'].includes(order.status)) {
      throw new Error('Paiement impossible pour cette commande');
    }

    const isOffPlatform = args.method === 'off_platform';
    const amount = order.agreedPrice ?? 0;
    const commissionRate = await readCommissionRate(ctx);
    const commission = isOffPlatform ? 0 : Math.round(amount * commissionRate);
    const providerAmount = amount - commission;
    const timestamp = now();

    const existing = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();

    if (existing) throw new Error('Un paiement existe déjà pour cette commande');

    const paymentId = await ctx.db.insert('payments', {
      orderId: args.orderId,
      clientId: userId,
      providerId: order.providerId,
      amount,
      commission,
      providerAmount,
      currency: 'XAF',
      method: args.method,
      status: isOffPlatform ? 'released' : 'pending',
      phoneNumber: args.phoneNumber,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.patch(args.orderId, {
      paymentMethod: args.method,
      isOffPlatformPayment: isOffPlatform,
      canReview: false,
      updatedAt: timestamp,
    });

    if (!isOffPlatform) {
      await createNotification(ctx, {
        userId: order.providerId,
        type: 'payment',
        title: 'Paiement en cours',
        body: 'Un paiement est en cours de traitement pour une commande.',
        data: { orderId: args.orderId, paymentId },
      });
    }

    return paymentId;
  },
});

export const confirm = mutation({
  args: {
    paymentId: v.id('payments'),
    fedapayTransactionId: v.optional(v.string()),
    fedapayReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error('Paiement introuvable');

    const timestamp = now();
    await ctx.db.patch(args.paymentId, {
      status: 'held',
      fedapayTransactionId: args.fedapayTransactionId,
      fedapayReference: args.fedapayReference,
      heldAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.patch(payment.orderId, {
      canReview: true,
      updatedAt: timestamp,
    });

    await createNotification(ctx, {
      userId: payment.providerId,
      type: 'payment',
      title: 'Paiement reçu',
      body: 'Le paiement est conservé jusqu\'à validation de la prestation.',
      data: { paymentId: args.paymentId },
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    const asClient = await ctx.db
      .query('payments')
      .withIndex('by_client', (q) => q.eq('clientId', userId))
      .order('desc')
      .collect();
    const asProvider = await ctx.db
      .query('payments')
      .withIndex('by_provider', (q) => q.eq('providerId', userId))
      .order('desc')
      .collect();
    return { asClient, asProvider };
  },
});

export const getByOrder = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
  },
});
