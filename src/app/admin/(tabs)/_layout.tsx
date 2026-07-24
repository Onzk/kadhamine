import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import {
  House,
  UsersThree,
  IdentificationCard,
  Star,
  CreditCard,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';

import { useAdminTabBarPadding } from '@/components/admin/adminUi';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../../convex/_generated/api';

export default function AdminTabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { tabBarHeight, tabBarPaddingBottom } = useAdminTabBarPadding();
  const stats = useQuery(api.admin.dashboard);

  const activeColor = colors.primary;
  const inactiveColor = colors.muted;

  const badgeStyle = {
    backgroundColor: colors.error,
    color: colors.onAccent,
    fontSize: 11,
    fontFamily: fontFamily('body', 'medium'),
    minWidth: 18,
    height: 18,
    lineHeight: 16,
    borderRadius: 9,
  };

  const formatBadge = (n?: number) =>
    typeof n === 'number' && n > 0 ? (n > 99 ? '99+' : n) : undefined;

  const renderIcon =
    (IconComponent: PhosphorIcon) =>
    ({ focused }: { focused: boolean }) => (
      <View
        style={{
          width: 40,
          height: 28,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? colors.iconWash : 'transparent',
        }}
      >
        <IconComponent
          size={22}
          color={focused ? activeColor : inactiveColor}
          weight={focused ? 'fill' : 'regular'}
        />
      </View>
    );

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]} />
        ),
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopWidth: 0,
          elevation: 0,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarLabelStyle: {
          ...textStyle('micro'),
        },
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={[
              textStyle('micro'),
              {
                fontFamily: focused ? fontFamily('body', 'bold') : fontFamily('body', 'regular'),
                color: focused ? activeColor : inactiveColor,
                textAlign: 'center',
                marginTop: 2,
              },
            ]}
            numberOfLines={1}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('admin.tabDashboard'),
          tabBarIcon: renderIcon(House),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: t('admin.tabUsers'),
          tabBarIcon: renderIcon(UsersThree),
          tabBarBadge: formatBadge(stats?.pendingProviders),
          tabBarBadgeStyle: formatBadge(stats?.pendingProviders) ? badgeStyle : undefined,
        }}
      />
      <Tabs.Screen
        name="verifications"
        options={{
          title: t('admin.tabVerifications'),
          tabBarIcon: renderIcon(IdentificationCard),
          tabBarBadge: formatBadge(stats?.pendingVerifications),
          tabBarBadgeStyle: formatBadge(stats?.pendingVerifications) ? badgeStyle : undefined,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: t('admin.tabReviews'),
          tabBarIcon: renderIcon(Star),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: t('admin.tabPayments'),
          tabBarIcon: renderIcon(CreditCard),
        }}
      />
    </Tabs>
  );
}
