import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth, createNotification, now } from './lib';
import { internal } from './_generated/api';

const orderStatusValidator = v.union(
  v.literal('pending'),
  v.literal('accepted'),
  v.literal('completed'),
  v.literal('cancelled'),
);

export const listMine = query({
  args: {
    role: v.union(v.literal('client'), v.literal('provider')),
    status: v.optional(orderStatusValidator),
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
        const review = await ctx.db
          .query('reviews')
          .withIndex('by_order', (q) => q.eq('orderId', order._id))
          .first();

        const counterpartyId = args.role === 'client' ? order.providerId : order.clientId;
        const counterpartyUser = await ctx.db.get(counterpartyId);
        const counterpartyProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', counterpartyId))
          .first();
        const counterpartyName = counterpartyProfile
          ? `${counterpartyProfile.firstName} ${counterpartyProfile.lastName}`.trim()
          : counterpartyUser?.name ?? null;

        return {
          order,
          service,
          payment,
          hasReview: Boolean(review && review.isValid !== false),
          counterpartyName,
          counterpartyAvatar: counterpartyProfile?.avatarUrl ?? null,
        };
      }),
    );
  },
});

/** Orders for a service — provider owner only. */
export const listByService = query({
  args: { serviceId: v.id('services') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (!service || service.providerId !== userId) {
      return null;
    }

    const orders = await ctx.db
      .query('orders')
      .withIndex('by_service', (q) => q.eq('serviceId', args.serviceId))
      .order('desc')
      .collect();

    return await Promise.all(
      orders.map(async (order) => {
        const clientUser = await ctx.db.get(order.clientId);
        const clientProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', order.clientId))
          .first();
        const payment = await ctx.db
          .query('payments')
          .withIndex('by_order', (q) => q.eq('orderId', order._id))
          .first();
        return { order, clientUser, clientProfile, payment };
      }),
    );
  },
});

/** Full order detail for client or provider — resolves media URLs. */
export const getById = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    if (order.clientId !== userId && order.providerId !== userId) {
      throw new Error('Non autorisé');
    }

    const viewerRole: 'client' | 'provider' =
      order.clientId === userId ? 'client' : 'provider';

    const service = await ctx.db.get(order.serviceId);
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', order._id))
      .first();
    const review = await ctx.db
      .query('reviews')
      .withIndex('by_order', (q) => q.eq('orderId', order._id))
      .first();
    const hasValidReview = Boolean(review && review.isValid !== false);

    const counterpartyId = viewerRole === 'client' ? order.providerId : order.clientId;
    const counterpartyUser = await ctx.db.get(counterpartyId);
    const counterpartyProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', counterpartyId))
      .first();
    const counterpartyName = counterpartyProfile
      ? `${counterpartyProfile.firstName} ${counterpartyProfile.lastName}`.trim()
      : counterpartyUser?.name ?? null;

    const photoUrls = order.photoStorageIds?.length
      ? (
          await Promise.all(order.photoStorageIds.map((id) => ctx.storage.getUrl(id)))
        ).filter((u): u is string => !!u)
      : [];

    const voiceUrl = order.voiceStorageId
      ? await ctx.storage.getUrl(order.voiceStorageId)
      : null;

    const OFF_PLATFORM_REFUSE_MS = 24 * 60 * 60 * 1000;
    const recordedAt = payment?.recordedAt ?? payment?.createdAt;
    const canRefuseOffPlatform =
      viewerRole === 'provider' &&
      payment != null &&
      (payment.method === 'off_platform' || order.isOffPlatformPayment === true) &&
      payment.status === 'pending' &&
      payment.releasedAt == null &&
      recordedAt != null &&
      Date.now() - recordedAt < OFF_PLATFORM_REFUSE_MS;

    return {
      order,
      service,
      payment,
      hasReview: hasValidReview,
      review: viewerRole === 'client' || hasValidReview ? review : null,
      viewerRole,
      canRefuseOffPlatform,
      counterpartyName,
      counterpartyAvatar: counterpartyProfile?.avatarUrl ?? null,
      photoUrls,
      voiceUrl,
    };
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
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    addressLabel: v.optional(v.string()),
    photoStorageIds: v.optional(v.array(v.id('_storage'))),
    voiceStorageId: v.optional(v.id('_storage')),
    voiceDurationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (!service || !service.isActive) {
      throw new Error('Service introuvable');
    }
    if (service.providerId === userId) {
      throw new Error('Vous ne pouvez pas commander votre propre service');
    }

    const photoStorageIds = args.photoStorageIds?.slice(0, 4);
    if (photoStorageIds && photoStorageIds.length > 4) {
      throw new Error('Maximum 4 photos');
    }

    const isOffPlatform = args.paymentMethod === 'off_platform';
    const timestamp = now();

    const orderId = await ctx.db.insert('orders', {
      clientId: userId,
      providerId: service.providerId,
      serviceId: args.serviceId,
      status: 'pending',
      title: service.title,
      description: args.description?.trim() || undefined,
      latitude: args.latitude,
      longitude: args.longitude,
      city: args.city,
      region: args.region,
      addressLabel: args.addressLabel,
      photoStorageIds: photoStorageIds?.length ? photoStorageIds : undefined,
      voiceStorageId: args.voiceStorageId,
      voiceDurationMs: args.voiceDurationMs,
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

    await ctx.scheduler.runAfter(0, internal.notifications.sendPush, {
      userId: service.providerId,
      title: 'Nouvelle commande',
      body: `Vous avez reçu une nouvelle commande : ${service.title}`,
      data: { orderId, type: 'order' },
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
      status: args.accept ? 'accepted' : 'cancelled',
      providerNotes: args.providerNotes,
      acceptedAt: args.accept ? timestamp : undefined,
      cancelledAt: args.accept ? undefined : timestamp,
      updatedAt: timestamp,
    });

    const title = args.accept ? 'Commande acceptée' : 'Commande annulée';
    const body = args.accept
      ? 'Votre commande a été acceptée par le prestataire.'
      : 'Votre commande a été refusée par le prestataire.';

    await createNotification(ctx, {
      userId: order.clientId,
      type: args.accept ? 'validation' : 'rejection',
      title,
      body,
      data: { orderId: args.orderId },
    });

    await ctx.scheduler.runAfter(0, internal.notifications.sendPush, {
      userId: order.clientId,
      title,
      body,
      data: { orderId: args.orderId, type: 'order' },
    });
  },
});

export const complete = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.providerId !== userId) throw new Error('Commande introuvable');
    if (order.status !== 'accepted') throw new Error('Statut invalide');

    await ctx.db.patch(args.orderId, {
      status: 'completed',
      completedAt: now(),
      updatedAt: now(),
    });

    await createNotification(ctx, {
      userId: order.clientId,
      type: 'order',
      title: 'Prestation terminée',
      body: 'Le prestataire a marqué la prestation comme terminée. Vous pouvez maintenant procéder au paiement.',
      data: { orderId: args.orderId },
    });

    await ctx.scheduler.runAfter(0, internal.notifications.sendPush, {
      userId: order.clientId,
      title: 'Prestation terminée',
      body: 'Vous pouvez maintenant procéder au paiement.',
      data: { orderId: args.orderId, type: 'order' },
    });
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

    const timestamp = now();
    /** Conserve `acceptedAt` s’il existe → ouvre la notation client pour le prestataire. */
    await ctx.db.patch(args.orderId, {
      status: 'cancelled',
      cancelledAt: timestamp,
      clientNotes: args.reason,
      updatedAt: timestamp,
    });

    const wasAccepted = order.acceptedAt != null || order.status === 'accepted';

    if (order.providerId === userId) {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .first();
      if (profile) {
        await ctx.db.patch(profile._id, {
          cancelledOrders: profile.cancelledOrders + 1,
          updatedAt: timestamp,
        });
      }
    }

    if (wasAccepted && order.providerId === userId) {
      await createNotification(ctx, {
        userId: order.providerId,
        type: 'review',
        title: 'Noter le client',
        body: 'La commande acceptée a été annulée. Vous pouvez laisser une note sur ce client.',
        data: { orderId: args.orderId },
      });
    } else if (wasAccepted && order.clientId === userId) {
      await createNotification(ctx, {
        userId: order.providerId,
        type: 'review',
        title: 'Commande annulée',
        body: 'Le client a annulé une commande acceptée. Vous pouvez laisser une note sur ce client.',
        data: { orderId: args.orderId },
      });
    }
  },
});

/** Pending orders awaiting provider action — providers only. */
export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    const { userId, user } = await requireAuth(ctx);
    if (user.role !== 'provider') return 0;

    const pending = await ctx.db
      .query('orders')
      .withIndex('by_provider_status', (q) =>
        q.eq('providerId', userId).eq('status', 'pending'),
      )
      .collect();
    return pending.length;
  },
});
