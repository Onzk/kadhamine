export type LocationDisplayInput = {
  addressLabel?: string | null;
  city?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** Primary human-readable location — address first, then city/region, then coords. */
export function formatLocationLabel(
  input: LocationDisplayInput,
  formatCoords: (lat: string, lng: string) => string,
): string | null {
  if (input.addressLabel?.trim()) return input.addressLabel.trim();

  const cityRegion = [input.city, input.region].filter(Boolean).join(', ');
  if (cityRegion) return cityRegion;

  const { latitude, longitude } = input;
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return formatCoords(latitude.toFixed(5), longitude.toFixed(5));
  }

  return null;
}
