import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Bell } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const notifications = useQuery(api.notifications.list, {});
  const markAllRead = useMutation(api.notifications.markAllRead);

  return (
    <PageScaffold
      title={t('notifications.title')}
      showBack
      rightAction={
        <Pressable onPress={() => markAllRead({})} hitSlop={8}>
          <Text style={[textStyle('caption'), { color: colors.orbit, fontWeight: '600' }]}>
            {t('notifications.markAllRead')}
          </Text>
        </Pressable>
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        {notifications === undefined ? (
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 32 }}>
            {t('common.loading')}
          </Text>
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title={t('notifications.empty')} />
        ) : (
          notifications.map((n) => (
            <View
              key={n._id}
              style={{
                backgroundColor: n.isRead ? colors.surfaceCard : colors.orbit + '12',
                borderRadius: 16,
                padding: 16,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{n.title}</Text>
              <Text style={{ fontSize: 13, color: colors.body, marginTop: 4 }}>{n.body}</Text>
            </View>
          ))
        )}
      </View>
    </PageScaffold>
  );
}
