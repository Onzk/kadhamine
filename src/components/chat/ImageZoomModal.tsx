import React, { useEffect } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/theme/tokens';

type ImageZoomModalProps = {
  uri: string | null;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

/**
 * Full-screen lightbox with pinch-to-zoom, pan when zoomed, double-tap toggle.
 */
export function ImageZoomModal({ uri, onClose }: ImageZoomModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

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

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      } else {
        scale.value = withTiming(2.2);
        savedScale.value = 2.2;
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
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
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.94)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [
            {
              position: 'absolute',
              top: insets.top + Spacing.two,
              right: Spacing.four,
              zIndex: 2,
              width: 44,
              height: 44,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} color="#FFFFFF" weight="bold" />
          </View>
        </Pressable>

        {uri ? (
          <GestureDetector gesture={composed}>
            <Animated.View
              style={[
                {
                  width,
                  height,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                animatedStyle,
              ]}
            >
              <Image
                source={{ uri }}
                style={{ width, height: height * 0.78 }}
                contentFit="contain"
                accessibilityLabel="Zoomed image"
              />
            </Animated.View>
          </GestureDetector>
        ) : null}
      </View>
    </Modal>
  );
}
