import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'talenttchad_onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}

/** Remet l’onboarding à afficher (ex. après déconnexion depuis le profil). */
export async function clearOnboardingSeen(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
