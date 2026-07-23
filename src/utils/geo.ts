/** N'Djamena urban center — app-wide fallback when device GPS is off / denied. */
export const NDJAMENA = {
  latitude: 12.1348,
  longitude: 15.0557,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
} as const;

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function openInMaps(lat: number, lng: number, label?: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${label ? `&query_place_id=${encodeURIComponent(label)}` : ''}`;
  return url;
}
