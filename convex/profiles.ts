import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { requireAuth, requireRole, calculateTrustScore, calculateBadge, now } from './lib';

type HomeProviderItem = {
  profile: Doc<'profiles'>;
  serviceCount: number;
  topServiceId: Id<'services'>;
  category: Doc<'categories'> | null;
  /** Toutes les catégories des services actifs (filtre talents). */
  categoryIds: Id<'categories'>[];
};

async function enrichHomeProvider(
  ctx: QueryCtx,
  profile: Doc<'profiles'>,
): Promise<HomeProviderItem | null> {
  const user = await ctx.db.get(profile.userId);
  if (!user || user.role !== 'provider') return null;
  if (user.status && user.status !== 'active') return null;

  const services = await ctx.db
    .query('services')
    .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
    .filter((q) => q.eq(q.field('isActive'), true))
    .collect();

  if (services.length === 0) return null;

  const topService = [...services].sort(
    (a, b) =>
      b.averageRating - a.averageRating ||
      b.orderCount - a.orderCount ||
      b.viewCount - a.viewCount,
  )[0]!;

  const category = await ctx.db.get(topService.categoryId);
  const categoryIds = [...new Set(services.map((s) => s.categoryId))];

  return {
    profile,
    serviceCount: services.length,
    topServiceId: topService._id,
    category,
    categoryIds,
  };
}

/** Prestataires accueil — premium en tête, puis note / confiance. */
export const listHome = query({
  args: {
    limit: v.optional(v.number()),
    /** Si true, ne retourne que les profils Premium. */
    premiumOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 60);
    const premiumOnly = args.premiumOnly === true;
    const results: HomeProviderItem[] = [];
    const seen = new Set<Id<'profiles'>>();

    const premiumProfiles = await ctx.db
      .query('profiles')
      .withIndex('by_premium', (q) => q.eq('isPremium', true))
      .collect();

    const sortedPremium = [...premiumProfiles].sort(
      (a, b) =>
        b.averageRating - a.averageRating ||
        b.trustScore - a.trustScore ||
        b.completedOrders - a.completedOrders,
    );

    for (const profile of sortedPremium) {
      if (results.length >= limit) break;
      const item = await enrichHomeProvider(ctx, profile);
      if (item) {
        results.push(item);
        seen.add(profile._id);
      }
    }

    if (!premiumOnly && results.length < limit) {
      const others = await ctx.db.query('profiles').collect();
      const sortedOthers = others
        .filter((p) => !p.isPremium && !seen.has(p._id))
        .sort(
          (a, b) =>
            b.averageRating - a.averageRating ||
            b.trustScore - a.trustScore ||
            b.completedOrders - a.completedOrders,
        );

      for (const profile of sortedOthers) {
        if (results.length >= limit) break;
        const item = await enrichHomeProvider(ctx, profile);
        if (item) results.push(item);
      }
    }

    return results;
  },
});

export const getById = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);
    const services = await ctx.db
      .query('services')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const portfolio = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_provider', (q) => q.eq('providerId', profile.userId))
      .filter((q) => q.eq(q.field('isVisible'), true))
      .order('desc')
      .take(10);

    return { profile, user, services, portfolio, reviews };
  },
});

/** Profil prestataire public — champs exposables uniquement. */
export const getPublicProvider = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const user = await ctx.db.get(profile.userId);
    if (!user || user.role !== 'provider') return null;

    // Owner can always preview — clients only see active accounts.
    const viewerId = await getAuthUserId(ctx);
    const isOwner = viewerId === profile.userId;
    const isActive = !user.status || user.status === 'active';
    if (!isActive && !isOwner) return null;

    const services = await ctx.db
      .query('services')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    const servicesWithCategory = await Promise.all(
      services.map(async (service) => {
        const category = await ctx.db.get(service.categoryId);
        return {
          _id: service._id,
          title: service.title,
          description: service.description,
          pricingType: service.pricingType,
          price: service.price,
          currency: service.currency,
          photos: service.photos,
          averageRating: service.averageRating,
          reviewCount: service.reviewCount,
          orderCount: service.orderCount,
          city: service.city,
          region: service.region,
          availability: service.availability,
          deliveryDays: service.deliveryDays,
          category: category
            ? {
                _id: category._id,
                nameFr: category.nameFr,
                nameAr: category.nameAr,
                nameSara: category.nameSara,
                icon: category.icon,
                slug: category.slug,
              }
            : null,
        };
      }),
    );

    const portfolioRaw = await ctx.db
      .query('portfolio')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const portfolio = await Promise.all(
      portfolioRaw
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(async (item) => {
          const mediaUrl = item.storageId
            ? await ctx.storage.getUrl(item.storageId)
            : item.mediaUrl;

          let relatedService: { _id: Id<'services'>; title: string } | null = null;
          if (item.serviceId) {
            const linked = await ctx.db.get(item.serviceId);
            if (linked && linked.isActive) {
              relatedService = { _id: linked._id, title: linked.title };
            }
          }

          return {
            _id: item._id,
            title: item.title,
            description: item.description,
            mediaType: item.mediaType,
            mediaUrl: mediaUrl ?? item.mediaUrl,
            thumbnailUrl: item.thumbnailUrl,
            serviceId: item.serviceId,
            relatedService,
            sortOrder: item.sortOrder,
            createdAt: item.createdAt,
          };
        }),
    );

    const reviewsRaw = await ctx.db
      .query('reviews')
      .withIndex('by_provider', (q) => q.eq('providerId', profile.userId))
      .filter((q) => q.eq(q.field('isVisible'), true))
      .order('desc')
      .take(30);

    const reviews = await Promise.all(
      reviewsRaw
        .filter((r) => r.isValid !== false)
        .slice(0, 10)
        .map(async (review) => {
        const clientProfile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', review.clientId))
          .first();
        return {
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          providerResponse: review.providerResponse,
          clientName: clientProfile
            ? `${clientProfile.firstName} ${clientProfile.lastName.charAt(0)}.`
            : null,
        };
      }),
    );

    return {
      userId: profile.userId,
      /** True when the owner previews a not-yet-active account. */
      isPendingPreview: !isActive && isOwner,
      profile: {
        _id: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        city: profile.city,
        region: profile.region,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        skills: profile.skills,
        experienceYears: profile.experienceYears,
        availability: profile.availability,
        isVerified: profile.isVerified,
        isPremium: profile.isPremium,
        badge: profile.badge,
        averageRating: profile.averageRating,
        reviewCount: profile.reviewCount,
        completedOrders: profile.completedOrders,
        responseTimeMinutes: profile.responseTimeMinutes,
        trustScore: profile.trustScore,
        viewCount: profile.viewCount,
        createdAt: profile.createdAt,
      },
      services: servicesWithCategory,
      portfolio,
      reviews,
    };
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    return await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
  },
});

export const updateAvatar = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) throw new Error('Profil introuvable');

    const avatarUrl = await ctx.storage.getUrl(args.storageId);
    if (profile.avatarStorageId) {
      try {
        await ctx.storage.delete(profile.avatarStorageId);
      } catch {
        // Previous avatar may already be gone.
      }
    }

    await ctx.db.patch(profile._id, {
      avatarStorageId: args.storageId,
      avatarUrl: avatarUrl ?? undefined,
      updatedAt: now(),
    });
    return profile._id;
  },
});

export const update = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    gender: v.optional(
      v.union(v.literal('male'), v.literal('female'), v.literal('other')),
    ),
    dateOfBirth: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    experienceYears: v.optional(v.number()),
    hourlyRate: v.optional(v.number()),
    availability: v.optional(
      v.union(
        v.literal('available'),
        v.literal('busy'),
        v.literal('unavailable'),
      ),
    ),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
      }),
    ),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) throw new Error('Profil introuvable');

    const updates: Record<string, unknown> = { updatedAt: now() };
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});

export const updateStats = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['admin', 'provider']);
    const profile = await ctx.db.get(args.profileId);
    if (!profile) throw new Error('Profil introuvable');

    const trustScore = calculateTrustScore(profile);
    const badge = calculateBadge(profile);

    await ctx.db.patch(args.profileId, { trustScore, badge });
  },
});

export const incrementView = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return;
    await ctx.db.patch(args.profileId, {
      viewCount: profile.viewCount + 1,
    });
  },
});
