import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Bell } from 'phosphor-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/providers/ThemeProvider';
import { api } from '../../convex/_generated/api';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const notifications = useQuery(api.notifications.list, {});
  const markAllRead = useMutation(api.notifications.markAllRead);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader
        title={t('notifications.title')}
        showBack
        rightAction={
          <Pressable onPress={() => markAllRead({})}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
              {t('notifications.markAllRead')}
            </Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
                backgroundColor: n.isRead ? colors.surfaceCard : colors.primary + '08',
                borderRadius: 20,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
                {n.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.body, marginTop: 4 }}>
                {n.body}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
