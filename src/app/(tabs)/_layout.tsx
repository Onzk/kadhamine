import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  House,
  MagnifyingGlass,
  ClipboardText,
  ChatCircleDots,
  User,
  type Icon as PhosphorIcon,
} from 'phosphor-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';

const TAB_CONTENT_HEIGHT = 52;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  const activeColor = colors.orbit;
  const inactiveColor = colors.muted;

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
          backgroundColor: focused ? colors.orbit + '22' : 'transparent',
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
      key={isDark ? 'dark' : 'light'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopWidth: 0,
          elevation: 0,
          height: TAB_CONTENT_HEIGHT + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
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
        name="categories"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: renderIcon(House),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: renderIcon(MagnifyingGlass),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: renderIcon(ClipboardText),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: renderIcon(ChatCircleDots),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: renderIcon(User),
        }}
      />
    </Tabs>
  );
}
