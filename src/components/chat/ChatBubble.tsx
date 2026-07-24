import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Checks, Image as ImageIcon, Microphone } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { AudioMessagePlayer } from '@/components/chat/AudioMessagePlayer';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

/** Match chat screen horizontal inset. */
const CHAT_H_PAD = Spacing.three;

export type ChatReplyPreview = {
  _id: string;
  type: 'text' | 'image' | 'audio' | 'document';
  content: string;
  mediaUrl?: string;
  durationMs?: number;
};

export type ChatMessage = {
  _id: string;
  senderId?: string;
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
  /** Same sender as previous message — tighter vertical gap */
  clustered?: boolean;
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

function isSameDay(a: number, b: number) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** Today → compact relative ("5 min"); older → clock time. */
function formatMessageTime(
  ts: number,
  t: (key: string, opts?: Record<string, string | number>) => string,
) {
  const now = Date.now();
  if (isSameDay(ts, now)) {
    const diffMin = Math.floor(Math.max(0, now - ts) / 60_000);
    if (diffMin < 1) return t('messages.timeNow');
    if (diffMin < 60) return t('messages.timeMinutes', { count: diffMin });
    const diffHour = Math.floor(diffMin / 60);
    return t('messages.timeHours', { count: Math.max(1, diffHour) });
  }
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
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
    ? 'rgba(255,255,255,0.2)'
    : isDark
      ? 'rgba(255,255,255,0.1)'
      : colors.iconWash;
  const quoteFg = mine ? colors.onOrbit : colors.ink;
  const quoteMuted = mine ? 'rgba(255,255,255,0.85)' : colors.muted;
  const accentBar = mine ? colors.onOrbit : colors.orbit;

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
        borderRadius: Radius.xs,
        paddingVertical: Spacing.two,
        paddingRight: Spacing.twoHalf,
        paddingLeft: Spacing.two,
        marginBottom: Spacing.two,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: 3.5,
          borderRadius: 2,
          alignSelf: 'stretch',
          backgroundColor: accentBar,
        }}
      />

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

      <View style={{ flexShrink: 1, minWidth: 0, justifyContent: 'center' }}>
        <Text
          numberOfLines={1}
          style={[textStyle('micro'), { color: quoteMuted, marginBottom: 2 }]}
        >
          {t('messages.replyTo')}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: fontFamily('body', 'medium'),
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

function MetaRow({
  createdAt,
  mine,
  seenByPeer,
  onImage,
  /** Same row as text / audio duration — nudged slightly lower */
  inline,
}: {
  createdAt: number;
  mine: boolean;
  seenByPeer: boolean;
  /** Overlay style on images — lighter contrast on photo */
  onImage?: boolean;
  inline?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const timeColor = onImage
    ? 'rgba(255,255,255,0.92)'
    : mine
      ? 'rgba(255,255,255,0.78)'
      : colors.muted;
  const tickSeen = onImage ? '#93C5FD' : '#BFDBFE';
  const tickSent = onImage ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        flexShrink: 0,
        // Same row as text/duration — bottom-aligned (no vertical nudge)
        ...(inline
          ? {}
          : {
              alignSelf: 'flex-end' as const,
              marginTop: onImage ? 0 : 4,
            }),
      }}
    >
      <Text
        style={{
          fontFamily: fontFamily('body'),
          fontSize: 11,
          lineHeight: 14,
          color: timeColor,
        }}
      >
        {formatMessageTime(createdAt, t)}
      </Text>
      {mine ? (
        seenByPeer ? (
          <View accessibilityLabel={t('messages.readReceiptSeen')}>
            <Checks size={14} color={tickSeen} weight="bold" />
          </View>
        ) : (
          <View accessibilityLabel={t('messages.readReceiptSent')}>
            <Check size={14} color={tickSent} weight="bold" />
          </View>
        )
      ) : null}
    </View>
  );
}

export function ChatBubble({
  message,
  mine,
  seenByPeer = false,
  clustered = false,
  onReply,
  onImagePress,
}: ChatBubbleProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { width: screenW } = useWindowDimensions();

  /** Dynamic max width like typical messengers (~75%, clamped by page pads). */
  const maxBubbleW = Math.min(
    Math.round(screenW * 0.75),
    screenW - CHAT_H_PAD * 2,
  );
  const imageSide = Math.min(maxBubbleW - Spacing.two, Math.round(screenW * 0.62));

  const sentBg = colors.orbit;
  const sentFg = colors.onOrbit;
  const receivedBg = isDark ? colors.surfaceStrong : colors.surfaceCard;
  const receivedFg = colors.ink;

  const isImage = message.type === 'image' && !!message.mediaUrl;
  const isAudio = message.type === 'audio' && !!message.mediaUrl;
  const hasReply = !!message.replyTo;
  const tightPad = isImage && !hasReply;

  return (
    <Pressable
      onLongPress={() => onReply?.(message)}
      delayLongPress={280}
      accessibilityRole="button"
      accessibilityHint={t('messages.replyHint')}
      style={({ pressed }) => [
        {
          alignSelf: mine ? 'flex-end' : 'flex-start',
          maxWidth: maxBubbleW,
          // Hug content; only audio needs a usable floor width
          minWidth: isAudio ? Math.min(220, maxBubbleW) : undefined,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={{ marginBottom: clustered ? Spacing.one : Spacing.three }}>
        <View
          style={{
            backgroundColor: mine ? sentBg : receivedBg,
            borderRadius: Radius.md,
            borderBottomRightRadius: mine ? Radius.xs : Radius.md,
            borderBottomLeftRadius: mine ? Radius.md : Radius.xs,
            padding: tightPad ? Spacing.one : Spacing.three,
            paddingBottom: tightPad ? Spacing.one : Spacing.two,
            overflow: 'hidden',
            alignSelf: mine ? 'flex-end' : 'flex-start',
            maxWidth: '100%',
          }}
        >
          {message.replyTo ? (
            <ReplyQuote reply={message.replyTo} mine={mine} onImagePress={onImagePress} />
          ) : null}

          {isImage ? (
            <View style={{ position: 'relative' }}>
              <Pressable
                onPress={() => message.mediaUrl && onImagePress?.(message.mediaUrl)}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <Image
                  source={{ uri: message.mediaUrl }}
                  style={{
                    width: imageSide,
                    height: imageSide,
                    borderRadius: hasReply ? Radius.xs : Radius.md - 4,
                    backgroundColor: colors.iconWash,
                  }}
                  contentFit="cover"
                />
              </Pressable>
              {!hasReply ? (
                <View
                  style={{
                    position: 'absolute',
                    right: Spacing.two,
                    bottom: Spacing.two,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: Spacing.two,
                    paddingVertical: 2,
                    borderRadius: Radius.xs,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                  }}
                >
                  <MetaRow
                    createdAt={message.createdAt}
                    mine={mine}
                    seenByPeer={seenByPeer}
                    onImage
                  />
                </View>
              ) : null}
            </View>
          ) : isAudio ? (
            <AudioMessagePlayer
              uri={message.mediaUrl!}
              durationMs={message.durationMs}
              mine={mine}
              trailing={
                <MetaRow
                  createdAt={message.createdAt}
                  mine={mine}
                  seenByPeer={seenByPeer}
                  inline
                />
              }
            />
          ) : (
            <View
              style={{
                maxWidth: '100%',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                columnGap: Spacing.two,
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamily('body'),
                  fontSize: 16,
                  lineHeight: 22.4,
                  color: mine ? sentFg : receivedFg,
                  flexShrink: 1,
                }}
              >
                {message.content}
              </Text>
              <MetaRow
                createdAt={message.createdAt}
                mine={mine}
                seenByPeer={seenByPeer}
                inline
              />
            </View>
          )}

          {isImage && hasReply ? (
            <MetaRow createdAt={message.createdAt} mine={mine} seenByPeer={seenByPeer} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
