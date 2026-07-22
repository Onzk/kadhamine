import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { ChatCircleDots, Lock, CaretRight } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function MessagesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const conversations = useQuery(api.messages.list, user ? {} : 'skip');

  return (
    <PageScaffold
      title={t('messages.title')}
      subtitle={user ? undefined : 'Vos conversations avec les talents et clients.'}
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        {!user ? (
          <EmptyState
            icon={Lock}
            title="Connexion requise"
            description="Connectez-vous pour discuter avec les prestataires."
            actionLabel={t('auth.signIn')}
            onAction={() => router.push('/(auth)/login')}
          />
        ) : conversations === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : conversations.length === 0 ? (
          <EmptyState icon={ChatCircleDots} title={t('messages.empty')} />
        ) : (
          conversations.map((conv) => (
            <Pressable
              key={conv._id}
              onPress={() => router.push(`/chat/${conv._id}`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.stadium,
                padding: 16,
                marginBottom: 12,
                opacity: pressed ? 0.9 : 1,
                gap: 12,
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChatCircleDots size={22} color={colors.ink} weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
                  Conversation
                </Text>
                {conv.lastMessagePreview ? (
                  <Text numberOfLines={1} style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                    {conv.lastMessagePreview}
                  </Text>
                ) : null}
              </View>
              <CaretRight size={18} color={colors.muted} />
            </Pressable>
          ))
        )}
      </View>
    </PageScaffold>
  );
}
