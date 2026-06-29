import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
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
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const payments = await ctx.db.query('payments').order('desc').take(args.limit ?? 50);

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
