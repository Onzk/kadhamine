import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
  PanResponder,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';

import { SheetHeader } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';

const DISMISS_DRAG = 80;
/** Black scrim — same in light and dark mode. */
const BACKDROP_COLOR = '#000000';
const BACKDROP_OPACITY = 0.5;
const OPEN_MS = 180;
const CLOSE_MS = 160;
const EASE = Easing.out(Easing.cubic);

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Show the drag handle pill at the top. Default true. */
  showHandle?: boolean;
  /** Fixed sheet height in px. Otherwise sizes to content up to maxHeightRatio. */
  snapHeight?: number;
  /** Max height as a fraction of the screen (0–1). Default 0.92. */
  maxHeightRatio?: number;
  /** Wrap children in a ScrollView. Default true. */
  scrollable?: boolean;
  /** Optional close button in the header row. Default true. */
  showClose?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
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
  contentContainerStyle,
}: AppBottomSheetProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const maxSheetHeight = Math.round(windowHeight * maxHeightRatio);

  const translateY = useSharedValue(windowHeight);
  const backdropOpacity = useSharedValue(0);
  const dragOffset = useSharedValue(0);
  const [mounted, setMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const closingRef = useRef(false);

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
      translateY.value = windowHeight;
      backdropOpacity.value = 0;
      dragOffset.value = 0;
      requestAnimationFrame(() => {
        animateOpen();
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
    mounted,
    translateY,
    visible,
    windowHeight,
  ]);

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

  /** Drag only from the handle zone so ScrollView content stays independent. */
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

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + dragOffset.value }],
  }));

  const sheetHeightStyle = snapHeight
    ? { height: Math.min(snapHeight, maxSheetHeight) }
    : { maxHeight: maxSheetHeight };

  const bottomSafe = Math.max(insets.bottom, Spacing.four);
  /** Keep sheet above the system nav bar; when keyboard is open, pad by keyboard height. */
  const sheetBottomPad = keyboardHeight > 0 ? Spacing.four : bottomSafe;

  const body = (
    <View
      style={[
        {
          paddingHorizontal: Spacing.six,
          paddingBottom: sheetBottomPad,
        },
        contentContainerStyle,
      ]}
    >
      {children}
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
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: BACKDROP_COLOR },
              backdropStyle,
            ]}
          />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={{ width: '100%' }}
        >
          <Animated.View
            style={[
              {
                backgroundColor: colors.canvas,
                borderTopLeftRadius: Radius.xl,
                borderTopRightRadius: Radius.xl,
                overflow: 'hidden',
                // Lift above system gesture / nav bar when keyboard is closed.
                marginBottom: keyboardHeight > 0 ? keyboardHeight : 0,
                paddingBottom: keyboardHeight > 0 ? 0 : 0,
              },
              sheetHeightStyle,
              sheetStyle,
            ]}
          >
            {/* Drag handle — exclusive pan target */}
            {showHandle ? (
              <View
                {...handlePanResponder.panHandlers}
                style={{
                  alignItems: 'center',
                  paddingTop: Spacing.three,
                  paddingBottom: Spacing.two,
                  minHeight: 36,
                }}
                accessibilityRole="adjustable"
                accessibilityLabel="Faire glisser pour fermer"
              >
                <View
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: colors.borderStrong,
                  }}
                />
              </View>
            ) : null}

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
                  <Pressable
                    onPress={requestClose}
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
                </View>
              ) : null}
            </View>

            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
                bounces
                nestedScrollEnabled
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {body}
              </ScrollView>
            ) : (
              body
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
