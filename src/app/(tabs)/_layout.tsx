import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
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
import { useTabsBackToHome } from '@/hooks/useTabsBackToHome';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

/** Icon + label row height (above the system-nav inset). */
const TAB_CONTENT_HEIGHT = 52;
/** Extra lift so tab items sit clearly above the system gesture/nav zone. */
const TAB_BOTTOM_EXTRA = Spacing.two;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  useTabsBackToHome();

  // Canvas fills the full tab bar (including under system nav).
  // paddingBottom pushes icons/labels above that inset zone.
  const bottomInset = Math.max(insets.bottom, Spacing.two);
  const paddingBottom = bottomInset + TAB_BOTTOM_EXTRA;
  const tabBarHeight = TAB_CONTENT_HEIGHT + paddingBottom;

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
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        // Full-bleed canvas behind icons — covers the system-nav inset zone.
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]} />
        ),
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopWidth: 0,
          elevation: 0,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom,
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
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
