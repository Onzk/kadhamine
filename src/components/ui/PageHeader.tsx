import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

/** Marge horizontale standard des pages (24px). */
export const PAGE_H_PAD = Spacing.six;
const STICKY_THRESHOLD = 56;

export interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

/** En-tête compact pour bottom sheets — même typo que PageHeader. */
export function SheetHeader({ title, subtitle, style }: SheetHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          paddingHorizontal: PAGE_H_PAD,
          paddingTop: Spacing.five,
          paddingBottom: Spacing.two,
        },
        style,
      ]}
    >
      <Text
        style={[
          textStyle('productDisplay'),
          { color: colors.ink, marginBottom: subtitle ? Spacing.two : 0 },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[textStyle('body'), { color: colors.muted, lineHeight: 24, maxWidth: 360 }]}
          numberOfLines={3}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export interface PageHeaderProps {
  title: string;
  /** Description sous le titre — obligatoire sur toutes les pages. */
  subtitle: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  /** Contenu sous le titre (search, chips…) — espacé de ~24px. */
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bloc titre large — scrolle avec la page.
 * Pas de bordure / ombre. Référence : « Votre espace ».
 */
export function PageHeader({
  title,
  subtitle,
  showBack,
  rightAction,
  actions,
  style,
}: PageHeaderProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

  return (
    <View
      style={[
        {
          paddingHorizontal: PAGE_H_PAD,
          paddingTop: Spacing.five,
          paddingBottom: Spacing.two,
        },
        style,
      ]}
    >
      {(showBack || rightAction) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.four,
          }}
        >
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.iconWash,
                  borderWidth: 0.1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CaretLeft size={20} color={colors.ink} weight="bold" />
              </View>
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}
          {rightAction ?? <View style={{ width: 44 }} />}
        </View>
      )}

      <Text
        style={[
          textStyle('productDisplay'),
          { color: colors.ink, marginBottom: Spacing.two },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[textStyle('body'), { color: colors.muted, lineHeight: 24, maxWidth: 360 }]}
        numberOfLines={2}
      >
        {subtitle}
      </Text>

      {actions ? <View style={{ marginTop: Spacing.six }}>{actions}</View> : null}
    </View>
  );
}

interface StickyBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  progress: SharedValue<number>;
  active: boolean;
}

function StickyBar({ title, showBack, rightAction, progress, active }: StickyBarProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

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
          paddingHorizontal: PAGE_H_PAD,
          paddingVertical: Spacing.three,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
        },
        style,
      ]}
    >
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
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
      {rightAction}
    </Animated.View>
  );
}

export interface PageScaffoldProps {
  title: string;
  /** Description sous le titre — obligatoire sur toutes les pages. */
  subtitle: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  stickyEnabled?: boolean;
  /** Callback JS du offset Y (ex. FAB étendu / replié). */
  onScrollYChange?: (y: number) => void;
  /**
   * Ajoute l’inset safe-area bas au paddingBottom du ScrollView.
   * Passer `false` sur les écrans à onglets déjà paddés pour la tab bar.
   * @default true
   */
  bottomInset?: boolean;
}

/**
 * Écran standard TalentTchad :
 * - titre productDisplay qui scrolle
 * - sticky sans bordure/ombre au scroll
 */
export function PageScaffold({
  title,
  subtitle,
  showBack,
  rightAction,
  headerActions,
  children,
  contentContainerStyle,
  stickyEnabled = true,
  onScrollYChange,
  bottomInset = true,
}: PageScaffoldProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [stickyActive, setStickyActive] = useState(false);
  const onScrollYChangeRef = useRef(onScrollYChange);
  onScrollYChangeRef.current = onScrollYChange;

  const notifyScrollY = (y: number) => {
    onScrollYChangeRef.current?.(y);
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      runOnJS(setStickyActive)(e.contentOffset.y > STICKY_THRESHOLD - 8);
      runOnJS(notifyScrollY)(e.contentOffset.y);
    },
  });

  // Preserve caller paddingBottom (ex. FAB clearance) and still add safe-area when enabled.
  const flatContent = StyleSheet.flatten(contentContainerStyle) as ViewStyle | undefined;
  const basePad =
    typeof flatContent?.paddingBottom === 'number'
      ? flatContent.paddingBottom
      : Spacing.eight;
  const paddingBottom = basePad + (bottomInset ? insets.bottom : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {stickyEnabled ? (
        <StickyBar
          title={title}
          showBack={showBack}
          rightAction={rightAction}
          progress={scrollY}
          active={stickyActive}
        />
      ) : null}

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          { flexGrow: 1 },
          contentContainerStyle,
          { paddingBottom },
        ]}
      >
        <PageHeader
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          rightAction={rightAction}
          actions={headerActions}
        />
        {children}
      </Animated.ScrollView>
    </View>
  );
}
