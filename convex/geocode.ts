import { v } from 'convex/values';
import { action } from './_generated/server';

const USER_AGENT = 'Kadhamine/1.0 (https://talenttchad.com; contact@talenttchad.com)';

type NominatimAddress = {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
};

function pickCity(address: NominatimAddress): string | undefined {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.suburb ??
    undefined
  );
}

function pickRegion(address: NominatimAddress): string | undefined {
  return address.state ?? address.region ?? address.county ?? undefined;
}

function buildShortLabel(address: NominatimAddress, displayName?: string): string | undefined {
  const parts = [
    address.road,
    address.neighbourhood ?? address.suburb ?? address.quarter,
    pickCity(address),
    pickRegion(address),
    address.country,
  ].filter(Boolean);

  if (parts.length) return parts.join(', ');
  return displayName?.trim() || undefined;
}

/** Reverse geocode lat/lng via OpenStreetMap Nominatim (proxied for UA + CORS). */
export const reverse = action({
  args: {
    lat: v.number(),
    lng: v.number(),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(args.lat));
    url.searchParams.set('lon', String(args.lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');

    const lang = args.language === 'ar' ? 'ar' : args.language === 'sara' ? 'fr' : 'fr';

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': lang,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return { label: null as string | null, city: null as string | null, region: null as string | null };
      }

      const data = (await response.json()) as NominatimResponse;
      const address = data.address ?? {};
      const city = pickCity(address) ?? null;
      const region = pickRegion(address) ?? null;
      const label = buildShortLabel(address, data.display_name) ?? null;

      return { label, city, region };
    } catch {
      return { label: null, city: null, region: null };
    }
  },
});
