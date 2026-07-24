import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Checks, Image as ImageIcon, Microphone } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { AudioMessagePlayer } from '@/components/chat/AudioMessagePlayer';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type ChatReplyPreview = {
  _id: string;
  type: 'text' | 'image' | 'audio' | 'document';
  content: string;
  mediaUrl?: string;
  durationMs?: number;
};

export type ChatMessage = {
  _id: string;
  type: 'text' | 'image' | 'audio' | 'document';
  content: string;
  mediaUrl?: string;
  durationMs?: number;
  createdAt: number;
  readBy?: string[];
  replyTo?: ChatReplyPreview | null;
};

interface ChatBubbleProps {
  message: ChatMessage;
  mine: boolean;
  /** Peer has this message in their readBy list */
  seenByPeer?: boolean;
  onReply?: (message: ChatMessage) => void;
  onImagePress?: (uri: string) => void;
}

function formatDuration(ms?: number) {
  if (!ms || ms <= 0) return '';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ReplyQuote({
  reply,
  mine,
  onImagePress,
}: {
  reply: ChatReplyPreview;
  mine: boolean;
  onImagePress?: (uri: string) => void;
}) {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();

  const quoteBg = mine
    ? 'rgba(255,255,255,0.18)'
    : isDark
      ? 'rgba(255,255,255,0.08)'
      : colors.iconWash;
  const quoteFg = mine ? colors.onOrbit : colors.ink;
  const quoteMuted = mine ? 'rgba(255,255,255,0.75)' : colors.muted;

  let label = reply.content;
  if (reply.type === 'image') label = t('messages.imagePreview');
  if (reply.type === 'audio') {
    label = t('messages.audioPreview');
    const dur = formatDuration(reply.durationMs);
    if (dur) label = `${label} · ${dur}`;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: Spacing.two,
        backgroundColor: quoteBg,
        borderRadius: Radius.sm,
        borderLeftWidth: 3,
        borderLeftColor: mine ? colors.onOrbit : colors.orbit,
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.twoHalf,
        marginBottom: Spacing.two,
        overflow: 'hidden',
      }}
    >
      {reply.type === 'image' && reply.mediaUrl ? (
        <Pressable
          onPress={() => onImagePress?.(reply.mediaUrl!)}
          style={({ pressed }) => [{ width: 36, height: 36, opacity: pressed ? 0.85 : 1 }]}
        >
          <Image
            source={{ uri: reply.mediaUrl }}
            style={{ width: 36, height: 36, borderRadius: Radius.xs }}
            contentFit="cover"
          />
        </Pressable>
      ) : reply.type === 'image' ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: Radius.xs,
            backgroundColor: quoteMuted + '33',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageIcon size={16} color={quoteFg} />
        </View>
      ) : reply.type === 'audio' ? (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: quoteMuted + '33',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Microphone size={14} color={quoteFg} weight="fill" />
        </View>
      ) : null}

      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        <Text
          numberOfLines={1}
          style={[textStyle('micro'), { color: quoteMuted, marginBottom: 2 }]}
        >
          {t('messages.replyTo')}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: fontFamily('body'),
            fontSize: 13,
            lineHeight: 17,
            color: quoteFg,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export function ChatBubble({
  message,
  mine,
  seenByPeer = false,
  onReply,
  onImagePress,
}: ChatBubbleProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();

  const sentBg = colors.orbit;
  const sentFg = colors.onOrbit;
  const receivedBg = isDark ? colors.surfaceStrong : colors.surfaceCard;
  const receivedFg = colors.ink;

  const isImage = message.type === 'image' && !!message.mediaUrl;
  const isAudio = message.type === 'audio' && !!message.mediaUrl;
  const hasReply = !!message.replyTo;

  return (
    <Pressable
      onLongPress={() => onReply?.(message)}
      delayLongPress={280}
      accessibilityRole="button"
      accessibilityHint={t('messages.replyHint')}
      style={({ pressed }) => [
        {
          alignSelf: mine ? 'flex-end' : 'flex-start',
          maxWidth: '82%',
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={{ marginBottom: Spacing.two }}>
      <View
        style={{
          backgroundColor: mine ? sentBg : receivedBg,
          borderRadius: Radius.lg,
          borderBottomRightRadius: mine ? Radius.xs : Radius.lg,
          borderBottomLeftRadius: mine ? Radius.lg : Radius.xs,
          borderWidth: mine ? 0 : 0.1,
          borderColor: colors.border,
          padding: isImage && !hasReply ? Spacing.one : Spacing.three,
          overflow: 'hidden',
        }}
      >
        {message.replyTo ? (
          <ReplyQuote reply={message.replyTo} mine={mine} onImagePress={onImagePress} />
        ) : null}

        {isImage ? (
          <Pressable
            onPress={() => message.mediaUrl && onImagePress?.(message.mediaUrl)}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          >
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
          </Pressable>
        ) : isAudio ? (
          <AudioMessagePlayer
            uri={message.mediaUrl!}
            durationMs={message.durationMs}
            mine={mine}
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

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginTop: 4,
          alignSelf: mine ? 'flex-end' : 'flex-start',
          paddingHorizontal: Spacing.one,
        }}
      >
        <Text style={[textStyle('micro'), { color: colors.muted }]}>
          {new Date(message.createdAt).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {mine ? (
          seenByPeer ? (
            <View accessibilityLabel={t('messages.readReceiptSeen')}>
              <Checks size={14} color={colors.orbit} weight="bold" />
            </View>
          ) : (
            <View accessibilityLabel={t('messages.readReceiptSent')}>
              <Check size={14} color={colors.muted} weight="bold" />
            </View>
          )
        ) : null}
      </View>
      </View>
    </Pressable>
  );
}
