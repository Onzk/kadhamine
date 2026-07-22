import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { House, MagnifyingGlass, ClipboardText, ChatCircleDots, User } from 'phosphor-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { textStyle } from '@/theme/typography';
import { Shadows } from '@/theme/tokens';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();

  const activeColor = colors.ink;
  const inactiveColor = colors.muted;

  return (
    <Tabs
      key={isDark ? 'dark' : 'light'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colors.surfaceCard,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 999,
          position: 'absolute',
          ...Shadows.nav,
        },
        tabBarLabelStyle: {
          ...textStyle('micro'),
        },
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={[
              textStyle('micro'),
              {
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
          title: t('tabs.home'),
          tabBarIcon: ({ size, focused }) => (
            <House
              size={size}
              color={focused ? activeColor : inactiveColor}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ size, focused }) => (
            <MagnifyingGlass
              size={size}
              color={focused ? activeColor : inactiveColor}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ size, focused }) => (
            <ClipboardText
              size={size}
              color={focused ? activeColor : inactiveColor}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ size, focused }) => (
            <ChatCircleDots
              size={size}
              color={focused ? activeColor : inactiveColor}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ size, focused }) => (
            <User
              size={size}
              color={focused ? activeColor : inactiveColor}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
