import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type ConversationPeer = {
  _id: string;
  name: string | null;
  avatarUrl?: string;
};

export type ConversationListItem = {
  _id: string;
  lastMessagePreview?: string;
  lastMessageAt?: number;
  updatedAt: number;
  peer: ConversationPeer;
  unreadCount: number;
};

function formatConversationTime(
  ts: number,
  language: string,
  t: (key: string) => string,
): string {
  const date = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  if (ts >= startOfToday) {
    return date.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
  }
  if (ts >= startOfYesterday) {
    return t('messages.yesterday');
  }
  return date.toLocaleDateString(language, { day: 'numeric', month: 'short' });
}

interface ConversationRowProps {
  conversation: ConversationListItem;
  onPress: () => void;
}

export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const name = conversation.peer.name?.trim() || t('messages.conversationFallback');
  const initial = name.charAt(0).toUpperCase();
  const unread = conversation.unreadCount > 0;
  const timeTs = conversation.lastMessageAt ?? conversation.updatedAt;
  const preview = conversation.lastMessagePreview?.trim();
  const displayPreview =
    preview === '[Image]' ? t('messages.imagePreview') : preview || t('messages.noPreview');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
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
            width: 52,
            height: 52,
            borderRadius: 26,
            overflow: 'hidden',
            backgroundColor: colors.iconWash,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {conversation.peer.avatarUrl ? (
            <Image
              source={{ uri: conversation.peer.avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 20,
                color: colors.ink,
              }}
            >
              {initial}
            </Text>
          )}
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
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 16,
                lineHeight: 20,
                color: colors.ink,
              }}
            >
              {name}
            </Text>
            <Text style={[textStyle('micro'), { color: unread ? colors.orbit : colors.muted }]}>
              {formatConversationTime(timeTs, i18n.language, t)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                textStyle('caption'),
                {
                  flex: 1,
                  color: unread ? colors.body : colors.muted,
                  fontFamily: unread ? fontFamily('body', 'medium') : fontFamily('body'),
                },
              ]}
            >
              {displayPreview}
            </Text>
            {unread ? (
              <View
                style={{
                  minWidth: 22,
                  height: 22,
                  paddingHorizontal: 6,
                  borderRadius: Radius.pill,
                  backgroundColor: colors.orbit,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 11,
                    lineHeight: 14,
                    color: colors.onOrbit,
                  }}
                >
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
