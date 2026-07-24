import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { ChatCircleDots, Lock, MagnifyingGlass } from 'phosphor-react-native';

import { ConversationRow } from '@/components/chat/ConversationRow';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

function ConversationListSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: Spacing.three }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.three,
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            borderWidth: 0.1,
            borderColor: colors.border,
            padding: Spacing.four,
          }}
        >
          <Skeleton width={52} height={52} borderRadius={26} />
          <View style={{ flex: 1, gap: Spacing.two }}>
            <Skeleton width="55%" height={14} borderRadius={Radius.xs} />
            <Skeleton width="80%" height={12} borderRadius={Radius.xs} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function MessagesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const conversations = useQuery(api.messages.list, user ? {} : 'skip');

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const name = conv.peer.name?.toLowerCase() ?? '';
      const preview = conv.lastMessagePreview?.toLowerCase() ?? '';
      return name.includes(q) || preview.includes(q);
    });
  }, [conversations, query]);

  return (
    <PageScaffold
      title={t('messages.title')}
      subtitle={t('messages.subtitle')}
      bottomInset={false}
      headerActions={
        user && conversations && conversations.length > 0 ? (
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('messages.searchPlaceholder')}
          />
        ) : undefined
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.three }}>
        {!user ? (
          <EmptyState
            icon={Lock}
            title={t('auth.loginRequiredTitle')}
            description={t('messages.loginRequiredDescription')}
            actionLabel={t('auth.signIn')}
            onAction={() => router.push('/(auth)/login')}
          />
        ) : conversations === undefined ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={ChatCircleDots}
            title={t('messages.empty')}
            description={t('messages.emptyDescription')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MagnifyingGlass}
            title={t('messages.noResults')}
            description={t('messages.noResultsDescription')}
            compact
          />
        ) : (
          filtered.map((conv) => (
            <ConversationRow
              key={conv._id}
              conversation={conv}
              onPress={() => router.push(`/chat/${conv._id}`)}
            />
          ))
        )}
      </View>
    </PageScaffold>
  );
}
