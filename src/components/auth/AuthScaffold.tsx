import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

import { AuthBackButton, AuthHeader } from '@/components/auth/AuthExtras';
import { useAppTheme } from '@/providers/ThemeProvider';
import { textStyle } from '@/theme/typography';
import { Spacing } from '@/theme/tokens';

const STICKY_THRESHOLD = 56;
const BOTTOM_EXTRA = Spacing.four;

interface AuthStickyBarProps {
  title: string;
  onBack?: () => void;
  progress: SharedValue<number>;
  active: boolean;
}

function AuthStickyBar({ title, onBack, progress, active }: AuthStickyBarProps) {
  const { colors } = useAppTheme();

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [STICKY_THRESHOLD - 24, STICKY_THRESHOLD + 12],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [STICKY_THRESHOLD - 24, STICKY_THRESHOLD + 12],
          [-8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={active ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          backgroundColor: colors.canvas,
          paddingHorizontal: Spacing.six,
          paddingVertical: Spacing.three,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
        },
        style,
      ]}
    >
      {onBack ? <AuthBackButton onPress={onBack} /> : null}
      <Text
        numberOfLines={1}
        style={[
          textStyle('featureHeading'),
          { color: colors.ink, flex: 1, fontSize: 18, lineHeight: 22 },
        ]}
      >
        {title}
      </Text>
    </Animated.View>
  );
}

export interface AuthScaffoldProps {
  /** Titre de l’app bar au scroll (Connexion / Inscription…). */
  barTitle: string;
  /** Titre hero dans le flux scrollable. */
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLogo?: boolean;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Shell auth : hero + logo à droite, app bar au scroll, padding bas safe area
 * (évite le system bottom navigator).
 */
export function AuthScaffold({
  barTitle,
  title,
  subtitle,
  onBack,
  showLogo = true,
  children,
  contentContainerStyle,
}: AuthScaffoldProps) {
  const { colors } = useAppTheme();
  const scrollY = useSharedValue(0);
  const [stickyActive, setStickyActive] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(setStickyActive)(e.contentOffset.y > STICKY_THRESHOLD - 8);
    },
  });

  const bottomPad = BOTTOM_EXTRA + Spacing.six + keyboardHeight;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.canvas }}
      >
        <View style={{ flex: 1, backgroundColor: colors.canvas }}>
          <AuthStickyBar
            title={barTitle}
            onBack={onBack}
            progress={scrollY}
            active={stickyActive}
          />

          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              {
                flexGrow: 1,
                alignItems: 'stretch',
                paddingHorizontal: Spacing.six,
                paddingTop: Spacing.four,
                paddingBottom: bottomPad,
              },
              contentContainerStyle,
            ]}
          >
            <AuthHeader
              title={title}
              subtitle={subtitle}
              onBack={onBack}
              showLogo={showLogo}
            />
            {children}
          </Animated.ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
