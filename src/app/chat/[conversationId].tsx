import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
  FlatList,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CaretLeft,
  Camera,
  ChatCircleDots,
  Image as ImageIcon,
  Microphone,
  PaperPlaneTilt,
  Stop,
  Trash,
  X,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import {
  ChatBubble,
  type ChatMessage,
} from '@/components/chat/ChatBubble';
import { ImageZoomModal } from '@/components/chat/ImageZoomModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useUpload } from '@/hooks/useUpload';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_MS = 60_000;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const KEYBOARD_EXTRA = Spacing.four;

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  return msg.content;
}

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const { uploadFromUri } = useUpload();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [zoomUri, setZoomUri] = useState<string | null>(null);

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

  const peerName =
    conversation?.peer.name?.trim() || t('messages.conversationFallback');
  const peerInitial = peerName.charAt(0).toUpperCase();
  const peerId = conversation?.peer._id;

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
    if (!messages?.length) return;
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [messages?.length, keyboardHeight]);

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
    try {
      await sendMessage({
        conversationId: conversationId as Id<'conversations'>,
        content: message.trim(),
        type: 'text',
        replyToId: replyTo?._id as Id<'messages'> | undefined,
      });
      setMessage('');
      setReplyTo(null);
    } finally {
      setSending(false);
    }
  };

  const pickAndSendImage = async (source: 'camera' | 'library') => {
    if (!conversationId) return;

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert({
        title: t('messages.permissionRequired'),
        message: t('messages.permissionMessage'),
      });
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!ALLOWED_TYPES.includes(mimeType)) {
      alert({
        title: t('messages.unsupportedFormat'),
        message: t('messages.unsupportedFormatMessage'),
      });
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      alert({
        title: t('messages.fileTooLarge'),
        message: t('messages.fileTooLargeMessage'),
      });
      return;
    }

    setUploading(true);
    try {
      const storageId = await uploadFromUri(asset.uri, mimeType);
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
      });
    } finally {
      setUploading(false);
    }
  };

  const canSend = message.trim().length > 0 && !sending && !uploading && !recording;
  const isRecording = Boolean(recording);
  const busy = uploading || sending;

  const panelPadBottom =
    keyboardHeight > 0
      ? Platform.OS === 'ios'
        ? keyboardHeight + KEYBOARD_EXTRA
        : // Android `resize` already shrinks the window — keep a clear margin above the keyboard
          KEYBOARD_EXTRA + Spacing.three
      : Math.max(insets.bottom, Spacing.three);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Sticky chat header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
          paddingHorizontal: PAGE_H_PAD,
          paddingVertical: Spacing.three,
          borderBottomWidth: 0.1,
          borderBottomColor: colors.border,
          backgroundColor: colors.canvas,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => [{ width: 44, height: 44, opacity: pressed ? 0.8 : 1 }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.iconWash,
              borderWidth: 0.1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CaretLeft size={20} color={colors.ink} weight="bold" />
          </View>
        </Pressable>

        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
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
                fontSize: 16,
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
              { color: colors.ink, fontSize: 18, lineHeight: 22 },
            ]}
          >
            {peerName}
          </Text>
          <Text numberOfLines={1} style={[textStyle('micro'), { color: colors.muted }]}>
            {t('messages.chatSubtitle')}
          </Text>
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
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{
              paddingHorizontal: Spacing.four,
              paddingTop: Spacing.four,
              paddingBottom: Spacing.two,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const seenByPeer = Boolean(
                peerId && item.readBy?.includes(peerId as Id<'users'>),
              );
              return (
                <ChatBubble
                  message={item as ChatMessage}
                  mine={item.senderId === user?._id}
                  seenByPeer={seenByPeer}
                  onReply={(msg) => setReplyTo(msg)}
                  onImagePress={(uri) => setZoomUri(uri)}
                />
              );
            }}
          />
        )}

        {/* Composer panel — pads above keyboard */}
        <View
          style={{
            borderTopWidth: 0.1,
            borderTopColor: colors.border,
            borderTopLeftRadius: Radius.lg,
            borderTopRightRadius: Radius.lg,
            backgroundColor: colors.surfaceCard,
            paddingHorizontal: Spacing.three,
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
                borderRadius: Radius.lg,
                borderWidth: 0.1,
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surfaceStrong : colors.iconWash,
              }}
            >
              <View
                style={{
                  width: 3,
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
                gap: Spacing.three,
                marginBottom: Spacing.two,
                paddingVertical: Spacing.two,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.lg,
                borderWidth: 0.1,
                borderColor: colors.border,
                backgroundColor: isDark ? colors.surfaceStrong : colors.iconWash,
              }}
            >
              <Pressable
                onPress={cancelRecording}
                accessibilityLabel={t('messages.voiceCancel')}
                style={({ pressed }) => [{ width: 40, height: 40, opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.error + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash size={18} color={colors.error} weight="bold" />
                </View>
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 15,
                    color: colors.ink,
                  }}
                >
                  {t('messages.voiceRecording')}
                </Text>
                <Text style={[textStyle('micro'), { color: colors.muted }]}>
                  {formatMs(recordingMs)} / {formatMs(MAX_AUDIO_MS)}
                </Text>
              </View>

              <Pressable
                onPress={() => recording && finishAndSendAudio(recording)}
                accessibilityLabel={t('messages.voiceStop')}
                style={({ pressed }) => [{ width: 44, height: 44, opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Stop size={18} color={colors.onAccent} weight="fill" />
                </View>
              </Pressable>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: Spacing.two,
            }}
          >
            <Pressable
              onPress={() => pickAndSendImage('library')}
              disabled={busy || isRecording}
              hitSlop={4}
              accessibilityLabel={t('messages.attachImage')}
              style={({ pressed }) => [
                { width: 44, height: 44, opacity: pressed || busy ? 0.7 : 1 },
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.orbit} size="small" />
                ) : (
                  <ImageIcon size={20} color={colors.ink} />
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={() => pickAndSendImage('camera')}
              disabled={busy || isRecording}
              hitSlop={4}
              accessibilityLabel={t('messages.takePhoto')}
              style={({ pressed }) => [
                { width: 44, height: 44, opacity: pressed || busy ? 0.7 : 1 },
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={20} color={colors.ink} />
              </View>
            </Pressable>

            <Pressable
              onPress={startRecording}
              disabled={busy || isRecording}
              hitSlop={4}
              accessibilityLabel={t('messages.voiceRecord')}
              style={({ pressed }) => [
                { width: 44, height: 44, opacity: pressed || busy || isRecording ? 0.7 : 1 },
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isRecording ? colors.error + '22' : colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Microphone
                  size={20}
                  color={isRecording ? colors.error : colors.ink}
                  weight={isRecording ? 'fill' : 'regular'}
                />
              </View>
            </Pressable>

            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? colors.surfaceStrong : colors.canvas,
                borderRadius: Radius.lg,
                borderWidth: 0.1,
                borderColor: colors.borderStrong,
                paddingHorizontal: Spacing.four,
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={t('messages.typeMessage')}
                placeholderTextColor={colors.muted}
                selectionColor={colors.orbit}
                multiline
                maxLength={2000}
                editable={!busy && !isRecording}
                style={{
                  fontFamily: fontFamily('body'),
                  fontSize: 16,
                  lineHeight: 22.4,
                  color: colors.ink,
                  paddingVertical: Spacing.twoHalf,
                  maxHeight: 120,
                  ...(Platform.OS === 'android'
                    ? { includeFontPadding: false, textAlignVertical: 'center' }
                    : null),
                }}
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              hitSlop={4}
              accessibilityLabel={t('messages.send')}
              style={({ pressed }) => [
                {
                  width: 44,
                  height: 44,
                  opacity: !canSend ? 0.45 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
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
          </View>
        </View>
      </View>

      <ImageZoomModal uri={zoomUri} onClose={() => setZoomUri(null)} />
    </View>
  );
}
