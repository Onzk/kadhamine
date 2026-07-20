import { getAuthUserId } from '@convex-dev/auth/server';
import { QueryCtx, MutationCtx } from './_generated/server';
import { Id } from './_generated/dataModel';

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('Non authentifié');
  const user = await ctx.db.get(userId);
  if (!user) throw new Error('Utilisateur introuvable');
  return { userId, user };
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  roles: Array<'client' | 'provider' | 'admin'>,
) {
  const { userId, user } = await requireAuth(ctx);
  if (!user.role || !roles.includes(user.role)) {
    throw new Error('Accès non autorisé');
  }
  return { userId, user };
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ['admin']);
}

export function now() {
  return Date.now();
}

export function calculateTrustScore(stats: {
  averageRating: number;
  reviewCount: number;
  completedOrders: number;
  cancelledOrders: number;
  responseTimeMinutes?: number;
  isVerified: boolean;
  isPremium: boolean;
}): number {
  const ratingScore = (stats.averageRating / 5) * 40;
  const reviewScore = Math.min(stats.reviewCount / 20, 1) * 15;
  const totalOrders = stats.completedOrders + stats.cancelledOrders;
  const successRate = totalOrders > 0 ? stats.completedOrders / totalOrders : 0;
  const successScore = successRate * 25;
  const responseScore = stats.responseTimeMinutes
    ? Math.max(0, 1 - stats.responseTimeMinutes / 120) * 10
    : 5;
  const verifiedBonus = stats.isVerified ? 5 : 0;
  const premiumBonus = stats.isPremium ? 5 : 0;
  return Math.min(
    100,
    Math.round(
      ratingScore +
        reviewScore +
        successScore +
        responseScore +
        verifiedBonus +
        premiumBonus,
    ),
  );
}

export function calculateBadge(stats: {
  averageRating: number;
  completedOrders: number;
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
}): 'beginner' | 'confirmed' | 'expert' | 'top_talent' | 'verified' | 'premium' {
  if (stats.isPremium) return 'premium';
  if (stats.isVerified && stats.completedOrders >= 50 && stats.averageRating >= 4.5) {
    return 'top_talent';
  }
  if (stats.isVerified) return 'verified';
  if (stats.completedOrders >= 30 && stats.averageRating >= 4.0) return 'expert';
  if (stats.completedOrders >= 10 && stats.averageRating >= 3.5) return 'confirmed';
  return 'beginner';
}

/** Fallback only — prefer `readCommissionRate` from `./settings`. */
export const DEFAULT_COMMISSION_RATE = 0.1;
export const PREMIUM_MONTHLY_PRICE = 5000;

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function refreshProfileStats(ctx: MutationCtx, profileId: Id<'profiles'>) {
  const profile = await ctx.db.get(profileId);
  if (!profile) return;
  const trustScore = calculateTrustScore(profile);
  const badge = calculateBadge(profile);
  await ctx.db.patch(profileId, { trustScore, badge, updatedAt: now() });
}

export async function createNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<'users'>;
    type:
      | 'order'
      | 'payment'
      | 'message'
      | 'review'
      | 'validation'
      | 'rejection'
      | 'subscription'
      | 'system';
    title: string;
    body: string;
    data?: unknown;
  },
) {
  return await ctx.db.insert('notifications', {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    data: args.data,
    isRead: false,
    createdAt: now(),
  });
}
