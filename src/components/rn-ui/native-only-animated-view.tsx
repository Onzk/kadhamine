import { Platform, type ViewProps } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';

/**
 * Animated view that only applies entering/exiting animations on native.
 */
function NativeOnlyAnimatedView(props: AnimatedProps<ViewProps>) {
  if (Platform.OS === 'web') {
    return <>{props.children as React.ReactNode}</>;
  }
  return <Animated.View {...props} />;
}

export { NativeOnlyAnimatedView };
