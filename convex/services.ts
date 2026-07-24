import { v } from 'convex/values';
import { mutation, query, type QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireAuth, requireRole, haversineDistanceKm, now } from './lib';

async function resolveServicePhotos(
  ctx: QueryCtx,
  service: { photos: string[]; photoStorageIds?: Id<'_storage'>[] },
) {
  if (service.photoStorageIds?.length) {
    const urls = await Promise.all(
      service.photoStorageIds.map((id) => ctx.storage.getUrl(id)),
    );
    const resolved = urls.filter((u): u is string => !!u);
    if (resolved.length) return resolved;
  }
  return service.photos ?? [];
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireAuth(ctx);
    const services = await ctx.db
      .query('services')
      .withIndex('by_provider', (q) => q.eq('providerId', userId))
      .collect();

    return await Promise.all(
      services.map(async (service) => {
        const category = await ctx.db.get(service.categoryId);
        const photos = await resolveServicePhotos(ctx, service);
        return {
          service: { ...service, photos },
          category,
        };
      }),
    );
  },
});

export const list = query({
  args: {
    categoryId: v.optional(v.id('categories')),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    verifiedOnly: v.optional(v.boolean()),
    premiumOnly: v.optional(v.boolean()),
    availability: v.optional(
      v.union(
        v.literal('available'),
        v.literal('busy'),
        v.literal('unavailable'),
      ),
    ),
    search: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal('rating'),
        v.literal('price_asc'),
        v.literal('price_desc'),
        v.literal('popular'),
        v.literal('recent'),
        v.literal('distance'),
      ),
    ),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let services = await ctx.db
      .query('services')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    if (args.categoryId) {
      services = services.filter((s) => s.categoryId === args.categoryId);
    }
    if (args.region) {
      services = services.filter((s) => s.region === args.region);
    }
    if (args.city) {
      services = services.filter((s) => s.city === args.city);
    }
    if (args.minPrice !== undefined) {
      services = services.filter(
        (s) => s.price !== undefined && s.price >= args.minPrice!,
      );
    }
    if (args.maxPrice !== undefined) {
      services = services.filter(
        (s) => s.price !== undefined && s.price <= args.maxPrice!,
      );
    }
    if (args.availability) {
      services = services.filter((s) => s.availability === args.availability);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      services = services.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }

    const enriched = await Promise.all(
      services.map(async (service) => {
        const profile = await ctx.db.get(service.profileId);
        const category = await ctx.db.get(service.categoryId);
        if (args.verifiedOnly && !profile?.isVerified) return null;
        if (args.premiumOnly && !profile?.isPremium) return null;

        let distanceKm: number | undefined;
        if (
          args.latitude !== undefined &&
          args.longitude !== undefined &&
          service.latitude !== undefined &&
          service.longitude !== undefined
        ) {
          distanceKm = haversineDistanceKm(
            args.latitude,
            args.longitude,
            service.latitude,
            service.longitude,
          );
          if (args.radiusKm !== undefined && distanceKm > args.radiusKm) return null;
        }

        return { service, profile, category, distanceKm };
      }),
    );

    let results = enriched.filter(Boolean) as NonNullable<
      (typeof enriched)[number]
    >[];

    results.sort((a, b) => {
      if (a.profile?.isPremium && !b.profile?.isPremium) return -1;
      if (!a.profile?.isPremium && b.profile?.isPremium) return 1;
      return 0;
    });

    switch (args.sortBy) {
      case 'distance':
        if (args.latitude !== undefined && args.longitude !== undefined) {
          results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        }
        break;
      case 'rating':
        results.sort((a, b) => b.service.averageRating - a.service.averageRating);
        break;
      case 'price_asc':
        results.sort((a, b) => (a.service.price ?? 0) - (b.service.price ?? 0));
        break;
      case 'price_desc':
        results.sort((a, b) => (b.service.price ?? 0) - (a.service.price ?? 0));
        break;
      case 'popular':
        results.sort((a, b) => b.service.orderCount - a.service.orderCount);
        break;
      case 'recent':
      default:
        results.sort((a, b) => b.service.createdAt - a.service.createdAt);
        break;
    }

    const limit = args.limit ?? 50;
    return results.slice(0, limit);
  },
});

export const listForMap = query({
  args: {
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query('services')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    const results = await Promise.all(
      services
        .filter((s) => s.latitude !== undefined && s.longitude !== undefined)
        .map(async (service) => {
          const profile = await ctx.db.get(service.profileId);
          const category = await ctx.db.get(service.categoryId);
          let distanceKm: number | undefined;
          if (
            args.latitude !== undefined &&
            args.longitude !== undefined &&
            service.latitude !== undefined &&
            service.longitude !== undefined
          ) {
            distanceKm = haversineDistanceKm(
              args.latitude,
              args.longitude,
              service.latitude,
              service.longitude,
            );
          }
          if (args.radiusKm !== undefined && distanceKm !== undefined && distanceKm > args.radiusKm) {
            return null;
          }
          return {
            serviceId: service._id,
            title: service.title,
            description: service.description,
            pricingType: service.pricingType,
            price: service.price,
            photos: service.photos ?? [],
            city: service.city,
            latitude: service.latitude!,
            longitude: service.longitude!,
            rating: service.averageRating,
            reviewCount: service.reviewCount,
            isPremium: profile?.isPremium ?? false,
            isVerified: profile?.isVerified ?? false,
            providerName: profile ? `${profile.firstName} ${profile.lastName}` : 'Talent',
            avatarUrl: profile?.avatarUrl,
            categoryId: service.categoryId,
            categoryIcon: category?.icon,
            categoryLabel: category?.nameFr,
            distanceKm,
          };
        }),
    );

    const filtered = results.filter(Boolean) as NonNullable<(typeof results)[number]>[];
    filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    return filtered;
  },
});

export const getById = query({
  args: { serviceId: v.id('services') },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);
    if (!service) return null;

    const profile = await ctx.db.get(service.profileId);
    const category = await ctx.db.get(service.categoryId);
    const provider = await ctx.db.get(service.providerId);

    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_service', (q) => q.eq('serviceId', args.serviceId))
      .filter((q) => q.eq(q.field('isVisible'), true))
      .order('desc')
      .take(10);

    const photos = await resolveServicePhotos(ctx, service);

    return { service: { ...service, photos }, profile, category, provider, reviews };
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query('services')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .order('desc')
      .take(args.limit ?? 10);

    return await Promise.all(
      services.map(async (service) => {
        const profile = await ctx.db.get(service.profileId);
        const category = await ctx.db.get(service.categoryId);
        return { service, profile, category };
      }),
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    categoryId: v.id('categories'),
    pricingType: v.union(v.literal('fixed'), v.literal('negotiable')),
    price: v.optional(v.number()),
    deliveryDays: v.optional(v.number()),
    photos: v.optional(v.array(v.string())),
    photoStorageIds: v.optional(v.array(v.id('_storage'))),
    availability: v.optional(
      v.union(
        v.literal('available'),
        v.literal('busy'),
        v.literal('unavailable'),
      ),
    ),
    /** Default true: copy city/region/lat/lng from provider profile. */
    useProviderLocation: v.optional(v.boolean()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!profile) throw new Error('Profil prestataire requis');

    const useProviderLocation = args.useProviderLocation !== false;
    let city: string;
    let region: string;
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (useProviderLocation) {
      city = profile.city;
      region = profile.region;
      latitude = profile.latitude;
      longitude = profile.longitude;
    } else {
      if (
        !args.city ||
        !args.region ||
        args.latitude === undefined ||
        args.longitude === undefined
      ) {
        throw new Error(
          'Localisation service requise (ville, région, latitude, longitude) ou utilisez useProviderLocation',
        );
      }
      city = args.city;
      region = args.region;
      latitude = args.latitude;
      longitude = args.longitude;
    }

    let photos = args.photos ?? [];
    const photoStorageIds = args.photoStorageIds;
    if (photoStorageIds?.length) {
      const urls = await Promise.all(
        photoStorageIds.map((id) => ctx.storage.getUrl(id)),
      );
      photos = urls.filter((u): u is string => !!u);
    }

    const timestamp = now();
    return await ctx.db.insert('services', {
      providerId: userId,
      profileId: profile._id,
      title: args.title,
      description: args.description,
      categoryId: args.categoryId,
      pricingType: args.pricingType,
      price: args.price,
      currency: 'XAF',
      deliveryDays: args.deliveryDays,
      photos,
      photoStorageIds,
      availability: args.availability ?? 'available',
      isActive: true,
      viewCount: 0,
      orderCount: 0,
      averageRating: 0,
      reviewCount: 0,
      city,
      region,
      latitude,
      longitude,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const update = mutation({
  args: {
    serviceId: v.id('services'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id('categories')),
    pricingType: v.optional(
      v.union(v.literal('fixed'), v.literal('negotiable')),
    ),
    price: v.optional(v.number()),
    deliveryDays: v.optional(v.number()),
    photos: v.optional(v.array(v.string())),
    photoStorageIds: v.optional(v.array(v.id('_storage'))),
    availability: v.optional(
      v.union(
        v.literal('available'),
        v.literal('busy'),
        v.literal('unavailable'),
      ),
    ),
    isActive: v.optional(v.boolean()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const service = await ctx.db.get(args.serviceId);
    if (!service || service.providerId !== userId) {
      throw new Error('Service introuvable');
    }

    const { serviceId, photoStorageIds, ...updates } = args;
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    if (photoStorageIds !== undefined) {
      if (service.photoStorageIds?.length) {
        for (const oldId of service.photoStorageIds) {
          if (!photoStorageIds.includes(oldId)) {
            await ctx.storage.delete(oldId);
          }
        }
      }
      patch.photoStorageIds = photoStorageIds;
      if (photoStorageIds.length) {
        const urls = await Promise.all(
          photoStorageIds.map((id) => ctx.storage.getUrl(id)),
        );
        patch.photos = urls.filter((u): u is string => !!u);
      } else if (updates.photos === undefined) {
        patch.photos = [];
      }
    }

    await ctx.db.patch(serviceId, patch);
  },
});

export const remove = mutation({
  args: { serviceId: v.id('services') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['provider']);
    const service = await ctx.db.get(args.serviceId);
    if (!service || service.providerId !== userId) {
      throw new Error('Service introuvable');
    }

    if (service.photoStorageIds?.length) {
      for (const storageId of service.photoStorageIds) {
        await ctx.storage.delete(storageId);
      }
    }

    await ctx.db.delete(args.serviceId);
    return { ok: true as const };
  },
});

export const incrementView = mutation({
  args: { serviceId: v.id('services') },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.serviceId);
    if (!service) return;
    await ctx.db.patch(args.serviceId, {
      viewCount: service.viewCount + 1,
    });
  },
});
