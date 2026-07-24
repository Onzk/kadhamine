import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import {
  Bell,
  ChatCircle,
  CheckCircle,
  ClipboardText,
  Crown,
  Star,
  Wallet,
  XCircle,
} from 'phosphor-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import type { Doc } from '../../../convex/_generated/dataModel';

export type NotificationDoc = Doc<'notifications'>;

const TYPE_ICONS: Record<NotificationDoc['type'], PhosphorIcon> = {
  order: ClipboardText,
  payment: Wallet,
  message: ChatCircle,
  review: Star,
  validation: CheckCircle,
  rejection: XCircle,
  subscription: Crown,
  system: Bell,
};

function formatRelativeTime(
  ts: number,
  language: string,
  t: (key: string, opts?: Record<string, string | number>) => string,
): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - ts);
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);

  if (diffMin < 1) return t('notifications.justNow');
  if (diffMin < 60) return t('notifications.minutesAgo', { count: diffMin });
  if (diffHour < 24) return t('notifications.hoursAgo', { count: diffHour });

  const date = new Date(ts);
  const startOfToday = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  ).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  if (ts >= startOfYesterday) return t('notifications.yesterday');
  return date.toLocaleDateString(language, { day: 'numeric', month: 'short' });
}

/** Resolve in-app route from notification type + optional payload. */
export function resolveNotificationHref(
  type: NotificationDoc['type'],
  data: unknown,
): string | null {
  const d =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : {};

  if (typeof d.conversationId === 'string') return `/chat/${d.conversationId}`;
  if (typeof d.orderId === 'string') return `/order/${d.orderId}`;

  switch (type) {
    case 'message':
      return '/(tabs)/messages';
    case 'order':
    case 'payment':
    case 'review':
      return '/(tabs)/orders';
    case 'subscription':
      return '/premium';
    case 'validation':
    case 'rejection':
      return '/verification';
    default:
      return null;
  }
}

interface NotificationRowProps {
  notification: NotificationDoc;
  onPress: () => void;
}

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const unread = !notification.isRead;
  const Icon = TYPE_ICONS[notification.type] ?? Bell;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: Spacing.three,
          backgroundColor: unread ? colors.orbitWash : colors.surfaceCard,
          borderRadius: Radius.lg,
          borderWidth: 0.1,
          borderColor: colors.border,
          padding: Spacing.four,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: unread ? colors.orbit : colors.iconWash,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            size={22}
            color={unread ? colors.onOrbit : colors.orbit}
            weight={unread ? 'fill' : 'duotone'}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: Spacing.two,
              marginBottom: 4,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: fontFamily('body', unread ? 'medium' : 'regular'),
                fontSize: 16,
                lineHeight: 20,
                color: colors.ink,
              }}
            >
              {notification.title}
            </Text>
            <Text
              style={[
                textStyle('micro'),
                { color: unread ? colors.orbit : colors.muted },
              ]}
            >
              {formatRelativeTime(notification.createdAt, i18n.language, t)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: Spacing.two,
            }}
          >
            <Text
              numberOfLines={2}
              style={[
                textStyle('caption'),
                {
                  flex: 1,
                  color: unread ? colors.body : colors.muted,
                  fontFamily: unread
                    ? fontFamily('body', 'medium')
                    : fontFamily('body'),
                },
              ]}
            >
              {notification.body}
            </Text>
            {unread ? (
              <View
                style={{
                  width: 10,
                  height: 10,
                  marginTop: 4,
                  borderRadius: 5,
                  backgroundColor: colors.orbit,
                }}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
