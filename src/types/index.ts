import type { Id } from '../../convex/_generated/dataModel';

export type UserRole = 'client' | 'provider' | 'admin';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type Availability = 'available' | 'busy' | 'unavailable';
export type PricingType = 'fixed' | 'negotiable';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'completed'
  | 'cancelled';
export type PaymentMethod =
  | 'fedapay'
  | 'airtel_money'
  | 'moov_money'
  | 'off_platform';
export type PaymentStatus =
  | 'pending'
  | 'held'
  | 'released'
  | 'refunded'
  | 'failed';
export type BadgeType =
  | 'beginner'
  | 'confirmed'
  | 'expert'
  | 'top_talent'
  | 'verified'
  | 'premium';

export interface ServiceFilters {
  categoryId?: Id<'categories'>;
  region?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  premiumOnly?: boolean;
  availability?: Availability;
  search?: string;
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'popular' | 'recent';
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'client' | 'provider';
  firstName: string;
  lastName: string;
  city: string;
  region: string;
  phone?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface CreateServiceFormData {
  title: string;
  description: string;
  categoryId: string;
  pricingType: PricingType;
  price?: number;
  deliveryDays?: number;
}

export interface CreateOrderFormData {
  serviceId: string;
  description?: string;
  agreedPrice?: number;
  deliveryDate?: string;
  paymentMethod: PaymentMethod;
}

export function formatPrice(amount: number, currency = 'XAF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
