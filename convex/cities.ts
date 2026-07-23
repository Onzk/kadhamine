/** 10 villes MVP — coords approximatives (centres urbains). */
export const MVP_CITIES = [
  { city: "N'Djamena", region: 'ndjamena', lat: 12.1348, lng: 15.0557 },
  { city: 'Moundou', region: 'logone-occidental', lat: 8.5667, lng: 16.0833 },
  { city: 'Abéché', region: 'ouaddai', lat: 13.8292, lng: 20.8324 },
  { city: 'Sarh', region: 'moyen-chari', lat: 9.1456, lng: 18.3928 },
  { city: 'Bongor', region: 'mayo-kebbi-est', lat: 10.2822, lng: 15.3722 },
  { city: 'Doba', region: 'logone-oriental', lat: 8.6639, lng: 16.8531 },
  { city: 'Kélo', region: 'tandjile', lat: 9.3167, lng: 15.55 },
  { city: 'Pala', region: 'mayo-kebbi-ouest', lat: 9.35, lng: 14.9167 },
  { city: 'Ati', region: 'batha', lat: 13.2167, lng: 18.3333 },
  { city: 'Mongo', region: 'guera', lat: 12.1833, lng: 18.6833 },
] as const;

export type MvpCityEntry = (typeof MVP_CITIES)[number];

/** Lookup by city name (case-sensitive, matches MVP labels). Fallback: N'Djamena. */
export function coordsForCity(city: string): { lat: number; lng: number; region: string } {
  const found = MVP_CITIES.find((c) => c.city === city);
  if (found) return { lat: found.lat, lng: found.lng, region: found.region };
  const fallback = MVP_CITIES[0];
  return { lat: fallback.lat, lng: fallback.lng, region: fallback.region };
}

/** Deterministic jitter so pins don’t stack (~±1–2 km scale). */
export function jitterCoords(
  lat: number,
  lng: number,
  seed: number,
  scale = 0.012,
): { latitude: number; longitude: number } {
  const a = ((seed * 17) % 11) - 5;
  const b = ((seed * 29) % 11) - 5;
  return {
    latitude: lat + a * scale * 0.1,
    longitude: lng + b * scale * 0.1,
  };
}
