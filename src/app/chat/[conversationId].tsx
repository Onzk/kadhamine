import { useMutation, useQuery } from 'convex/react';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Briefcase,
  Camera,
  CaretLeft,
  ChatCircleDots,
  Info,
  Image as ImageIcon,
  Microphone,
  PaperPlaneTilt,
  Paperclip,
  Star,
  Stop,
  Trash,
  UserFocus,
  WarningCircle,
  X,
} from 'phosphor-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Id } from '../../../convex/_generated/dataModel';

import {
  ChatBubble,
  type ChatMessage,
} from '@/components/chat/ChatBubble';
import { ImageZoomModal } from '@/components/chat/ImageZoomModal';
import { AppBottomSheet, CLOSE_MS } from '@/components/ui/AppBottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { ServiceDetailSheet } from '@/components/orders/ServiceDetailSheet';
import { ClientInfoSheet } from '@/components/reviews/ClientInfoSheet';
import { formatPrice } from '@/types';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useUpload } from '@/hooks/useUpload';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_MS = 60_000;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Login-style field chrome (AuthField light). */
const FIELD_RADIUS = 12;
const INPUT_MIN_H = 52;
const INPUT_LINE = 22.4;
const INPUT_MAX_H = INPUT_LINE * 5 + Spacing.three * 2;
/** Switch to textarea once the line would overflow. */
const TEXTAREA_CHAR_THRESHOLD = 52;
/** Always-on content pad under composer chrome (keyboard open or closed). */
const PANEL_CONTENT_PAD_BOTTOM = Spacing.three;
/** Extra gap above keyboard. */
const KEYBOARD_EXTRA_PAD = Spacing.twelve;
/** Tighter horizontal inset than standard pages. */
const CHAT_H_PAD = Spacing.three;
/** Must match convex/messages ONLINE_WINDOW_MS */
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

type ListRow =
  | { kind: 'day'; id: string; label: string }
  | { kind: 'message'; id: string; message: ChatMessage; clustered: boolean };

function waitForModalClose() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      requestAnimationFrame(() => resolve());
    }, CLOSE_MS);
  });
}

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatClock(ts: number, language: string) {
  return new Date(ts).toLocaleTimeString(language, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPeerPresence(
  lastActiveAt: number | null | undefined,
  language: string,
  t: (key: string, opts?: Record<string, string | number>) => string,
  nowMs: number,
): { online: boolean; label: string } {
  if (lastActiveAt != null && nowMs - lastActiveAt < ONLINE_WINDOW_MS) {
    return { online: true, label: t('messages.online') };
  }
  if (lastActiveAt == null) {
    return { online: false, label: t('messages.lastSeenUnknown') };
  }

  const diffMin = Math.floor(Math.max(0, nowMs - lastActiveAt) / 60_000);
  const time = formatClock(lastActiveAt, language);

  if (diffMin < 1) {
    return { online: false, label: t('messages.lastSeenJustNow') };
  }
  if (diffMin < 60) {
    return {
      online: false,
      label: t('messages.lastSeenMinutes', { count: diffMin }),
    };
  }
  if (diffMin < 24 * 60) {
    const hours = Math.floor(diffMin / 60);
    // Same calendar day → prefer clock; otherwise hours ago
    const startOfToday = new Date(nowMs);
    startOfToday.setHours(0, 0, 0, 0);
    if (lastActiveAt >= startOfToday.getTime()) {
      return {
        online: false,
        label: t('messages.lastSeenToday', { time }),
      };
    }
    return {
      online: false,
      label: t('messages.lastSeenHours', { count: hours }),
    };
  }

  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = startOfToday.getTime() - 24 * 60 * 60 * 1000;

  if (lastActiveAt >= startOfYesterday) {
    return {
      online: false,
      label: t('messages.lastSeenYesterday', { time }),
    };
  }

  const date = new Date(lastActiveAt).toLocaleDateString(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return {
    online: false,
    label: t('messages.lastSeenDate', { date, time }),
  };
}

function formatDayLabel(
  ts: number,
  language: string,
  t: (k: string) => string,
) {
  const date = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  if (ts >= startOfToday) return t('messages.today');
  if (ts >= startOfYesterday) return t('messages.yesterday');
  return date.toLocaleDateString(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function replySnippet(msg: ChatMessage, t: (k: string) => string) {
  if (msg.type === 'image') return t('messages.imagePreview');
  if (msg.type === 'audio') {
    const dur =
      msg.durationMs && msg.durationMs > 0
        ? ` · ${formatMs(msg.durationMs)}`
        : '';
    return `${t('messages.audioPreview')}${dur}`;
  }
  if (msg.type === 'service') {
    return msg.servicePreview?.title ?? msg.content ?? t('messages.servicePreview');
  }
  return msg.content;
}

function buildRows(
  messages: ChatMessage[],
  language: string,
  t: (k: string) => string,
): ListRow[] {
  const rows: ListRow[] = [];
  let lastDay: string | null = null;
  let lastSender: string | undefined;

  for (const message of messages) {
    const key = dayKey(message.createdAt);
    if (key !== lastDay) {
      lastDay = key;
      lastSender = undefined;
      rows.push({
        kind: 'day',
        id: `day-${key}`,
        label: formatDayLabel(message.createdAt, language, t),
      });
    }
    const clustered =
      lastSender !== undefined && lastSender === message.senderId;
    lastSender = message.senderId;
    rows.push({ kind: 'message', id: message._id, message, clustered });
  }

  return rows;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const { uploadFromUri } = useUpload();
  const { pickFromLibrary, pickFromCamera, uploadAsset } = useImagePicker({
    quality: 0.85,
    mediaTypes: 'images',
  });
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ListRow>>(null);
  const inputRef = useRef<TextInput>(null);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [zoomUri, setZoomUri] = useState<string | null>(null);
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);
  const [servicePicker, setServicePicker] = useState<'mine' | 'peer' | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceSheetId, setServiceSheetId] = useState<Id<'services'> | null>(null);
  /** `send` = confirm attach; `view` = open from a received/sent card. */
  const [serviceSheetMode, setServiceSheetMode] = useState<'view' | 'send'>('view');
  const [clientInfoOpen, setClientInfoOpen] = useState(false);
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_H);
  const [inputFocused, setInputFocused] = useState(false);
  const [asTextarea, setAsTextarea] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingMs, setRecordingMs] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conversation = useQuery(
    api.messages.getConversation,
    conversationId ? { conversationId: conversationId as Id<'conversations'> } : 'skip',
  );
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId: conversationId as Id<'conversations'> } : 'skip',
  );
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);

  const peerId = conversation?.peer._id;
  const showMyServicesAttach = user?.role === 'provider';
  const showPeerServicesAttach = Boolean(conversation?.peer.hasServices);

  const myServices = useQuery(
    api.services.getMine,
    showMyServicesAttach && (attachSheetOpen || servicePicker === 'mine') ? {} : 'skip',
  );
  const peerServices = useQuery(
    api.services.listByProvider,
    peerId && showPeerServicesAttach && (attachSheetOpen || servicePicker === 'peer')
      ? { providerId: peerId as Id<'users'>, activeOnly: true }
      : 'skip',
  );

  const peerName =
    conversation?.peer.name?.trim() || t('messages.conversationFallback');
  const peerInitial = peerName.charAt(0).toUpperCase();
  const showClientRatingInHeader =
    user?.role === 'provider' && conversation?.peer.role === 'client';
  const peerClientRating = conversation?.peer.clientAverageRating ?? 0;
  const peerClientReviewCount = conversation?.peer.clientReviewCount ?? 0;
  const peerPresence = useMemo(
    () =>
      formatPeerPresence(
        conversation?.peer.lastActiveAt,
        i18n.language,
        t,
        nowMs,
      ),
    [conversation?.peer.lastActiveAt, i18n.language, t, nowMs],
  );

  const listRows = useMemo(
    () => (messages ? buildRows(messages as ChatMessage[], i18n.language, t) : []),
    [messages, i18n.language, t],
  );

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
      markRead({ conversationId: conversationId as Id<'conversations'> }).catch(() => {});
    }
  }, [conversationId, markRead, messages?.length]);

  useEffect(() => {
    if (!listRows.length) return;
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [listRows.length, keyboardHeight]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      void recording?.stopAndUnloadAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const cancelRecording = async () => {
    clearTick();
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
    } catch {
      // ignore
    }
    setRecording(null);
    setRecordingMs(0);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    }).catch(() => {});
  };

  const finishAndSendAudio = async (
    active: Audio.Recording,
    durationOverride?: number,
  ) => {
    clearTick();
    try {
      const status = await active.getStatusAsync();
      const durationMs = Math.min(
        durationOverride ??
          (status.isRecording || status.isDoneRecording ? status.durationMillis : 0),
        MAX_AUDIO_MS,
      );
      await active.stopAndUnloadAsync();
      const uri = active.getURI();
      setRecording(null);
      setRecordingMs(0);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri || !conversationId || durationMs < 400) return;

      setUploading(true);
      try {
        const storageId = await uploadFromUri(uri, 'audio/m4a');
        await sendMessage({
          conversationId: conversationId as Id<'conversations'>,
          content: 'Audio',
          type: 'audio',
          storageId,
          durationMs,
          replyToId: replyTo?._id as Id<'messages'> | undefined,
        });
        setReplyTo(null);
      } catch (err) {
        alert({
          title: t('common.error'),
          message: err instanceof Error ? err.message : t('messages.sendError'),
        });
      } finally {
        setUploading(false);
      }
    } catch (err) {
      console.error(err);
      setRecording(null);
      alert({
        title: t('common.error'),
        message: t('messages.voiceRecordError'),
      });
    }
  };

  const startRecording = async () => {
    if (uploading || sending) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert({
          title: t('common.error'),
          message: t('messages.voicePermission'),
        });
        return;
      }
      Keyboard.dismiss();
      setAttachSheetOpen(false);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      setRecordingMs(0);
      const next = new Audio.Recording();
      await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await next.startAsync();
      setRecording(next);

      tickRef.current = setInterval(async () => {
        const status = await next.getStatusAsync();
        if (!status.isRecording) return;
        setRecordingMs(status.durationMillis);
        if (status.durationMillis >= MAX_AUDIO_MS) {
          clearTick();
          await finishAndSendAudio(next, status.durationMillis);
        }
      }, 200);
    } catch (err) {
      console.error(err);
      alert({
        title: t('common.error'),
        message: t('messages.voiceRecordError'),
      });
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;
    setSending(true);
    setAttachSheetOpen(false);
    try {
      await sendMessage({
        conversationId: conversationId as Id<'conversations'>,
        content: message.trim(),
        type: 'text',
        replyToId: replyTo?._id as Id<'messages'> | undefined,
      });
      setMessage('');
      setInputHeight(INPUT_MIN_H);
      setAsTextarea(false);
      setReplyTo(null);
    } finally {
      setSending(false);
    }
  };

  const closeAttachSheet = async () => {
    if (!attachSheetOpen) return;
    setAttachSheetOpen(false);
    await waitForModalClose();
  };

  const openServicePicker = async (mode: 'mine' | 'peer') => {
    setAttachSheetOpen(false);
    await waitForModalClose();
    setServiceSearch('');
    setServicePicker(mode);
  };

  const closeServicePicker = () => {
    setServicePicker(null);
    setServiceSearch('');
  };

  const openServiceConfirm = async (serviceId: Id<'services'>) => {
    closeServicePicker();
    await waitForModalClose();
    setServiceSheetMode('send');
    setServiceSheetId(serviceId);
  };

  const closeServiceSheet = () => {
    setServiceSheetId(null);
    setServiceSheetMode('view');
  };

  const pickerServices = useMemo(() => {
    const list =
      servicePicker === 'mine'
        ? (myServices ?? []).filter((row) => row.service.isActive)
        : servicePicker === 'peer'
          ? (peerServices ?? [])
          : [];
    const q = serviceSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(({ service, category }) => {
      const hay = [
        service.title,
        service.description,
        service.city,
        category?.nameFr,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [servicePicker, myServices, peerServices, serviceSearch]);

  const sendServiceCard = async (serviceId: Id<'services'>, title: string) => {
    if (!conversationId || sending || uploading) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId: conversationId as Id<'conversations'>,
        content: title,
        type: 'service',
        serviceId,
        replyToId: replyTo?._id as Id<'messages'> | undefined,
      });
      setReplyTo(null);
      closeServiceSheet();
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('messages.sendError'),
      });
    } finally {
      setSending(false);
    }
  };

  const sendPickedImage = async (
    uri: string,
    mimeType: string,
    fileSize?: number,
  ) => {
    if (!conversationId) return;
    if (!ALLOWED_TYPES.includes(mimeType)) {
      alert({
        title: t('messages.unsupportedFormat'),
        message: t('messages.unsupportedFormatMessage'),
        icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
        iconTone: 'error',
      });
      return;
    }
    if (fileSize != null && fileSize > MAX_IMAGE_BYTES) {
      alert({
        title: t('messages.fileTooLarge'),
        message: t('messages.fileTooLargeMessage'),
        icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
        iconTone: 'error',
      });
      return;
    }

    setUploading(true);
    try {
      const storageId = await uploadAsset({ uri, mimeType, type: 'image' });
      await sendMessage({
        conversationId: conversationId as Id<'conversations'>,
        content: 'Image',
        type: 'image',
        storageId,
        replyToId: replyTo?._id as Id<'messages'> | undefined,
      });
      setReplyTo(null);
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('messages.sendError'),
        icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
        iconTone: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePermissionError = (err: unknown) => {
    if (err instanceof Error) {
      if (err.message === 'PERMISSION_CAMERA') {
        alert({
          title: t('messages.permissionRequired'),
          message: t('profile.cameraPermission'),
          icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
          iconTone: 'error',
        });
        return;
      }
      if (err.message === 'PERMISSION_GALLERY') {
        alert({
          title: t('messages.permissionRequired'),
          message: t('profile.galleryPermission'),
          icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
          iconTone: 'error',
        });
        return;
      }
    }
    alert({
      title: t('common.error'),
      message: t('messages.sendError'),
      icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
      iconTone: 'error',
    });
  };

  const pickGallery = async () => {
    await closeAttachSheet();
    try {
      const assets = await pickFromLibrary();
      if (!assets?.length) return;
      const asset = assets[0]!;
      await sendPickedImage(asset.uri, asset.mimeType, asset.fileSize);
    } catch (err) {
      handlePermissionError(err);
    }
  };

  const pickCamera = async () => {
    await closeAttachSheet();
    try {
      const asset = await pickFromCamera();
      if (!asset) return;
      await sendPickedImage(asset.uri, asset.mimeType, asset.fileSize);
    } catch (err) {
      handlePermissionError(err);
    }
  };

  const hasText = message.trim().length > 0;
  const canSend = hasText && !sending && !uploading && !recording;
  const isRecording = Boolean(recording);
  const busy = uploading || sending;
  const showSend = hasText || isRecording;
  const useTextarea =
    asTextarea ||
    message.includes('\n') ||
    message.length >= TEXTAREA_CHAR_THRESHOLD;

  /** Keyboard pad + always-present content pad */
  const panelPadBottom =
    (keyboardHeight > 0 ? keyboardHeight + KEYBOARD_EXTRA_PAD : insets.bottom) +
    PANEL_CONTENT_PAD_BOTTOM;

  const renderDayChip = (label: string) => (
    <View style={{ alignItems: 'center', marginVertical: Spacing.three }}>
      <View
        style={{
          paddingHorizontal: Spacing.three,
          paddingVertical: Spacing.oneHalf,
          borderRadius: Radius.pill,
          backgroundColor: isDark ? colors.surfaceStrong : colors.surfaceStrong,
        }}
      >
        <Text
          style={{
            fontFamily: fontFamily('body', 'medium'),
            fontSize: 12,
            lineHeight: 16,
            color: colors.muted,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Classic chat header — same canvas as page (no white bar) */}
      <View style={{ backgroundColor: colors.canvas }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.one,
            paddingHorizontal: Spacing.two,
            paddingVertical: Spacing.two,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={({ pressed }) => [{ width: 36, height: 36, opacity: pressed ? 0.8 : 1 }]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CaretLeft size={20} color={colors.ink} weight="bold" />
            </View>
          </Pressable>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: colors.iconWash,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {conversation?.peer.avatarUrl ? (
                <Image
                  source={{ uri: conversation.peer.avatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 14,
                    color: colors.ink,
                  }}
                >
                  {peerInitial}
                </Text>
              )}
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={[
                  textStyle('featureHeading'),
                  { color: colors.ink, fontSize: 16, lineHeight: 20 },
                ]}
              >
                {peerName}
              </Text>
              {showClientRatingInHeader && peerClientReviewCount > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  <Star
                    size={12}
                    color={colors.rating ?? colors.accentSoft}
                    weight="fill"
                  />
                  <Text
                    style={{
                      fontFamily: fontFamily('body', 'medium'),
                      fontSize: 12,
                      color: colors.ink,
                    }}
                  >
                    {peerClientRating.toFixed(1)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamily('body'),
                      fontSize: 11,
                      color: colors.muted,
                    }}
                  >
                    · {peerPresence.label}
                  </Text>
                </View>
              ) : (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fontFamily('body'),
                    fontSize: 12,
                    lineHeight: 16,
                    color: peerPresence.online ? colors.success : colors.muted,
                    marginTop: 1,
                  }}
                >
                  {peerPresence.label}
                </Text>
              )}
            </View>

            {showClientRatingInHeader && peerId ? (
              <Pressable
                onPress={() => setClientInfoOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('reviews.clientInfoTitle')}
                style={({ pressed }) => [
                  { width: 36, height: 36, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.iconWash,
                  }}
                >
                  <Info size={18} color={colors.ink} weight="bold" />
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {messages === undefined ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.orbit} />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon={ChatCircleDots}
              title={t('messages.chatEmpty')}
              description={t('messages.chatEmptyDescription')}
              compact
            />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={listRows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: CHAT_H_PAD,
              paddingTop: Spacing.three,
              paddingBottom: Spacing.three,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            onScrollBeginDrag={() => setAttachSheetOpen(false)}
            renderItem={({ item }) => {
              if (item.kind === 'day') return renderDayChip(item.label);
              const seenByPeer = Boolean(
                peerId && item.message.readBy?.includes(peerId as Id<'users'>),
              );
              return (
                <ChatBubble
                  message={item.message}
                  mine={item.message.senderId === user?._id}
                  seenByPeer={seenByPeer}
                  clustered={item.clustered}
                  onReply={(msg) => {
                    setReplyTo(msg);
                    setAttachSheetOpen(false);
                    inputRef.current?.focus();
                  }}
                  onImagePress={(uri) => setZoomUri(uri)}
                  onServicePress={(id) => {
                    setServiceSheetMode('view');
                    setServiceSheetId(id as Id<'services'>);
                  }}
                />
              );
            }}
          />
        )}

        {/* White composer panel */}
        <View
          style={{
            backgroundColor: isDark ? colors.surfaceCard : colors.surface,
            paddingHorizontal: CHAT_H_PAD,
            paddingTop: Spacing.three,
            paddingBottom: panelPadBottom,
          }}
        >
          {replyTo ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.two,
                marginBottom: Spacing.two,
                paddingVertical: Spacing.two,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.md,
                backgroundColor: isDark ? colors.surfaceStrong : colors.iconWash,
              }}
            >
              <View
                style={{
                  width: 3.5,
                  alignSelf: 'stretch',
                  borderRadius: 2,
                  backgroundColor: colors.orbit,
                }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[textStyle('micro'), { color: colors.orbit, marginBottom: 2 }]}>
                  {t('messages.replyingTo')}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fontFamily('body'),
                    fontSize: 14,
                    color: colors.ink,
                  }}
                >
                  {replySnippet(replyTo, t)}
                </Text>
              </View>
              <Pressable
                onPress={() => setReplyTo(null)}
                hitSlop={6}
                accessibilityLabel={t('messages.cancelReply')}
                style={({ pressed }) => [{ width: 32, height: 32, opacity: pressed ? 0.8 : 1 }]}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surfaceCard,
                  }}
                >
                  <X size={16} color={colors.muted} weight="bold" />
                </View>
              </Pressable>
            </View>
          ) : null}

          {isRecording ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.two,
              }}
            >
              <Pressable
                onPress={cancelRecording}
                accessibilityLabel={t('messages.voiceCancel')}
                style={({ pressed }) => [{ width: 48, height: 48, opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.error + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash size={20} color={colors.error} weight="bold" />
                </View>
              </Pressable>

              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.three,
                  minHeight: 48,
                  paddingHorizontal: Spacing.four,
                  borderRadius: Radius.pill,
                  backgroundColor: isDark ? colors.surfaceStrong : colors.surfaceCard,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.error,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 15,
                    color: colors.ink,
                  }}
                >
                  {t('messages.voiceRecording')}
                </Text>
                <Text style={[textStyle('micro'), { color: colors.muted }]}>
                  {formatMs(recordingMs)}
                </Text>
              </View>

              <Pressable
                onPress={() => recording && finishAndSendAudio(recording)}
                accessibilityLabel={t('messages.voiceStop')}
                style={({ pressed }) => [{ width: 48, height: 48, opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.orbit,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Stop size={18} color={colors.onOrbit} weight="fill" />
                </View>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: Spacing.two,
              }}
            >
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setAttachSheetOpen(true);
                }}
                disabled={busy}
                hitSlop={4}
                accessibilityLabel={t('messages.attach')}
                style={({ pressed }) => [
                  { width: 44, height: 44, opacity: pressed || busy ? 0.7 : 1 },
                ]}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator color={colors.orbit} size="small" />
                  ) : (
                    <Paperclip size={22} color={colors.ink} weight="regular" />
                  )}
                </View>
              </Pressable>

              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: useTextarea ? 'flex-start' : 'center',
                  backgroundColor: colors.surfaceCard,
                  borderRadius: FIELD_RADIUS,
                  borderWidth: BorderWidth.default,
                  borderColor: inputFocused ? colors.orbit : colors.borderStrong,
                  paddingHorizontal: Spacing.four,
                  minHeight: INPUT_MIN_H,
                  overflow: 'hidden',
                }}
              >
                <TextInput
                  ref={inputRef}
                  value={message}
                  onChangeText={(text) => {
                    setMessage(text);
                    if (!text) {
                      setInputHeight(INPUT_MIN_H);
                      setAsTextarea(false);
                      return;
                    }
                    if (text.includes('\n') || text.length >= TEXTAREA_CHAR_THRESHOLD) {
                      setAsTextarea(true);
                    }
                  }}
                  onContentSizeChange={(e) => {
                    if (!useTextarea) return;
                    const contentH = Math.ceil(e.nativeEvent.contentSize.height);
                    setInputHeight(
                      Math.min(
                        INPUT_MAX_H,
                        Math.max(INPUT_LINE, contentH) + Spacing.three * 2,
                      ),
                    );
                  }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={t('messages.typeMessage')}
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.orbit}
                  multiline={useTextarea}
                  maxLength={2000}
                  editable={!busy}
                  scrollEnabled={useTextarea && inputHeight >= INPUT_MAX_H - 1}
                  style={{
                    flex: 1,
                    fontFamily: fontFamily('body'),
                    fontSize: 16,
                    lineHeight: INPUT_LINE,
                    letterSpacing: -0.08,
                    color: colors.ink,
                    paddingVertical: Spacing.three,
                    margin: 0,
                    ...(useTextarea
                      ? { height: Math.max(INPUT_MIN_H, inputHeight), maxHeight: INPUT_MAX_H }
                      : null),
                    ...(Platform.OS === 'android'
                      ? {
                          includeFontPadding: false,
                          textAlignVertical: useTextarea ? 'top' : 'center',
                        }
                      : null),
                  }}
                />
              </View>

              {showSend ? (
                <Pressable
                  onPress={handleSend}
                  disabled={!canSend}
                  hitSlop={4}
                  accessibilityLabel={t('messages.send')}
                  style={({ pressed }) => [
                    {
                      width: 48,
                      height: 48,
                      opacity: !canSend ? 0.45 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.orbit,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {sending ? (
                      <ActivityIndicator color={colors.onOrbit} size="small" />
                    ) : (
                      <PaperPlaneTilt size={20} color={colors.onOrbit} weight="fill" />
                    )}
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  onPress={startRecording}
                  disabled={busy}
                  hitSlop={4}
                  accessibilityLabel={t('messages.voiceRecord')}
                  style={({ pressed }) => [
                    { width: 48, height: 48, opacity: pressed || busy ? 0.7 : 1 },
                  ]}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.orbit,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Microphone size={22} color={colors.onOrbit} weight="fill" />
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      <AppBottomSheet
        visible={attachSheetOpen}
        onClose={() => setAttachSheetOpen(false)}
        title={t('messages.attach')}
      >
        <View style={{ gap: Spacing.two, paddingBottom: Spacing.two }}>
          <SettingsRow
            icon={ImageIcon}
            title={t('messages.attachImage')}
            description={t('imagePicker.chooseGallery')}
            onPress={() => void pickGallery()}
          />
          <SettingsRow
            icon={Camera}
            title={t('messages.takePhoto')}
            description={t('imagePicker.takePhoto')}
            onPress={() => void pickCamera()}
          />
          {showMyServicesAttach ? (
            <SettingsRow
              icon={Briefcase}
              title={t('messages.attachMyServices')}
              description={t('messages.attachMyServicesDesc')}
              onPress={() => void openServicePicker('mine')}
            />
          ) : null}
          {showPeerServicesAttach ? (
            <SettingsRow
              icon={UserFocus}
              title={t('messages.attachPeerServices')}
              description={t('messages.attachPeerServicesDesc')}
              onPress={() => void openServicePicker('peer')}
            />
          ) : null}
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={servicePicker != null}
        onClose={closeServicePicker}
        title={
          servicePicker === 'mine'
            ? t('messages.attachMyServices')
            : t('messages.attachPeerServices')
        }
        subtitle={
          servicePicker === 'mine'
            ? t('messages.attachMyServicesSheetDesc')
            : t('messages.attachPeerServicesSheetDesc')
        }
      >
        <View style={{ gap: Spacing.three, paddingBottom: Spacing.two }}>
          <SearchBar
            value={serviceSearch}
            onChangeText={setServiceSearch}
            placeholder={t('messages.attachServiceSearch')}
          />

          {servicePicker &&
          pickerServices.length === 0 &&
          (myServices !== undefined || peerServices !== undefined) ? (
            <EmptyState
              icon={Briefcase}
              title={
                serviceSearch.trim()
                  ? t('messages.attachServiceNoResults')
                  : t('messages.attachServiceEmpty')
              }
              description={
                serviceSearch.trim()
                  ? t('messages.attachServiceNoResultsDesc')
                  : t('messages.attachServiceEmptyDesc')
              }
              compact
            />
          ) : (
            pickerServices.map(({ service }) => (
              <SettingsRow
                key={service._id}
                icon={Briefcase}
                title={service.title}
                description={
                  service.price != null
                    ? formatPrice(service.price)
                    : service.city ?? undefined
                }
                onPress={() => void openServiceConfirm(service._id)}
              />
            ))
          )}
        </View>
      </AppBottomSheet>

      <ImageZoomModal uri={zoomUri} onClose={() => setZoomUri(null)} />

      <ServiceDetailSheet
        visible={serviceSheetId != null}
        onClose={closeServiceSheet}
        serviceId={serviceSheetId}
        onSend={
          serviceSheetMode === 'send'
            ? (id, title) => void sendServiceCard(id, title)
            : undefined
        }
        sendLoading={sending && serviceSheetMode === 'send'}
        onViewFull={
          serviceSheetMode === 'view'
            ? (serviceId) => {
                closeServiceSheet();
                router.push(`/service/${serviceId}`);
              }
            : undefined
        }
      />

      <ClientInfoSheet
        visible={clientInfoOpen}
        onClose={() => setClientInfoOpen(false)}
        clientId={
          showClientRatingInHeader && peerId ? (peerId as Id<'users'>) : null
        }
      />
    </View>
  );
}
