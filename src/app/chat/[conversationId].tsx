import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import type { Id } from '../../../convex/_generated/dataModel';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/providers/ThemeProvider';
import { api } from '../../../convex/_generated/api';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const messages = useQuery(api.messages.getMessages, {
    conversationId: conversationId as Id<'conversations'>,
  });
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);

  useEffect(() => {
    if (conversationId) {
      markRead({ conversationId: conversationId as Id<'conversations'> }).catch(() => {});
    }
  }, [conversationId, markRead]);

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId: conversationId as Id<'conversations'>,
        content: message.trim(),
      });
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title={t('messages.title')} showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, padding: 16 }}>
          {messages?.map((msg) => (
            <View
              key={msg._id}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.surfaceCard,
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                padding: 12,
                marginBottom: 8,
                maxWidth: '80%',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 15, color: colors.ink }}>{msg.content}</Text>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: 'row',
            padding: 12,
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.canvas,
          }}
        >
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
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <Button title={t('messages.send')} onPress={handleSend} loading={sending} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
