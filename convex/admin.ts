import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import {
  requireAdmin,
  createNotification,
  refreshProfileStats,
  now,
} from './lib';

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query('users').collect();
    const providers = users.filter((u) => u.role === 'provider');
    const clients = users.filter((u) => u.role === 'client');
    const pendingProviders = providers.filter((u) => u.status === 'pending');
    const suspended = users.filter((u) => u.status === 'suspended');

    const orders = await ctx.db.query('orders').collect();
    const payments = await ctx.db.query('payments').collect();
    const reports = await ctx.db
      .query('reports')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .collect();
    const verifications = await ctx.db
      .query('verificationRequests')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect();

    const totalRevenue = payments
      .filter((p) => p.status === 'released' || p.status === 'held')
      .reduce((sum, p) => sum + p.commission, 0);

    const totalVolume = payments
      .filter((p) => ['held', 'released'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);

    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const activeSubscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    return {
      totalUsers: users.length,
      totalProviders: providers.length,
      totalClients: clients.length,
      pendingProviders: pendingProviders.length,
      suspendedUsers: suspended.length,
      totalOrders: orders.length,
      completedOrders,
      openReports: reports.length,
      pendingVerifications: verifications.length,
      totalRevenue,
      totalVolume,
      activePremium: activeSubscriptions.length,
    };
  },
});

export const listUsers = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('active'),
        v.literal('suspended'),
        v.literal('rejected'),
      ),
    ),
    role: v.optional(
      v.union(v.literal('client'), v.literal('provider'), v.literal('admin')),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let users = await ctx.db.query('users').order('desc').collect();

    if (args.status) users = users.filter((u) => u.status === args.status);
    if (args.role) users = users.filter((u) => u.role === args.role);

    return await Promise.all(
      users.map(async (user) => {
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .first();
        return { user, profile };
      }),
    );
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id('users'),
    status: v.union(
      v.literal('pending'),
      v.literal('active'),
      v.literal('suspended'),
      v.literal('rejected'),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId: adminId } = await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('Utilisateur introuvable');

    await ctx.db.patch(args.userId, {
      status: args.status,
      updatedAt: now(),
    });

    const titles: Record<string, string> = {
      active: 'Compte validé',
      rejected: 'Compte refusé',
      suspended: 'Compte suspendu',
      pending: 'Compte en attente',
    };

    await createNotification(ctx, {
      userId: args.userId,
      type: args.status === 'active' ? 'validation' : 'rejection',
      title: titles[args.status],
      body: args.notes ?? `Votre compte est maintenant : ${args.status}`,
      data: { adminId, status: args.status },
    });
  },
});

export const listReports = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('open'),
        v.literal('in_review'),
        v.literal('resolved'),
        v.literal('dismissed'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let reports = await ctx.db.query('reports').order('desc').collect();
    if (args.status) reports = reports.filter((r) => r.status === args.status);

    return await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        return { report, reporter };
      }),
    );
  },
});

export const resolveReport = mutation({
  args: {
    reportId: v.id('reports'),
    status: v.union(v.literal('resolved'), v.literal('dismissed')),
    resolution: v.string(),
    suspendTarget: v.optional(v.boolean()),
    targetUserId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const { userId: adminId } = await requireAdmin(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error('Signalement introuvable');

    await ctx.db.patch(args.reportId, {
      status: args.status,
      resolution: args.resolution,
      resolvedBy: adminId,
      updatedAt: now(),
    });

    if (args.suspendTarget && args.targetUserId) {
      await ctx.db.patch(args.targetUserId, {
        status: 'suspended',
        updatedAt: now(),
      });
      await createNotification(ctx, {
        userId: args.targetUserId,
        type: 'system',
        title: 'Compte suspendu',
        body: args.resolution,
      });
    }
  },
});

export const listPayments = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('held'),
        v.literal('released'),
        v.literal('refunded'),
        v.literal('failed'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let payments = await ctx.db.query('payments').order('desc').take(args.limit ?? 50);
    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
    }

    return await Promise.all(
      payments.map(async (payment) => {
        const order = await ctx.db.get(payment.orderId);
        const client = await ctx.db.get(payment.clientId);
        const provider = await ctx.db.get(payment.providerId);
        return { payment, order, client, provider };
      }),
    );
  },
});

export const listOrders = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('accepted'),
        v.literal('completed'),
        v.literal('cancelled'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let orders = await ctx.db.query('orders').order('desc').take(args.limit ?? 50);
    if (args.status) {
      orders = orders.filter((o) => o.status === args.status);
    }

    return await Promise.all(
      orders.map(async (order) => {
        const client = await ctx.db.get(order.clientId);
        const provider = await ctx.db.get(order.providerId);
        const service = await ctx.db.get(order.serviceId);
        return { order, client, provider, service };
      }),
    );
  },
});

/** Feed dashboard : users pending (max 5) + paiements released (max 10). */
export const dashboardFeed = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const pendingUsersRaw = await ctx.db.query('users').order('desc').collect();
    const pendingSlice = pendingUsersRaw
      .filter((u) => u.status === 'pending')
      .slice(0, 5);
    const pendingUsers = await Promise.all(
      pendingSlice.map(async (user) => {
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .first();
        return { user, profile };
      }),
    );

    const releasedPayments = await ctx.db.query('payments').order('desc').take(40);
    const recentPayments = await Promise.all(
      releasedPayments
        .filter((p) => p.status === 'released')
        .slice(0, 10)
        .map(async (payment) => {
          const order = await ctx.db.get(payment.orderId);
          const client = await ctx.db.get(payment.clientId);
          const provider = await ctx.db.get(payment.providerId);
          return { payment, order, client, provider };
        }),
    );

    return { pendingUsers, recentPayments };
  },
});

export const moderateReview = mutation({
  args: {
    reviewId: v.id('reviews'),
    isVisible: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error('Avis introuvable');

    await ctx.db.patch(args.reviewId, {
      isVisible: args.isVisible,
      isModerated: true,
      updatedAt: now(),
    });

    if (!args.isVisible) {
      await createNotification(ctx, {
        userId: review.clientId,
        type: 'system',
        title: 'Avis modéré',
        body: args.reason ?? 'Votre avis a été masqué par la modération.',
      });
    }
  },
});

export const listPendingReviews = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reviews = await ctx.db.query('reviews').order('desc').take(50);
    return await Promise.all(
      reviews
        .filter((r) => !r.isModerated)
        .map(async (review) => {
          const client = await ctx.db.get(review.clientId);
          const provider = await ctx.db.get(review.providerId);
          return { review, client, provider };
        }),
    );
  },
});

export const listVerifications = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('approved'),
        v.literal('rejected'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const status = args.status ?? 'pending';
    const requests = await ctx.db
      .query('verificationRequests')
      .withIndex('by_status', (q) => q.eq('status', status))
      .collect();

    return await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        const profile = await ctx.db.get(req.profileId);
        const docUrl = await ctx.storage.getUrl(req.documentStorageId);
        const selfieUrl = await ctx.storage.getUrl(req.selfieStorageId);
        return { request: req, user, profile, docUrl, selfieUrl };
      }),
    );
  },
});

export const reviewVerification = mutation({
  args: {
    requestId: v.id('verificationRequests'),
    approved: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId: adminId } = await requireAdmin(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error('Demande introuvable');

    const timestamp = now();
    await ctx.db.patch(args.requestId, {
      status: args.approved ? 'approved' : 'rejected',
      reviewedBy: adminId,
      reviewNotes: args.notes,
      reviewedAt: timestamp,
      updatedAt: timestamp,
    });

    await ctx.db.patch(request.profileId, {
      isVerified: args.approved,
      updatedAt: timestamp,
    });

    await refreshProfileStats(ctx, request.profileId);

    await createNotification(ctx, {
      userId: request.userId,
      type: args.approved ? 'validation' : 'rejection',
      title: args.approved ? 'Identité vérifiée' : 'Vérification refusée',
      body: args.notes ?? (args.approved ? 'Votre badge Vérifié est actif.' : 'Veuillez soumettre à nouveau.'),
    });
  },
});

export const promoteToAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const users = await ctx.db.query('users').collect();
    const target = users.find((u) => u.email === args.email);
    if (!target) throw new Error('Email introuvable');
    await ctx.db.patch(target._id, { role: 'admin', status: 'active', updatedAt: now() });
    return { promoted: target._id, by: userId };
  },
});

export const setPremium = mutation({
  args: {
    userId: v.id('users'),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    if (!profile) throw new Error('Profil introuvable');

    const timestamp = now();
    await ctx.db.patch(profile._id, {
      isPremium: args.isPremium,
      badge: args.isPremium ? 'premium' : profile.isVerified ? 'verified' : undefined,
      updatedAt: timestamp,
    });

    if (args.isPremium) {
      const existing = await ctx.db
        .query('subscriptions')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .collect();
      const active = existing.find((s) => s.status === 'active' && s.endDate > timestamp);
      if (!active) {
        const endDate = timestamp + 30 * 24 * 60 * 60 * 1000;
        await ctx.db.insert('subscriptions', {
          userId: args.userId,
          profileId: profile._id,
          plan: 'premium',
          status: 'active',
          startDate: timestamp,
          endDate,
          amount: 0,
          currency: 'XAF',
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }

    await refreshProfileStats(ctx, profile._id);
    await createNotification(ctx, {
      userId: args.userId,
      type: 'subscription',
      title: args.isPremium ? 'Premium activé' : 'Premium retiré',
      body: args.isPremium
        ? 'Un administrateur a activé votre abonnement Premium.'
        : 'Votre badge Premium a été retiré.',
    });

    return { isPremium: args.isPremium };
  },
});

async function getProfileForUser(ctx: QueryCtx | MutationCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('profiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
}

export const updateUserSkills = mutation({
  args: {
    userId: v.id('users'),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await getProfileForUser(ctx, args.userId);
    if (!profile) throw new Error('Profil introuvable');
    const skills = args.skills.map((s) => s.trim()).filter(Boolean);
    await ctx.db.patch(profile._id, { skills, updatedAt: now() });
    return { skills };
  },
});

export const listUserServices = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const services = await ctx.db
      .query('services')
      .withIndex('by_provider', (q) => q.eq('providerId', args.userId))
      .collect();

    return await Promise.all(
      services
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map(async (service) => {
          const category = await ctx.db.get(service.categoryId);
          return { service, category };
        }),
    );
  },
});

export const upsertUserService = mutation({
  args: {
    userId: v.id('users'),
    serviceId: v.optional(v.id('services')),
    title: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    pricingType: v.optional(v.union(v.literal('fixed'), v.literal('negotiable'))),
    price: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    photoStorageIds: v.optional(v.array(v.id('_storage'))),
    photos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('Utilisateur introuvable');
    const profile = await getProfileForUser(ctx, args.userId);
    if (!profile) throw new Error('Profil introuvable');

    const timestamp = now();
    const pricingType = args.pricingType ?? 'fixed';

    const resolvePhotoPatch = async (
      existing?: { photoStorageIds?: Id<'_storage'>[]; photos?: string[] } | null,
    ) => {
      if (args.photoStorageIds !== undefined) {
        if (existing?.photoStorageIds?.length) {
          for (const oldId of existing.photoStorageIds) {
            if (!args.photoStorageIds.includes(oldId)) {
              await ctx.storage.delete(oldId);
            }
          }
        }
        let photos: string[] = [];
        if (args.photoStorageIds.length) {
          const urls = await Promise.all(
            args.photoStorageIds.map((id) => ctx.storage.getUrl(id)),
          );
          photos = urls.filter((u): u is string => !!u);
        }
        return { photoStorageIds: args.photoStorageIds, photos };
      }
      if (args.photos !== undefined) {
        return { photos: args.photos };
      }
      return null;
    };

    if (args.serviceId) {
      const service = await ctx.db.get(args.serviceId);
      if (!service || service.providerId !== args.userId) {
        throw new Error('Service introuvable');
      }

      const patch: Record<string, unknown> = {
        title: args.title.trim(),
        description: args.description.trim(),
        categoryId: args.categoryId,
        pricingType,
        price: args.price,
        updatedAt: timestamp,
      };
      if (args.isActive !== undefined) patch.isActive = args.isActive;

      const photoPatch = await resolvePhotoPatch(service);
      if (photoPatch) Object.assign(patch, photoPatch);

      await ctx.db.patch(args.serviceId, patch);
      return args.serviceId;
    }

    const photoPatch = await resolvePhotoPatch(null);

    return await ctx.db.insert('services', {
      providerId: args.userId,
      profileId: profile._id,
      title: args.title.trim(),
      description: args.description.trim(),
      categoryId: args.categoryId,
      pricingType,
      price: args.price,
      currency: 'XAF',
      photos: photoPatch?.photos ?? [],
      photoStorageIds: photoPatch?.photoStorageIds,
      availability: 'available',
      isActive: args.isActive ?? true,
      viewCount: 0,
      orderCount: 0,
      averageRating: 0,
      reviewCount: 0,
      city: profile.city,
      region: profile.region,
      latitude: profile.latitude,
      longitude: profile.longitude,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const deactivateUserService = mutation({
  args: { serviceId: v.id('services') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const service = await ctx.db.get(args.serviceId);
    if (!service) throw new Error('Service introuvable');
    await ctx.db.patch(args.serviceId, { isActive: false, updatedAt: now() });
  },
});

export const listUserPortfolio = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await getProfileForUser(ctx, args.userId);
    if (!profile) return [];

    const items = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect();

    return await Promise.all(
      items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(async (item) => {
          const mediaUrl = item.storageId
            ? await ctx.storage.getUrl(item.storageId)
            : item.mediaUrl;
          return { ...item, mediaUrl: mediaUrl ?? item.mediaUrl };
        }),
    );
  },
});

export const upsertUserPortfolioItem = mutation({
  args: {
    userId: v.id('users'),
    itemId: v.optional(v.id('portfolio')),
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await getProfileForUser(ctx, args.userId);
    if (!profile) throw new Error('Profil introuvable');
    const timestamp = now();

    if (args.itemId) {
      const item = await ctx.db.get(args.itemId);
      if (!item || item.providerId !== args.userId) {
        throw new Error('Élément introuvable');
      }
      const patch: Record<string, unknown> = {
        title: args.title.trim(),
        description: args.description,
        updatedAt: timestamp,
      };
      if (args.sortOrder !== undefined) patch.sortOrder = args.sortOrder;
      if (args.storageId !== undefined) {
        if (item.storageId && item.storageId !== args.storageId) {
          await ctx.storage.delete(item.storageId);
        }
        patch.storageId = args.storageId;
        patch.mediaType = 'image';
      }
      await ctx.db.patch(args.itemId, patch);
      return args.itemId;
    }

    if (!args.storageId) throw new Error('Image requise');

    const existing = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect();

    return await ctx.db.insert('portfolio', {
      profileId: profile._id,
      providerId: args.userId,
      title: args.title.trim(),
      description: args.description,
      mediaType: 'image',
      storageId: args.storageId,
      sortOrder: args.sortOrder ?? existing.length,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const removeUserPortfolioItem = mutation({
  args: { portfolioId: v.id('portfolio') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const item = await ctx.db.get(args.portfolioId);
    if (!item) throw new Error('Élément introuvable');
    if (item.storageId) await ctx.storage.delete(item.storageId);
    await ctx.db.delete(args.portfolioId);
  },
});
