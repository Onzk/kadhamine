import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CaretLeft } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

import { AuthHeader } from '@/components/auth/AuthExtras';
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
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceCard,
              borderWidth: 0.1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CaretLeft size={18} color={colors.ink} weight="bold" />
          </View>
        </Pressable>
      ) : null}
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
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [stickyActive, setStickyActive] = useState(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(setStickyActive)(e.contentOffset.y > STICKY_THRESHOLD - 8);
    },
  });

  const bottomPad = Math.max(insets.bottom, Spacing.three) + BOTTOM_EXTRA + Spacing.six;

  return (
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
  );
}
