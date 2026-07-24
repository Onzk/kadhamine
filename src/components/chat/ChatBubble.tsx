import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type ChatMessage = {
  _id: string;
  type: 'text' | 'image' | 'document';
  content: string;
  mediaUrl?: string;
  createdAt: number;
};

interface ChatBubbleProps {
  message: ChatMessage;
  mine: boolean;
}

export function ChatBubble({ message, mine }: ChatBubbleProps) {
  const { colors, isDark } = useAppTheme();

  const sentBg = colors.orbit;
  const sentFg = colors.onOrbit;
  // surfaceCard matches canvas in dark mode — use a lifted wash for received bubbles
  const receivedBg = isDark ? colors.surfaceStrong : colors.surfaceCard;
  const receivedFg = colors.ink;

  const isImage = message.type === 'image' && !!message.mediaUrl;

  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        marginBottom: Spacing.two,
      }}
    >
      <View
        style={{
          backgroundColor: mine ? sentBg : receivedBg,
          borderRadius: Radius.lg,
          borderBottomRightRadius: mine ? Radius.xs : Radius.lg,
          borderBottomLeftRadius: mine ? Radius.lg : Radius.xs,
          borderWidth: mine ? 0 : 0.1,
          borderColor: colors.border,
          padding: isImage ? Spacing.one : Spacing.three,
          overflow: 'hidden',
        }}
      >
        {isImage ? (
          <Image
            source={{ uri: message.mediaUrl }}
            style={{
              width: 220,
              height: 220,
              borderRadius: Radius.md - 4,
              backgroundColor: colors.iconWash,
            }}
            contentFit="cover"
          />
        ) : (
          <Text
            style={{
              fontFamily: fontFamily('body'),
              fontSize: 16,
              lineHeight: 22.4,
              color: mine ? sentFg : receivedFg,
            }}
          >
            {message.content}
          </Text>
        )}
      </View>
      <Text
        style={[
          textStyle('micro'),
          {
            color: colors.muted,
            marginTop: 4,
            alignSelf: mine ? 'flex-end' : 'flex-start',
            paddingHorizontal: Spacing.one,
          },
        ]}
      >
        {new Date(message.createdAt).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}
