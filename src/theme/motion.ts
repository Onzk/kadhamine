import { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';

const EASE_OUT = Easing.out(Easing.cubic);

/** Cap stagger so long lists don’t feel delayed. */
function staggerDelay(index: number, stepMs: number, maxIndex = 8) {
  return Math.min(Math.max(index, 0), maxIndex) * stepMs;
}

/**
 * Entrées Reanimated légères — pages, sections, listes / cards.
 * Toujours fluide, jamais agressif (durées courtes + easing cubic).
 */
export const Motion = {
  /** Contenu de page (PageScaffold). */
  page: () => FadeInDown.duration(320).easing(EASE_OUT),

  /** Bloc / section (SettingsSection, etc.). */
  section: (index = 0) =>
    FadeInDown.duration(280).delay(staggerDelay(index, 40, 6)).easing(EASE_OUT),

  /** Item de liste ou card. */
  item: (index = 0) =>
    FadeInDown.duration(260).delay(staggerDelay(index, 35, 10)).easing(EASE_OUT),

  /** Alias card (= item). */
  card: (index = 0) =>
    FadeInDown.duration(280).delay(staggerDelay(index, 40, 8)).easing(EASE_OUT),

  /** Fade simple (headers, overlays). */
  fade: (delay = 0) => FadeIn.duration(240).delay(delay).easing(EASE_OUT),
} as const;

export type MotionVariant = keyof typeof Motion;
