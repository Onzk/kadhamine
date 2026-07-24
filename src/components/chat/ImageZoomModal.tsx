import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';

type ImageZoomModalProps = {
  uri: string | null;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const CLOSE_HIT = 44;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function clampTranslation(
  scale: number,
  translateX: number,
  translateY: number,
  viewportW: number,
  viewportH: number,
) {
  'worklet';
  const maxX = Math.max(0, (viewportW * scale - viewportW) / 2);
  const maxY = Math.max(0, (viewportH * scale - viewportH) / 2);
  return {
    x: clamp(translateX, -maxX, maxX),
    y: clamp(translateY, -maxY, maxY),
  };
}

function resetZoom(
  scale: SharedValue<number>,
  savedScale: SharedValue<number>,
  translateX: SharedValue<number>,
  translateY: SharedValue<number>,
  savedX: SharedValue<number>,
  savedY: SharedValue<number>,
) {
  'worklet';
  scale.value = withTiming(1);
  savedScale.value = 1;
  translateX.value = withTiming(0);
  translateY.value = withTiming(0);
  savedX.value = 0;
  savedY.value = 0;
}

/**
 * Full-screen lightbox with pinch-to-zoom, pan when zoomed, double-tap toggle.
 * Shared by chat bubbles and order photo grids.
 */
export function ImageZoomModal({ uri, onClose }: ImageZoomModalProps) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const headerHeight = CLOSE_HIT + Spacing.two;
  const viewportW = screenW - insets.left - insets.right;
  const viewportH = Math.max(
    screenH - insets.top - insets.bottom - headerHeight,
    1,
  );

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const viewportWShared = useSharedValue(viewportW);
  const viewportHShared = useSharedValue(viewportH);

  useEffect(() => {
    viewportWShared.value = viewportW;
    viewportHShared.value = viewportH;
  }, [viewportH, viewportW, viewportHShared, viewportWShared]);

  useEffect(() => {
    if (!uri) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedX.value = 0;
      savedY.value = 0;
    }
  }, [uri, scale, savedScale, translateX, translateY, savedX, savedY]);

  const scrimColor = useMemo(
    () => (isDark ? 'rgba(0,0,0,0.96)' : 'rgba(0,0,0,0.94)'),
    [isDark],
  );
  const closeBg = useMemo(
    () => (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.14)'),
    [isDark],
  );

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = clamp(next, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        resetZoom(scale, savedScale, translateX, translateY, savedX, savedY);
        return;
      }
      const clamped = clampTranslation(
        scale.value,
        translateX.value,
        translateY.value,
        viewportWShared.value,
        viewportHShared.value,
      );
      translateX.value = withTiming(clamped.x);
      translateY.value = withTiming(clamped.y);
      savedX.value = clamped.x;
      savedY.value = clamped.y;
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onTouchesMove((_, state) => {
      if (scale.value > 1) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      const clamped = clampTranslation(
        scale.value,
        translateX.value,
        translateY.value,
        viewportWShared.value,
        viewportHShared.value,
      );
      translateX.value = withTiming(clamped.x);
      translateY.value = withTiming(clamped.y);
      savedX.value = clamped.x;
      savedY.value = clamped.y;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > 1.05) {
        resetZoom(scale, savedScale, translateX, translateY, savedX, savedY);
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value <= 1.05) {
        runOnJS(onClose)();
      }
    });

  const composed = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, singleTap),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: scrimColor }}>
          <View
            style={{
              flex: 1,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }}
          >
            <View
              style={{
                height: headerHeight,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: PAGE_H_PAD,
              }}
            >
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={({ pressed }) => [
                  {
                    width: CLOSE_HIT,
                    height: CLOSE_HIT,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View
                  style={{
                    width: CLOSE_HIT,
                    height: CLOSE_HIT,
                    borderRadius: CLOSE_HIT / 2,
                    backgroundColor: closeBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={22} color={colors.onDark} weight="bold" />
                </View>
              </Pressable>
            </View>

            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {uri ? (
                <GestureDetector gesture={composed}>
                  <Animated.View
                    style={[
                      {
                        width: viewportW,
                        height: viewportH,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                      animatedStyle,
                    ]}
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: viewportW, height: viewportH }}
                      contentFit="contain"
                      accessibilityLabel="Zoomed image"
                    />
                  </Animated.View>
                </GestureDetector>
              ) : null}
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
