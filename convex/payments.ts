import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, createNotification, now } from './lib';
import { readCommissionRate } from './settings';
import { validateReviewForOrder } from './reviews';

/** Prestataire peut refuser un paiement hors plateforme dans les 24 h
 *  suivant la date du dernier paiement enregistré pour la commande. */
const OFF_PLATFORM_REFUSE_WINDOW_MS = 24 * 60 * 60 * 1000;

function lastPaymentRecordedAt(payment: {
  recordedAt?: number;
  createdAt: number;
  updatedAt: number;
}) {
  return payment.recordedAt ?? payment.createdAt;
}

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
    if (order.status === 'cancelled') {
      throw new Error(
        'Cette commande a été annulée ou refusée — le paiement est impossible',
      );
    }
    if (order.status !== 'completed') {
      throw new Error('Paiement possible uniquement après la fin de la prestation');
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

    if (existing) {
      if (existing.status === 'pending' || existing.status === 'failed') {
        await ctx.db.patch(existing._id, {
          method: args.method,
          phoneNumber: args.phoneNumber,
          /** Off-platform stays pending until client validate or provider refuse. */
          status: 'pending',
          commission,
          providerAmount,
          amount,
          recordedAt: timestamp,
          updatedAt: timestamp,
        });
        await ctx.db.patch(args.orderId, {
          paymentMethod: args.method,
          isOffPlatformPayment: isOffPlatform,
          canReview: false,
          updatedAt: timestamp,
        });

        if (isOffPlatform) {
          await createNotification(ctx, {
            userId: order.providerId,
            type: 'payment',
            title: 'Paiement hors plateforme',
            body: 'Le client a enregistré un paiement hors plateforme. Vous pouvez le refuser sous 24 h.',
            data: { orderId: args.orderId, paymentId: existing._id },
          });
        } else {
          await createNotification(ctx, {
            userId: order.providerId,
            type: 'payment',
            title: 'Paiement en cours',
            body: 'Un paiement est en cours de traitement pour une commande.',
            data: { orderId: args.orderId, paymentId: existing._id },
          });
        }

        return existing._id;
      }
      throw new Error('Un paiement existe déjà pour cette commande');
    }

    const paymentId = await ctx.db.insert('payments', {
      orderId: args.orderId,
      clientId: userId,
      providerId: order.providerId,
      amount,
      commission,
      providerAmount,
      currency: 'XAF',
      method: args.method,
      /** Off-platform: pending until validate/refuse. Integrated: held after FedaPay. */
      status: 'pending',
      phoneNumber: args.phoneNumber,
      recordedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.patch(args.orderId, {
      paymentMethod: args.method,
      isOffPlatformPayment: isOffPlatform,
      canReview: false,
      updatedAt: timestamp,
    });

    if (isOffPlatform) {
      await createNotification(ctx, {
        userId: order.providerId,
        type: 'payment',
        title: 'Paiement hors plateforme',
        body: 'Le client a enregistré un paiement hors plateforme. Vous pouvez le refuser sous 24 h.',
        data: { orderId: args.orderId, paymentId },
      });
    } else {
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

/** Prestataire refuse un paiement hors plateforme (24 h depuis le dernier enregistrement). */
export const refuseOffPlatform = mutation({
  args: { paymentId: v.id('payments') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error('Paiement introuvable');
    if (payment.providerId !== userId) throw new Error('Non autorisé');
    if (payment.method !== 'off_platform') {
      throw new Error('Seuls les paiements hors plateforme peuvent être refusés');
    }
    if (payment.status !== 'pending') {
      throw new Error('Ce paiement ne peut plus être refusé');
    }
    if (payment.releasedAt != null) {
      throw new Error('Ce paiement a déjà été libéré');
    }

    const timestamp = now();
    const recordedAt = lastPaymentRecordedAt(payment);
    if (timestamp - recordedAt > OFF_PLATFORM_REFUSE_WINDOW_MS) {
      throw new Error('Délai de refus dépassé (24 h depuis le dernier paiement enregistré)');
    }

    await ctx.db.patch(args.paymentId, {
      status: 'failed',
      updatedAt: timestamp,
    });

    await ctx.db.patch(payment.orderId, {
      paymentMethod: undefined,
      isOffPlatformPayment: false,
      canReview: false,
      updatedAt: timestamp,
    });

    await createNotification(ctx, {
      userId: payment.clientId,
      type: 'payment',
      title: 'Paiement hors plateforme refusé',
      body: 'Le prestataire a refusé votre paiement hors plateforme. Vous pouvez choisir un autre mode de paiement.',
      data: { orderId: payment.orderId, paymentId: args.paymentId },
    });

    return args.paymentId;
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

    const order = await ctx.db.get(payment.orderId);
    if (!order) throw new Error('Commande introuvable');
    if (order.status === 'cancelled') {
      throw new Error(
        'Cette commande a été annulée ou refusée — le paiement est impossible',
      );
    }
    if (order.status !== 'completed') {
      throw new Error('Paiement impossible tant que la commande n\'est pas terminée');
    }

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

    await validateReviewForOrder(ctx, payment.orderId, args.paymentId);

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
