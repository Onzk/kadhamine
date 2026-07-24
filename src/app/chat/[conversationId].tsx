import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CaretLeft,
  Camera,
  ChatCircleDots,
  Image as ImageIcon,
  PaperPlaneTilt,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { ChatBubble } from '@/components/chat/ChatBubble';
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
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const { user } = useAuth();
  const { uploadFromUri } = useUpload();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

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
  }, [messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId: conversationId as Id<'conversations'>,
        content: message.trim(),
        type: 'text',
      });
      setMessage('');
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
      });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('messages.sendError'),
      });
    } finally {
      setUploading(false);
    }
  };

  const canSend = message.trim().length > 0 && !sending && !uploading;

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
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
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <ChatBubble message={item} mine={item.senderId === user?._id} />
            )}
          />
        )}

        {/* Composer — above system nav */}
        <View
          style={{
            borderTopWidth: 0.1,
            borderTopColor: colors.border,
            backgroundColor: colors.canvas,
            paddingHorizontal: Spacing.three,
            paddingTop: Spacing.three,
            paddingBottom: Math.max(insets.bottom, Spacing.three),
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: Spacing.two,
            }}
          >
            <Pressable
              onPress={() => pickAndSendImage('library')}
              disabled={uploading || sending}
              hitSlop={4}
              accessibilityLabel={t('messages.attachImage')}
              style={({ pressed }) => [
                { width: 44, height: 44, opacity: pressed || uploading ? 0.7 : 1 },
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
              disabled={uploading || sending}
              hitSlop={4}
              accessibilityLabel={t('messages.takePhoto')}
              style={({ pressed }) => [
                { width: 44, height: 44, opacity: pressed || uploading ? 0.7 : 1 },
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

            <View
              style={{
                flex: 1,
                backgroundColor: colors.surfaceCard,
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
                editable={!uploading}
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
      </KeyboardAvoidingView>
    </View>
  );
}
