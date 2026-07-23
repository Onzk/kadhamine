import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useUpload } from '@/hooks/useUpload';
import { api } from '../../../convex/_generated/api';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { uploadFromUri } = useUpload();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messages = useQuery(api.messages.getMessages, {
    conversationId: conversationId as Id<'conversations'>,
  });
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);

  useEffect(() => {
    if (conversationId) {
      markRead({ conversationId: conversationId as Id<'conversations'> }).catch(() => {});
    }
  }, [conversationId, markRead, messages?.length]);

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
      Alert.alert('Permission requise', 'Autorisez l\'accès à la caméra ou à la galerie.');
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
      Alert.alert('Format non supporté', 'Utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      Alert.alert('Fichier trop volumineux', 'Taille maximale : 5 Mo.');
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
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageHeader
        title={t('messages.title')}
        subtitle="Échangez librement autour de votre prestation."
        showBack
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
          {messages?.map((msg) => {
            const mine = msg.senderId === user?._id;
            return (
              <View
                key={msg._id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  backgroundColor: mine ? colors.primary : colors.surfaceCard,
                  borderRadius: 20,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                  padding: 12,
                  marginBottom: 8,
                  maxWidth: '80%',
                  borderWidth: mine ? 0 : 0.1,
                  borderColor: colors.border,
                }}
              >
                {msg.type === 'image' && msg.mediaUrl ? (
                  <Image
                    source={{ uri: msg.mediaUrl }}
                    style={{ width: 200, height: 200, borderRadius: 20 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 15, color: mine ? colors.onPrimary : colors.ink }}>
                    {msg.content}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            padding: 12,
            gap: 8,
            borderTopWidth: 0.1,
            borderTopColor: colors.border,
            backgroundColor: colors.canvas,
            alignItems: 'center',
          }}
        >
          <Pressable onPress={() => pickAndSendImage('library')} disabled={uploading}>
            <View style={{ padding: 8 }}>
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <ImageIcon size={22} color={colors.ink} />
              )}
            </View>
          </Pressable>
          <Pressable onPress={() => pickAndSendImage('camera')} disabled={uploading}>
            <View style={{ padding: 8 }}>
              <Camera size={22} color={colors.ink} />
            </View>
          </Pressable>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('messages.typeMessage')}
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              backgroundColor: colors.surfaceCard,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: colors.ink,
              borderWidth: 0.1,
              borderColor: colors.border,
            }}
          />
          <Button title={t('messages.send')} onPress={handleSend} loading={sending} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
