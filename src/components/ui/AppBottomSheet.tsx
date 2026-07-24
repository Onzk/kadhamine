import { X } from 'phosphor-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PAGE_H_PAD, SheetHeader } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const DISMISS_DRAG = 80;
const BACKDROP_COLOR = '#000000';
const BACKDROP_OPACITY = 0.5;
const OPEN_MS = 180;
/** Close animation duration — wait this long before opening another Modal. */
export const CLOSE_MS = 160;
const HANDLE_FADE_MS = 160;
const EASE = Easing.out(Easing.cubic);
const STICKY_THRESHOLD = 56;
const HANDLE_BLOCK_H = 36;

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showHandle?: boolean;
  snapHeight?: number;
  maxHeightRatio?: number;
  scrollable?: boolean;
  showClose?: boolean;
  stickyHeader?: boolean;
  /**
   * Masque le titre sticky / en-tête gauche.
   * Utile pour les alertes centrées (titre dans le body).
   * Le bouton X reste affiché si `showClose`.
   */
  hideHeader?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Marge bas en plus de la safe area (défaut `Spacing.twelve`).
   * Passer une valeur plus basse pour alertes / confirmations compactes.
   * Ignoré pour le contenu scroll si `footer` est fourni (appliqué au footer).
   */
  bottomPadExtra?: number;
  /**
   * Zone sticky sous le scroll (actions). Safe-area bas appliquée ici —
   * ne passe jamais sous la barre système.
   */
  footer?: React.ReactNode;
}

function SheetCloseButton({ onPress }: { onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Fermer"
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
          backgroundColor: colors.surfaceCard,
          borderWidth: 0.1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={20} color={colors.ink} weight="bold" />
      </View>
    </Pressable>
  );
}

interface SheetStickyBarProps {
  title: string;
  subtitle?: string;
  /** `full` = titre + description (sans clavier) ; `compact` = titre seul (clavier). */
  mode: 'full' | 'compact';
  progress: SharedValue<number>;
  active: boolean;
  showClose: boolean;
  onClose: () => void;
}

function SheetStickyBar({
  title,
  subtitle,
  mode,
  progress,
  active,
  showClose,
  onClose,
}: SheetStickyBarProps) {
  const { colors } = useAppTheme();
  const compact = mode === 'compact';

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
          paddingTop: compact ? Spacing.three : Spacing.five,
          paddingBottom: compact ? Spacing.three : Spacing.two,
          paddingHorizontal: PAGE_H_PAD,
          flexDirection: 'row',
          alignItems: compact ? 'center' : 'flex-start',
          gap: Spacing.three,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={compact ? 1 : 2}
          style={[
            compact ? textStyle('featureHeading') : textStyle('productDisplay'),
            {
              color: colors.ink,
              ...(compact
                ? { fontSize: 18, lineHeight: 22 }
                : { marginBottom: subtitle ? Spacing.two : 0 }),
            },
          ]}
        >
          {title}
        </Text>
        {!compact && subtitle ? (
          <Text
            style={[textStyle('body'), { color: colors.muted, lineHeight: 24 }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showClose ? <SheetCloseButton onPress={onClose} /> : null}
    </Animated.View>
  );
}

export function AppBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  showHandle = true,
  snapHeight,
  maxHeightRatio = 0.92,
  scrollable = true,
  showClose = true,
  stickyHeader = true,
  hideHeader = false,
  contentContainerStyle,
  bottomPadExtra = Spacing.twelve,
  footer,
}: AppBottomSheetProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  /** Zone status bar / notch — la sheet ne doit jamais y entrer. */
  const topClearance = Math.max(insets.top, Spacing.three);
  /** Safe area bas — padding interne du contenu (pas de lift du sheet). */
  const systemBottom = Math.max(insets.bottom, Platform.OS === 'android' ? Spacing.six : 0);
  const maxSheetHeight = Math.round(
    Math.min(windowHeight * maxHeightRatio, windowHeight - topClearance),
  );

  const translateY = useSharedValue(windowHeight);
  const backdropOpacity = useSharedValue(0);
  const dragOffset = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const handleOpacity = useSharedValue(1);

  const [mounted, setMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [stickyActive, setStickyActive] = useState(false);
  const closingRef = useRef(false);
  const sheetRef = useRef<Animated.View>(null);
  const effectiveMaxHeightRef = useRef(maxSheetHeight);
  const topClearanceRef = useRef(topClearance);

  const keyboardOpen = keyboardHeight > 0;
  const effectiveMaxHeight = keyboardOpen
    ? Math.min(maxSheetHeight, windowHeight - keyboardHeight - topClearance)
    : maxSheetHeight;

  effectiveMaxHeightRef.current = effectiveMaxHeight;
  topClearanceRef.current = topClearance;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      // Garde le sticky si on a déjà scrollé — repasse juste en mode titre+description.
      setStickyActive(scrollY.value > STICKY_THRESHOLD - 8);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [scrollY]);

  const syncHandleVisibility = useCallback(
    (sheetTopY: number, sheetHeight: number) => {
      const atFullHeight =
        sheetTopY <= topClearanceRef.current + 8 ||
        sheetHeight >= effectiveMaxHeightRef.current - 4;
      handleOpacity.value = withTiming(atFullHeight ? 0 : 1, {
        duration: HANDLE_FADE_MS,
        easing: EASE,
      });
    },
    [handleOpacity],
  );

  const measureSheet = useCallback(() => {
    sheetRef.current?.measureInWindow((_x, y, _w, h) => {
      syncHandleVisibility(y, h);
    });
  }, [syncHandleVisibility]);

  const onSheetLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      measureSheet();
    },
    [measureSheet],
  );

  const animateOpen = useCallback(() => {
    translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE });
    backdropOpacity.value = withTiming(BACKDROP_OPACITY, { duration: OPEN_MS, easing: EASE });
  }, [backdropOpacity, translateY]);

  const animateClose = useCallback(
    (onFinished?: () => void) => {
      translateY.value = withTiming(windowHeight, { duration: CLOSE_MS, easing: EASE });
      backdropOpacity.value = withTiming(0, { duration: CLOSE_MS, easing: EASE }, () => {
        dragOffset.value = 0;
        if (onFinished) {
          runOnJS(onFinished)();
        }
      });
    },
    [backdropOpacity, dragOffset, translateY, windowHeight],
  );

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setMounted(true);
      scrollY.value = 0;
      setStickyActive(false);
      translateY.value = windowHeight;
      backdropOpacity.value = 0;
      dragOffset.value = 0;
      handleOpacity.value = 1;
      requestAnimationFrame(() => {
        animateOpen();
        requestAnimationFrame(measureSheet);
      });
      return;
    }

    if (mounted && !closingRef.current) {
      closingRef.current = true;
      animateClose(() => {
        setMounted(false);
        closingRef.current = false;
      });
    }
  }, [
    animateClose,
    animateOpen,
    backdropOpacity,
    dragOffset,
    handleOpacity,
    measureSheet,
    mounted,
    scrollY,
    translateY,
    visible,
    windowHeight,
  ]);

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(measureSheet);
    return () => cancelAnimationFrame(id);
  }, [effectiveMaxHeight, keyboardHeight, measureSheet, mounted]);

  const requestClose = useCallback(() => {
    if (!mounted || closingRef.current) return;
    closingRef.current = true;
    Keyboard.dismiss();
    animateClose(() => {
      setMounted(false);
      closingRef.current = false;
      onClose();
    });
  }, [animateClose, mounted, onClose]);

  const handlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 2 && Math.abs(gesture.dy) >= Math.abs(gesture.dx),
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dy) > 2 && Math.abs(gesture.dy) >= Math.abs(gesture.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            dragOffset.value = gesture.dy;
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_DRAG || gesture.vy > 1.1) {
            requestClose();
          } else {
            dragOffset.value = withTiming(0, { duration: 140, easing: EASE });
          }
        },
        onPanResponderTerminate: () => {
          dragOffset.value = withTiming(0, { duration: 140, easing: EASE });
        },
      }),
    [dragOffset, requestClose],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      if (stickyHeader && scrollable) {
        runOnJS(setStickyActive)(e.contentOffset.y > STICKY_THRESHOLD - 8);
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragOffset.value }],
  }));

  const handlePillStyle = useAnimatedStyle(() => ({
    opacity: handleOpacity.value,
  }));

  const sheetHeightStyle = snapHeight
    ? { height: Math.min(snapHeight, effectiveMaxHeight) }
    : { maxHeight: effectiveMaxHeight };

  const handleBlockHeight = showHandle ? HANDLE_BLOCK_H : 0;
  const scrollMaxHeight = Math.max(effectiveMaxHeight - handleBlockHeight, 120);

  const sheetLift = keyboardOpen ? keyboardHeight : 0;
  /** Padding bas interne : safe area + marge (compacte pour alertes). */
  const sheetBottomPad = systemBottom + bottomPadExtra;
  const useSticky = scrollable && stickyHeader && !hideHeader;
  const stickyMode = keyboardOpen ? 'compact' : 'full';
  const sheetBg = colors.canvas;
  /** Avec footer sticky : safe-area sur le footer, pas sur le scroll. */
  const bodyBottomPad = footer ? Spacing.four : sheetBottomPad;

  const body = (
    <View
      style={[
        {
          alignSelf: 'stretch',
          width: '100%',
          paddingHorizontal: Spacing.six,
        },
        contentContainerStyle,
        // Toujours en dernier — safe area + bottomPadExtra (sauf si footer).
        { paddingBottom: bodyBottomPad },
      ]}
    >
      {children}
    </View>
  );

  const footerNode = footer ? (
    <View
      style={{
        alignSelf: 'stretch',
        width: '100%',
        paddingHorizontal: Spacing.six,
        paddingTop: Spacing.four,
        paddingBottom: sheetBottomPad,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        backgroundColor: sheetBg,
      }}
    >
      {footer}
    </View>
  ) : null;

  const floatingClose = showClose ? (
    <View
      style={{
        position: 'absolute',
        top: showHandle ? Spacing.two : Spacing.five,
        right: Spacing.six,
        zIndex: 10,
      }}
    >
      <SheetCloseButton onPress={requestClose} />
    </View>
  ) : null;

  const staticHeader = hideHeader ? null : (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1 }}>
        <SheetHeader title={title} subtitle={subtitle} />
      </View>
      {showClose ? (
        <View style={{ marginTop: Spacing.five, marginRight: Spacing.six }}>
          <SheetCloseButton onPress={requestClose} />
        </View>
      ) : null}
    </View>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={requestClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={requestClose}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: BACKDROP_COLOR }, backdropStyle]}
          />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={{
            width: '100%',
            zIndex: 2,
            elevation: 8,
            ...(keyboardOpen && scrollable ? { flex: 1 } : null),
          }}
        >
          <Animated.View
            ref={sheetRef}
            onLayout={onSheetLayout}
            style={[
              {
                width: '100%',
                backgroundColor: sheetBg,
                overflow: 'hidden',
                marginBottom: sheetLift,
                borderTopLeftRadius: Radius.xl,
                borderTopRightRadius: Radius.xl,
                ...(keyboardOpen && scrollable ? { flex: 1, maxHeight: effectiveMaxHeight } : null),
              },
              sheetHeightStyle,
              sheetStyle,
            ]}
          >
            {showHandle ? (
              <View
                {...handlePanResponder.panHandlers}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: Spacing.three,
                  paddingBottom: Spacing.two,
                  minHeight: HANDLE_BLOCK_H,
                }}
                accessibilityRole="adjustable"
                accessibilityLabel="Faire glisser pour fermer"
              >
                <Animated.View
                  style={[
                    {
                      width: 44,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: colors.borderStrong,
                    },
                    handlePillStyle,
                  ]}
                />
              </View>
            ) : null}

            {scrollable ? (
              <View style={{ width: '100%', backgroundColor: sheetBg }}>
                {useSticky ? (
                  <SheetStickyBar
                    title={title}
                    subtitle={subtitle}
                    mode={stickyMode}
                    progress={scrollY}
                    active={stickyActive}
                    showClose={showClose}
                    onClose={requestClose}
                  />
                ) : null}

                {showClose && (!useSticky || !stickyActive) ? floatingClose : null}

                <Animated.ScrollView
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="none"
                  showsVerticalScrollIndicator={false}
                  bounces
                  nestedScrollEnabled
                  style={{
                    backgroundColor: sheetBg,
                    maxHeight: footer
                      ? Math.max(scrollMaxHeight - 120, 120)
                      : scrollMaxHeight,
                  }}
                  contentContainerStyle={{ flexGrow: 1 }}
                >
                  {hideHeader ? null : (
                    <SheetHeader
                      title={title}
                      subtitle={subtitle}
                      style={{
                        paddingTop: useSticky ? Spacing.three : Spacing.two,
                        ...(showClose ? { paddingRight: 56 } : null),
                      }}
                    />
                  )}
                  {body}
                </Animated.ScrollView>
                {footerNode}
              </View>
            ) : (
              // Wrap in a View (not Fragment) so Yoga sizes the sheet to content when
              // hideHeader + scrollable=false — Fragment children can collapse to 0 height.
              // Avec snapHeight : remplir la sheet pour permettre justifyContent: 'flex-end'
              // (alertes : contenu en bas, seul le X reste en haut).
              <View
                style={{
                  width: '100%',
                  ...(snapHeight ? { flex: 1 } : { flexShrink: 0 }),
                }}
              >
                {hideHeader ? floatingClose : staticHeader}
                {body}
                {footerNode}
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
