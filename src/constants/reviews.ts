/**
 * Options de notation — CDC §4.7
 *
 * Chaque option a un `id` stable (stocké en base), une clé i18n,
 * et un libellé FR de référence explicite (source de vérité produit).
 */

export type ReviewOptionDef = {
  /** Identifiant stable persisté dans `providerTagIds` / `serviceTagIds` / `tagIds`. */
  id: string;
  /** Clé i18n `reviews.tags.<group>.<id>`. */
  i18nKey: string;
  /** Libellé français explicite (référence CDC / fallback). */
  labelFr: string;
};

/** 6 options — évaluation du **profil prestataire**. */
export const PROVIDER_REVIEW_OPTIONS: readonly ReviewOptionDef[] = [
  {
    id: 'punctual',
    i18nKey: 'reviews.tags.provider.punctual',
    labelFr: 'Ponctualité — a respecté les horaires et les délais promis',
  },
  {
    id: 'professional',
    i18nKey: 'reviews.tags.provider.professional',
    labelFr: 'Professionnalisme — attitude sérieuse et digne de confiance',
  },
  {
    id: 'communicative',
    i18nKey: 'reviews.tags.provider.communicative',
    labelFr: 'Communication — réponses claires et régulières',
  },
  {
    id: 'quality_work',
    i18nKey: 'reviews.tags.provider.quality_work',
    labelFr: 'Qualité du travail — résultat soigné et compétent',
  },
  {
    id: 'fair_price',
    i18nKey: 'reviews.tags.provider.fair_price',
    labelFr: 'Tarif juste — prix cohérent avec la prestation fournie',
  },
  {
    id: 'recommendable',
    i18nKey: 'reviews.tags.provider.recommendable',
    labelFr: 'Recommandation — je recommanderais ce prestataire',
  },
] as const;

/** 6 options — évaluation du **service** commandé. */
export const SERVICE_REVIEW_OPTIONS: readonly ReviewOptionDef[] = [
  {
    id: 'as_described',
    i18nKey: 'reviews.tags.service.as_described',
    labelFr: 'Conforme à l’annonce — le service correspondait à la description',
  },
  {
    id: 'good_value',
    i18nKey: 'reviews.tags.service.good_value',
    labelFr: 'Bon rapport qualité-prix — utile au regard du montant payé',
  },
  {
    id: 'timely_delivery',
    i18nKey: 'reviews.tags.service.timely_delivery',
    labelFr: 'Délai tenu — livré ou réalisé dans le temps annoncé',
  },
  {
    id: 'clear_match',
    i18nKey: 'reviews.tags.service.clear_match',
    labelFr: 'Besoin couvert — répondait bien à ma demande',
  },
  {
    id: 'quality_result',
    i18nKey: 'reviews.tags.service.quality_result',
    labelFr: 'Résultat satisfaisant — qualité finale au rendez-vous',
  },
  {
    id: 'would_reorder',
    i18nKey: 'reviews.tags.service.would_reorder',
    labelFr: 'Je recommanderais — je pourrais commander ce service à nouveau',
  },
] as const;

/** 6 options — évaluation du **client** (par le prestataire). */
export const CLIENT_REVIEW_OPTIONS: readonly ReviewOptionDef[] = [
  {
    id: 'clear_brief',
    i18nKey: 'reviews.tags.client.clear_brief',
    labelFr: 'Brief clair — a bien expliqué son besoin dès le départ',
  },
  {
    id: 'responsive',
    i18nKey: 'reviews.tags.client.responsive',
    labelFr: 'Réactivité — répondait rapidement aux messages',
  },
  {
    id: 'respectful',
    i18nKey: 'reviews.tags.client.respectful',
    labelFr: 'Respect — échange courtois et professionnel',
  },
  {
    id: 'fair',
    i18nKey: 'reviews.tags.client.fair',
    labelFr: 'Équité — attentes raisonnables et discussions correctes',
  },
  {
    id: 'pays_agreed',
    i18nKey: 'reviews.tags.client.pays_agreed',
    labelFr: 'Accords tenus — a respecté ce qui avait été convenu',
  },
  {
    id: 'recommend_client',
    i18nKey: 'reviews.tags.client.recommend_client',
    labelFr: 'Client recommandé — j’accepterais de retravailler avec lui',
  },
] as const;

/** Ids seuls (compat persistence / validation). */
export const PROVIDER_REVIEW_TAG_IDS = PROVIDER_REVIEW_OPTIONS.map((o) => o.id);
export const SERVICE_REVIEW_TAG_IDS = SERVICE_REVIEW_OPTIONS.map((o) => o.id);
export const CLIENT_REVIEW_TAG_IDS = CLIENT_REVIEW_OPTIONS.map((o) => o.id);

export type ProviderReviewTagId = (typeof PROVIDER_REVIEW_OPTIONS)[number]['id'];
export type ServiceReviewTagId = (typeof SERVICE_REVIEW_OPTIONS)[number]['id'];
export type ClientReviewTagId = (typeof CLIENT_REVIEW_OPTIONS)[number]['id'];

/** Expressions 1–5 à la saisie (consultation = étoiles). */
export const RATING_EXPRESSIONS: {
  value: 1 | 2 | 3 | 4 | 5;
  icon: 'SmileyXEyes' | 'SmileySad' | 'SmileyMeh' | 'Smiley' | 'SmileySticker';
  color: string;
  /** Clé i18n `reviews.expression.<value>` */
  i18nKey: string;
  labelFr: string;
}[] = [
  {
    value: 1,
    icon: 'SmileyXEyes',
    color: '#DC2626',
    i18nKey: 'reviews.expression.1',
    labelFr: 'Très insatisfait',
  },
  {
    value: 2,
    icon: 'SmileySad',
    color: '#EA580C',
    i18nKey: 'reviews.expression.2',
    labelFr: 'Insatisfait',
  },
  {
    value: 3,
    icon: 'SmileyMeh',
    color: '#A16207',
    i18nKey: 'reviews.expression.3',
    labelFr: 'Neutre',
  },
  {
    value: 4,
    icon: 'Smiley',
    color: '#65A30D',
    i18nKey: 'reviews.expression.4',
    labelFr: 'Satisfait',
  },
  {
    value: 5,
    icon: 'SmileySticker',
    color: '#16A34A',
    i18nKey: 'reviews.expression.5',
    labelFr: 'Très satisfait',
  },
];

/**
 * Concatène tags + commentaire libre en un bloc texte stocké en `comment`.
 */
export function buildReviewCommentBlock(parts: {
  providerHeading?: string;
  providerLabels?: string[];
  serviceHeading?: string;
  serviceLabels?: string[];
  clientHeading?: string;
  clientLabels?: string[];
  freeText?: string | null;
}): string {
  const blocks: string[] = [];

  if (parts.providerLabels?.length && parts.providerHeading) {
    blocks.push(`${parts.providerHeading}\n• ${parts.providerLabels.join('\n• ')}`);
  }
  if (parts.serviceLabels?.length && parts.serviceHeading) {
    blocks.push(`${parts.serviceHeading}\n• ${parts.serviceLabels.join('\n• ')}`);
  }
  if (parts.clientLabels?.length && parts.clientHeading) {
    blocks.push(`${parts.clientHeading}\n• ${parts.clientLabels.join('\n• ')}`);
  }
  const free = parts.freeText?.trim();
  if (free) blocks.push(free);

  return blocks.join('\n\n').trim();
}

export function isProviderReviewTagId(id: string): id is ProviderReviewTagId {
  return (PROVIDER_REVIEW_TAG_IDS as readonly string[]).includes(id);
}

export function isServiceReviewTagId(id: string): id is ServiceReviewTagId {
  return (SERVICE_REVIEW_TAG_IDS as readonly string[]).includes(id);
}

export function isClientReviewTagId(id: string): id is ClientReviewTagId {
  return (CLIENT_REVIEW_TAG_IDS as readonly string[]).includes(id);
}
