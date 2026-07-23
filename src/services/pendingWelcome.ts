import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'talenttchad_pending_welcome';

export type PendingWelcomeKind = 'login' | 'register';

/** À appeler après auth réussie, avant la redirection vers l’accueil. */
export async function setPendingWelcome(kind: PendingWelcomeKind): Promise<void> {
  await AsyncStorage.setItem(KEY, kind);
}

/** Lit et consomme le flag — à appeler une fois sur l’accueil. */
export async function consumePendingWelcome(): Promise<PendingWelcomeKind | null> {
  const value = await AsyncStorage.getItem(KEY);
  if (value !== 'login' && value !== 'register') return null;
  await AsyncStorage.removeItem(KEY);
  return value;
}
