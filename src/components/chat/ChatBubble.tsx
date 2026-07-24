import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, Checks, Briefcase, Image as ImageIcon, MapPin, Microphone, Star } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { AudioMessagePlayer } from '@/components/chat/AudioMessagePlayer';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice, formatRating } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

/** Match chat screen horizontal inset. */
const CHAT_H_PAD = Spacing.three;

export type ChatReplyPreview = {
  _id: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'service';
  content: string;
  mediaUrl?: string;
  durationMs?: number;
  serviceId?: string;
};

export type ChatServicePreview = {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  pricingType?: string;
  photoUrl?: string;
  city?: string;
  averageRating?: number;
  reviewCount?: number;
};

export type ChatMessage = {
  _id: string;
  senderId?: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'service';
  content: string;
  mediaUrl?: string;
  durationMs?: number;
  serviceId?: string;
  servicePreview?: ChatServicePreview | null;
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
  onServicePress?: (serviceId: string) => void;
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
  if (reply.type === 'service') label = reply.content || t('messages.servicePreview');

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
  onServicePress,
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
  const isService = message.type === 'service';
  const service = message.servicePreview;
  const hasReply = !!message.replyTo;
  const tightPad = (isImage || isService) && !hasReply;
  /** Match chat image bubble max width. */
  const serviceCardW = imageSide;
  const serviceImageH = Math.round(serviceCardW * 0.56);

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
          // Hug content; audio needs a usable floor width
          minWidth: isAudio ? Math.min(220, maxBubbleW) : undefined,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={{
          marginBottom: clustered && !isService ? Spacing.one : Spacing.three,
        }}
      >
        <View
          style={{
            backgroundColor: mine ? sentBg : receivedBg,
            borderRadius: Radius.md,
            borderBottomRightRadius: mine ? Radius.xs : Radius.md,
            borderBottomLeftRadius: mine ? Radius.md : Radius.xs,
            padding: tightPad ? Spacing.one : Spacing.three,
            paddingBottom: isService
              ? Spacing.three
              : tightPad
                ? Spacing.one
                : Spacing.two,
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
          ) : isService ? (
            <Pressable
              onPress={() => {
                const id = service?._id ?? message.serviceId;
                if (id) onServicePress?.(id);
              }}
              style={({ pressed }) => [
                {
                  width: serviceCardW,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={{ width: serviceCardW }}>
                <View
                  style={{
                    width: serviceCardW,
                    height: serviceImageH,
                    backgroundColor: mine ? 'rgba(255,255,255,0.18)' : colors.iconWash,
                    borderRadius: hasReply ? Radius.xs : Radius.md - 4,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {service?.photoUrl ? (
                    <Image
                      source={{ uri: service.photoUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Briefcase
                      size={36}
                      color={mine ? sentFg : colors.orbit}
                      weight="duotone"
                    />
                  )}
                </View>

                <View
                  style={{
                    paddingHorizontal: tightPad ? Spacing.three : 0,
                    paddingTop: Spacing.three,
                    paddingBottom: Spacing.one,
                    gap: Spacing.one,
                  }}
                >
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: fontFamily('body', 'medium'),
                      fontSize: 16,
                      lineHeight: 21,
                      color: mine ? sentFg : receivedFg,
                    }}
                  >
                    {service?.title ?? message.content}
                  </Text>

                  {service?.description ? (
                    <Text
                      numberOfLines={2}
                      style={[
                        textStyle('caption'),
                        {
                          color: mine ? 'rgba(255,255,255,0.82)' : colors.muted,
                          lineHeight: 18,
                        },
                      ]}
                    >
                      {service.description}
                    </Text>
                  ) : null}

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: Spacing.two,
                      marginTop: Spacing.one,
                    }}
                  >
                    {service?.price != null || service?.pricingType === 'negotiable' ? (
                      <Text
                        style={{
                          fontFamily: fontFamily('body', 'medium'),
                          fontSize: 14,
                          color: mine ? sentFg : colors.orbit,
                        }}
                      >
                        {service?.pricingType === 'negotiable'
                          ? t('common.negotiable')
                          : formatPrice(service?.price ?? 0)}
                      </Text>
                    ) : null}
                    {service?.city ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <MapPin
                          size={12}
                          color={mine ? 'rgba(255,255,255,0.75)' : colors.muted}
                          weight="fill"
                        />
                        <Text
                          style={[
                            textStyle('micro'),
                            { color: mine ? 'rgba(255,255,255,0.75)' : colors.muted },
                          ]}
                        >
                          {service.city}
                        </Text>
                      </View>
                    ) : null}
                    {service?.averageRating != null && (service.reviewCount ?? 0) > 0 ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Star
                          size={12}
                          color={mine ? 'rgba(255,255,255,0.85)' : colors.rating ?? colors.accentSoft}
                          weight="fill"
                        />
                        <Text
                          style={[
                            textStyle('micro'),
                            { color: mine ? 'rgba(255,255,255,0.85)' : colors.muted },
                          ]}
                        >
                          {formatRating(service.averageRating)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ alignSelf: 'flex-end', marginTop: Spacing.one }}>
                    <MetaRow
                      createdAt={message.createdAt}
                      mine={mine}
                      seenByPeer={seenByPeer}
                      inline
                    />
                  </View>
                </View>
              </View>
            </Pressable>
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
