import { Platform, Share } from 'react-native';
import * as Linking from 'expo-linking';

import { formatPrice, formatRating } from '@/types';

type TFunc = (key: string, options?: Record<string, unknown>) => string;

/** Deep link into the app (scheme `tchadtalent://…`). */
export function appPathUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return Linking.createURL(normalized);
}

function truncate(text: string, max: number) {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, Math.max(0, max - 1)).trim()}…`;
}

type SharePayload = {
  title?: string;
  message: string;
  url: string;
};

/** Native share sheet — embeds URL on Android (no separate url field). */
export async function shareContent(payload: SharePayload) {
  const { title, message, url } = payload;
  if (Platform.OS === 'ios') {
    await Share.share({ title, message, url });
    return;
  }
  await Share.share({
    title,
    message: `${message}\n\n${url}`,
  });
}

export type ServiceShareInput = {
  serviceId: string;
  title: string;
  description?: string | null;
  price?: number | null;
  pricingType?: 'fixed' | 'negotiable' | string | null;
  currency?: string | null;
  city?: string | null;
  region?: string | null;
  categoryLabel?: string | null;
  providerName?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
};

export function buildServiceShare(input: ServiceShareInput, t: TFunc): SharePayload {
  const url = appPathUrl(`/service/${input.serviceId}`);
  const lines: string[] = [input.title.trim()];

  const priceLabel =
    input.pricingType === 'negotiable'
      ? t('common.negotiable')
      : input.price != null
        ? formatPrice(input.price, input.currency ?? undefined)
        : null;
  const location = [input.city, input.region].filter(Boolean).join(', ');
  const meta = [priceLabel, location, input.categoryLabel].filter(Boolean);
  if (meta.length) lines.push(meta.join(' · '));

  if (input.providerName?.trim()) {
    lines.push(t('service.shareProvider', { name: input.providerName.trim() }));
  }

  const reviews = input.reviewCount ?? 0;
  if (input.averageRating != null && reviews > 0) {
    lines.push(
      t('service.shareRating', {
        rating: formatRating(input.averageRating),
        count: reviews,
      }),
    );
  }

  if (input.description?.trim()) {
    lines.push('', truncate(input.description, 160));
  }

  lines.push('', t('service.shareFooter'));

  return {
    title: input.title.trim(),
    message: lines.join('\n'),
    url,
  };
}

export type ProviderShareInput = {
  profileId: string;
  name: string;
  bio?: string | null;
  city?: string | null;
  region?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  completedOrders?: number | null;
  servicesCount?: number | null;
  skills?: string[] | null;
  isVerified?: boolean;
  isPremium?: boolean;
};

export function buildProviderShare(input: ProviderShareInput, t: TFunc): SharePayload {
  const url = appPathUrl(`/provider/${input.profileId}`);
  const name = input.name.trim();
  const lines: string[] = [name];

  const badges = [
    input.isVerified ? t('common.verified') : null,
    input.isPremium ? t('common.premium') : null,
  ].filter(Boolean);
  if (badges.length) lines.push(badges.join(' · '));

  const location = [input.city, input.region].filter(Boolean).join(', ');
  if (location) lines.push(location);

  const reviews = input.reviewCount ?? 0;
  if (input.averageRating != null && reviews > 0) {
    lines.push(
      t('provider.shareRating', {
        rating: formatRating(input.averageRating),
        count: reviews,
      }),
    );
  }

  const stats = [
    input.servicesCount != null && input.servicesCount > 0
      ? t('provider.shareServicesCount', { count: input.servicesCount })
      : null,
    input.completedOrders != null && input.completedOrders > 0
      ? t('provider.shareCompletedCount', { count: input.completedOrders })
      : null,
  ].filter(Boolean);
  if (stats.length) lines.push(stats.join(' · '));

  const skills = (input.skills ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (skills.length) {
    lines.push(t('provider.shareSkills', { skills: skills.join(', ') }));
  }

  if (input.bio?.trim()) {
    lines.push('', truncate(input.bio, 160));
  }

  lines.push('', t('provider.shareFooter'));

  return {
    title: name,
    message: lines.join('\n'),
    url,
  };
}
