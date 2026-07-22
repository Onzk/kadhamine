import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { House, MagnifyingGlass, ClipboardText, ChatCircleDots, User } from 'phosphor-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { textStyle } from '@/theme/typography';
import { Shadows } from '@/theme/tokens';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 999,
          position: 'absolute',
          ...Shadows.nav,
        },
        tabBarLabelStyle: { ...textStyle('micro'), color: undefined },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <House
              size={size}
              color={String(color)}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size, focused }) => (
            <MagnifyingGlass
              size={size}
              color={String(color)}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color, size, focused }) => (
            <ClipboardText
              size={size}
              color={String(color)}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, size, focused }) => (
            <ChatCircleDots
              size={size}
              color={String(color)}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <User
              size={size}
              color={String(color)}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
