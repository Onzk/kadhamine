import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useMutation } from 'convex/react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { api } from '../../convex/_generated/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

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
    if (!isAuthenticated || registered.current) return;

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
