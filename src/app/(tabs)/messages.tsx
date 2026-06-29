import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/providers/ThemeProvider';
import { api } from '../../../convex/_generated/api';

export default function MessagesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const conversations = useQuery(api.messages.list);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title={t('messages.title')} />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {conversations === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : conversations.length === 0 ? (
          <EmptyState icon="💬" title={t('messages.empty')} />
        ) : (
          conversations.map((conv) => (
            <Pressable
              key={conv._id}
              onPress={() => router.push(`/chat/${conv._id}`)}
              style={({ pressed }) => ({
                backgroundColor: colors.surfaceCard,
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
                Conversation
              </Text>
              {conv.lastMessagePreview && (
                <Text numberOfLines={1} style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                  {conv.lastMessagePreview}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
