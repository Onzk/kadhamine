import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { Bell, Lock, MagnifyingGlass } from 'phosphor-react-native';

import {
  NotificationRow,
  resolveNotificationHref,
} from '@/components/notifications/NotificationRow';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChip } from '@/components/ui/FilterChip';
import { SearchBar } from '@/components/ui/SearchBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';

const FILTERS = ['all', 'unread'] as const;
type Filter = (typeof FILTERS)[number];

function NotificationListSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: Spacing.three }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: Spacing.three,
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            borderWidth: 0.1,
            borderColor: colors.border,
            padding: Spacing.four,
          }}
        >
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, gap: Spacing.two }}>
            <Skeleton width="55%" height={14} borderRadius={Radius.xs} />
            <Skeleton width="90%" height={12} borderRadius={Radius.xs} />
            <Skeleton width="70%" height={12} borderRadius={Radius.xs} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const notifications = useQuery(api.notifications.list, user?._id ? {} : 'skip');
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const unreadCount = useMemo(
    () => notifications?.filter((n) => !n.isRead).length ?? 0,
    [notifications],
  );

  const filtered = useMemo(() => {
    if (!notifications) return [];
    const byRead =
      filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
    const q = query.trim().toLowerCase();
    if (!q) return byRead;
    return byRead.filter((n) => {
      const hay = `${n.title} ${n.body}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notifications, filter, query]);

  const handlePress = async (
    n: NonNullable<typeof notifications>[number],
  ) => {
    if (!n.isRead) {
      await markRead({ notificationId: n._id }).catch(() => {});
    }
    const href = resolveNotificationHref(n.type, n.data);
    if (href) router.push(href as never);
  };

  const showToolbar = !!user && !!notifications && notifications.length > 0;

  return (
    <PageScaffold
      title={t('notifications.title')}
      subtitle={t('notifications.subtitle')}
      showBack
      rightAction={
        user && unreadCount > 0 ? (
          <Pressable
            onPress={() => markAllRead({})}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.markAllRead')}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={{ justifyContent: 'center', minHeight: 44 }}>
              <Text
                style={[
                  textStyle('caption'),
                  {
                    color: colors.orbit,
                    fontFamily: fontFamily('body', 'medium'),
                  },
                ]}
              >
                {t('notifications.markAllRead')}
              </Text>
            </View>
          </Pressable>
        ) : undefined
      }
      headerActions={
        showToolbar ? (
          <View style={{ gap: Spacing.three }}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t('notifications.searchPlaceholder')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.two }}
            >
              {FILTERS.map((f) => (
                <FilterChip
                  key={f}
                  label={
                    f === 'all'
                      ? t('common.all')
                      : t('notifications.unread')
                  }
                  selected={filter === f}
                  onPress={() => setFilter(f)}
                  compact
                />
              ))}
            </ScrollView>
          </View>
        ) : undefined
      }
    >
      <View
        style={{
          paddingHorizontal: PAGE_H_PAD,
          paddingTop: Spacing.four,
          gap: Spacing.three,
        }}
      >
        {!user && !isLoading ? (
          <EmptyState
            icon={Lock}
            title={t('auth.loginRequiredTitle')}
            description={t('notifications.loginRequiredDescription')}
            actionLabel={t('auth.signIn')}
            onAction={() => router.push('/(auth)/login')}
          />
        ) : notifications === undefined ? (
          <NotificationListSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('notifications.empty')}
            description={t('notifications.emptyDescription')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={filter === 'unread' ? Bell : MagnifyingGlass}
            title={
              filter === 'unread' && !query.trim()
                ? t('notifications.noUnread')
                : t('notifications.noResults')
            }
            description={
              filter === 'unread' && !query.trim()
                ? t('notifications.noUnreadDescription')
                : t('notifications.noResultsDescription')
            }
            compact
          />
        ) : (
          filtered.map((n) => (
            <NotificationRow
              key={n._id}
              notification={n}
              onPress={() => handlePress(n)}
            />
          ))
        )}
      </View>
    </PageScaffold>
  );
}
