import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useMutation } from 'convex/react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { api } from '../../convex/_generated/api';

/**
 * Expo Go (storeClient) ne supporte plus les push tokens distants depuis SDK 53.
 * On évite tout import statique d'`expo-notifications` (dont l'auto-enregistrement
 * se déclenche à l'import) pour ne pas polluer Expo Go avec l'erreur.
 * Les push restent opérationnels dans un development/production build.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let handlerConfigured = false;

async function registerForPushAsync(): Promise<string | null> {
  if (isExpoGo) return null;

  const Device = await import('expo-device');
  const Notifications = await import('expo-notifications');

  if (!Device.isDevice) return null;

  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token.data;
}

/** Enregistre le push token Convex quand l'utilisateur est authentifié. */
export function usePushNotifications(isAuthenticated: boolean) {
  const updatePushToken = useMutation(api.users.updatePushToken);
  const registered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registered.current || isExpoGo) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await registerForPushAsync();
        if (!cancelled && token) {
          await updatePushToken({ pushToken: token });
          registered.current = true;
        }
      } catch (err) {
        console.warn('Push registration failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, updatePushToken]);
}
