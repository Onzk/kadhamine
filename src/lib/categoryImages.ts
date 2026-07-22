/**
 * Images de couverture éditoriales par catégorie (Unsplash).
 * Clés = slug DB / clé visuelle resolveCategoryKey.
 */

export const CATEGORY_COVERS: Record<string, string> = {
  // Seed / slugs
  developpement: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80',
  informatique: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
  design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900&q=80',
  marketing: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=900&q=80',
  redaction: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80',
  traduction: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80',
  'photo-video': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&q=80',
  photographie: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80',
  evenementiel: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
  bricolage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900&q=80',
  reparation: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&q=80',
  cuisine: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&q=80',
  beaute: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80',
  coiffure: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80',
  formation: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80',
  transport: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=80',
  agriculture: 'https://images.unsplash.com/photo-1500937386664-56d7c0e9f3b3?w=900&q=80',
  couture: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&q=80',
  artisanat: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&q=80',

  // Clés icône / resolveCategoryKey
  code: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80',
  desktop: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80',
  palette: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900&q=80',
  megaphone: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=900&q=80',
  pencil: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80',
  translate: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80',
  camera: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=80',
  video: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&q=80',
  event: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80',
  hammer: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900&q=80',
  wrench: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&q=80',
  food: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&q=80',
  beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80',
  book: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80',
  scissors: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&q=80',
};

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80';

export function getCategoryCover(opts: {
  slug?: string;
  icon?: string;
  visualKey?: string;
}): string {
  const keys = [opts.slug, opts.icon, opts.visualKey]
    .filter(Boolean)
    .map((k) => k!.toLowerCase().trim());

  for (const key of keys) {
    if (CATEGORY_COVERS[key]) return CATEGORY_COVERS[key];
  }
  return FALLBACK_COVER;
}

/** Variante typo dérivée de la hauteur. */
export type MasonryTileSize = 'hero' | 'tall' | 'medium' | 'compact';

/** Pools de hauteurs — plus d’écarts pour un vrai effet cascade. */
export const MASONRY_HEIGHT_POOL = [124, 142, 158, 176, 198, 224, 252, 280] as const;

export const MASONRY_HEIGHT: Record<MasonryTileSize, number> = {
  hero: 200,
  tall: 252,
  medium: 176,
  compact: 136,
};

/** Espacement resserré entre cards. */
export const MASONRY_GAP = 8;

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Hauteur masonry « aléatoire » mais stable (hash de l'id),
 * avec un biais léger selon le volume de services.
 */
export function pickMasonryHeight(id: string, serviceCount: number): number {
  const h = hashId(id);
  const pool = MASONRY_HEIGHT_POOL;
  let idx = h % pool.length;

  // Biais volume
  if (serviceCount >= 6) idx = Math.max(idx, 5);
  else if (serviceCount >= 4) idx = Math.max(idx, 3);
  else if (serviceCount >= 1) idx = Math.min(Math.max(idx, 1), pool.length - 2);
  else idx = Math.min(idx, 2); // vides → plus bas

  // Perturbations supplémentaires
  if ((h >>> 8) % 4 === 0) idx = Math.min(pool.length - 1, idx + 1);
  if ((h >>> 12) % 3 === 0) idx = Math.max(0, idx - 1);
  if ((h >>> 16) % 5 === 0) idx = Math.min(pool.length - 1, idx + 2);

  return pool[idx];
}

export function sizeFromHeight(height: number): MasonryTileSize {
  if (height >= 250) return 'tall';
  if (height >= 190) return 'medium';
  if (height >= 150) return 'medium';
  return 'compact';
}

/**
 * Assigne les tailles (rétrocompat) :
 * - ≥6 services & top → hero (pleine largeur)
 * - sinon dérivé du count
 */
export function assignMasonrySize(
  serviceCount: number,
  heroRank: number,
): MasonryTileSize {
  if (serviceCount <= 0) return 'compact';
  if (serviceCount >= 6 && heroRank < 1) return 'hero';
  if (serviceCount >= 4) return 'tall';
  return 'medium';
}
