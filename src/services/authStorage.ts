import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@convex-dev/auth/react';

/**
 * Persistance des tokens auth pour React Native (localStorage n'existe pas).
 * @convex-dev/auth recommande expo-secure-store.
 */
export const convexAuthStorage: TokenStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
