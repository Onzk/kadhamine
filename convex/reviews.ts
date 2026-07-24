import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { requireAuth, createNotification, now } from './lib';

function reviewIsValid(isValid: boolean | undefined) {
  return isValid !== false;
}

async function applyProviderServiceAverages(
  ctx: MutationCtx,
  args: {
    providerId: Id<'users'>;
    serviceId: Id<'services'>;
    rating: number;
  },
) {
  const timestamp = now();
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_user', (q) => q.eq('userId', args.providerId))
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

  const service = await ctx.db.get(args.serviceId);
  if (service) {
    const newCount = service.reviewCount + 1;
    const newAvg =
      (service.averageRating * service.reviewCount + args.rating) / newCount;
    await ctx.db.patch(args.serviceId, {
      reviewCount: newCount,
      averageRating: Math.round(newAvg * 10) / 10,
      updatedAt: timestamp,
    });
  }
}

/** Active l’avis lié à une commande si le paiement a abouti. */
export async function validateReviewForOrder(
  ctx: MutationCtx,
  orderId: Id<'orders'>,
  paymentId?: Id<'payments'>,
) {
  const review = await ctx.db
    .query('reviews')
    .withIndex('by_order', (q) => q.eq('orderId', orderId))
    .first();
  if (!review || reviewIsValid(review.isValid)) return review?._id ?? null;

  const timestamp = now();
  await ctx.db.patch(review._id, {
    isValid: true,
    isVisible: true,
    isOfficial: true,
    paymentId: paymentId ?? review.paymentId,
    updatedAt: timestamp,
  });

  await applyProviderServiceAverages(ctx, {
    providerId: review.providerId,
    serviceId: review.serviceId,
    rating: review.rating,
  });

  await createNotification(ctx, {
    userId: review.providerId,
    type: 'review',
    title: 'Nouvel avis',
    body: `Vous avez reçu une note de ${review.rating}/5.`,
    data: { reviewId: review._id, orderId },
  });

  return review._id;
}

export const validateForPayment = internalMutation({
  args: {
    orderId: v.id('orders'),
    paymentId: v.optional(v.id('payments')),
  },
  handler: async (ctx, args) => {
    return await validateReviewForOrder(ctx, args.orderId, args.paymentId);
  },
});

export const listByProvider = query({
  args: {
    providerId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('reviews')
      .withIndex('by_provider', (q) => q.eq('providerId', args.providerId))
      .order('desc')
      .take((args.limit ?? 20) * 3);
    return rows
      .filter((r) => r.isVisible && reviewIsValid(r.isValid))
      .slice(0, args.limit ?? 20);
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
    const review = await ctx.db
      .query('reviews')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
    if (!review) return null;
    /** Prestataire : uniquement avis valides. Client : voit aussi le brouillon. */
    if (order.providerId === userId && !reviewIsValid(review.isValid)) {
      return null;
    }
    return review;
  },
});

/**
 * Enregistre (ou met à jour) l’avis au checkout — invalide jusqu’au succès paiement.
 * Obligatoire pour paiement in-app.
 */
export const upsertCheckoutDraft = mutation({
  args: {
    orderId: v.id('orders'),
    paymentId: v.optional(v.id('payments')),
    rating: v.number(),
    providerTagIds: v.array(v.string()),
    serviceTagIds: v.array(v.string()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);

    if (!order || order.clientId !== userId) {
      throw new Error('Commande introuvable');
    }
    if (order.isOffPlatformPayment) {
      throw new Error('Pas d’avis officiel pour un paiement hors plateforme');
    }
    if (order.status !== 'completed') {
      throw new Error('La prestation doit être terminée');
    }
    if (args.rating < 1 || args.rating > 5) {
      throw new Error('La note doit être entre 1 et 5');
    }
    if (args.providerTagIds.length < 1 && args.serviceTagIds.length < 1) {
      throw new Error('Sélectionnez au moins une option (prestataire ou service)');
    }

    const timestamp = now();
    const existing = await ctx.db
      .query('reviews')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();

    if (existing && reviewIsValid(existing.isValid)) {
      throw new Error('Avis déjà validé pour cette commande');
    }

    const payload = {
      rating: args.rating,
      providerTagIds: args.providerTagIds,
      serviceTagIds: args.serviceTagIds,
      comment: args.comment?.trim() || undefined,
      photos: undefined as string[] | undefined,
      isOfficial: true,
      isModerated: false,
      isVisible: false,
      isValid: false,
      paymentId: args.paymentId,
      updatedAt: timestamp,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert('reviews', {
      orderId: args.orderId,
      clientId: userId,
      providerId: order.providerId,
      serviceId: order.serviceId,
      ...payload,
      createdAt: timestamp,
    });
  },
});

/** @deprecated Prefer upsertCheckoutDraft — kept for legacy review screen. */
export const create = mutation({
  args: {
    orderId: v.id('orders'),
    rating: v.number(),
    comment: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    providerTagIds: v.optional(v.array(v.string())),
    serviceTagIds: v.optional(v.array(v.string())),
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
    if (existing && reviewIsValid(existing.isValid)) {
      throw new Error('Avis déjà laissé pour cette commande');
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error('La note doit être entre 1 et 5');
    }

    const payment = await ctx.db
      .query('payments')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
    const paymentOk =
      payment &&
      payment.method !== 'off_platform' &&
      (payment.status === 'held' || payment.status === 'released');
    if (!paymentOk) {
      throw new Error('Avis possible uniquement après un paiement abouti');
    }

    const timestamp = now();
    const fields = {
      rating: args.rating,
      providerTagIds: args.providerTagIds,
      serviceTagIds: args.serviceTagIds,
      comment: args.comment,
      photos: args.photos,
      isOfficial: true,
      isModerated: false,
      isVisible: true,
      isValid: true,
      paymentId: payment._id,
      updatedAt: timestamp,
    };

    let reviewId: Id<'reviews'>;
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      reviewId = existing._id;
      if (!reviewIsValid(existing.isValid)) {
        await applyProviderServiceAverages(ctx, {
          providerId: order.providerId,
          serviceId: order.serviceId,
          rating: args.rating,
        });
      }
    } else {
      reviewId = await ctx.db.insert('reviews', {
        orderId: args.orderId,
        clientId: userId,
        providerId: order.providerId,
        serviceId: order.serviceId,
        ...fields,
        createdAt: timestamp,
      });
      await applyProviderServiceAverages(ctx, {
        providerId: order.providerId,
        serviceId: order.serviceId,
        rating: args.rating,
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
    if (!reviewIsValid(review.isValid)) {
      throw new Error('Cet avis n’est pas encore valide');
    }

    await ctx.db.patch(args.reviewId, {
      providerResponse: args.response,
      providerRespondedAt: now(),
      updatedAt: now(),
    });
  },
});

/** Prestataire note un client :
 *  - commande **terminée** (`completed`), ou
 *  - commande **annulée** après acceptation (`acceptedAt`).
 *  Refus immédiat sans acceptation = pas d’avis. */
export const createClientReview = mutation({
  args: {
    orderId: v.id('orders'),
    rating: v.number(),
    tagIds: v.array(v.string()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.providerId !== userId) {
      throw new Error('Commande introuvable');
    }

    const completedOk = order.status === 'completed';
    const cancelledAfterAccept =
      order.status === 'cancelled' && order.acceptedAt != null;
    if (!completedOk && !cancelledAfterAccept) {
      throw new Error(
        'Notation client possible uniquement pour une commande terminée, ou annulée après acceptation',
      );
    }
    if (args.rating < 1 || args.rating > 5) {
      throw new Error('La note doit être entre 1 et 5');
    }
    if (args.tagIds.length < 1) {
      throw new Error('Sélectionnez au moins une option');
    }

    const existing = await ctx.db
      .query('clientReviews')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
    if (existing) throw new Error('Client déjà noté pour cette commande');

    const timestamp = now();
    const reviewId = await ctx.db.insert('clientReviews', {
      orderId: args.orderId,
      clientId: order.clientId,
      providerId: userId,
      serviceId: order.serviceId,
      rating: args.rating,
      tagIds: args.tagIds,
      comment: args.comment?.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', order.clientId))
      .first();
    if (profile) {
      const prevCount = profile.clientReviewCount ?? 0;
      const prevAvg = profile.clientAverageRating ?? 0;
      const newCount = prevCount + 1;
      const newAvg = (prevAvg * prevCount + args.rating) / newCount;
      await ctx.db.patch(profile._id, {
        clientReviewCount: newCount,
        clientAverageRating: Math.round(newAvg * 10) / 10,
        updatedAt: timestamp,
      });
    }

    await createNotification(ctx, {
      userId: order.clientId,
      type: 'review',
      title: 'Nouvelle note reçue',
      body: 'Un prestataire a laissé une note sur votre profil client.',
      data: { clientReviewId: reviewId, orderId: args.orderId },
    });

    return reviewId;
  },
});

export const getClientReviewByOrder = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    /** Note visible sur la commande par le client noté et le prestataire auteur. */
    if (order.clientId !== userId && order.providerId !== userId) return null;
    return await ctx.db
      .query('clientReviews')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
  },
});

/** Prestataire : a-t-il déjà noté / peut-il noter ? */
export const getClientReviewEligibility = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.providerId !== userId) {
      return { canRate: false, hasRated: false };
    }
    const existing = await ctx.db
      .query('clientReviews')
      .withIndex('by_order', (q) => q.eq('orderId', args.orderId))
      .first();
    const canRate =
      !existing &&
      (order.status === 'completed' ||
        (order.status === 'cancelled' && order.acceptedAt != null));
    return { canRate, hasRated: Boolean(existing) };
  },
});

/**
 * Infos client pour modal chat prestataire — note + commentaires anonymisés
 * par catégorie de service.
 */
export const getClientPublicRatingForProvider = query({
  args: { clientId: v.id('users') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const me = await ctx.db.get(userId);
    if (!me || me.role !== 'provider') {
      throw new Error('Réservé aux prestataires');
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', args.clientId))
      .first();
    const clientUser = await ctx.db.get(args.clientId);

    const reviews = await ctx.db
      .query('clientReviews')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .order('desc')
      .take(30);

    const anonymized = await Promise.all(
      reviews.map(async (r) => {
        const service = await ctx.db.get(r.serviceId);
        const category = service
          ? await ctx.db.get(service.categoryId)
          : null;
        return {
          _id: r._id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          category: category
            ? {
                slug: category.slug,
                nameFr: category.nameFr,
                nameAr: category.nameAr,
                nameSara: category.nameSara,
              }
            : null,
        };
      }),
    );

    return {
      clientId: args.clientId,
      name: profile
        ? `${profile.firstName} ${profile.lastName}`.trim()
        : clientUser?.name ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      city: profile?.city ?? null,
      region: profile?.region ?? null,
      clientAverageRating: profile?.clientAverageRating ?? 0,
      clientReviewCount: profile?.clientReviewCount ?? 0,
      reviews: anonymized,
    };
  },
});
