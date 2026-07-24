import React, { useState } from 'react';
import { View, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native';
import { Image, type ImageProps } from 'expo-image';

import { reportError } from '@/lib/reportError';
import { useAppTheme } from '@/providers/ThemeProvider';

type Props = Omit<ImageProps, 'style'> & {
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  fallback?: React.ReactNode;
};

/**
 * Image qui ne fait pas planter l’écran si l’URI est invalide / réseau HS.
 */
export function SafeImage({ style, containerStyle, fallback, onError, ...rest }: Props) {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);

  if (failed || !rest.source) {
    if (fallback) return <>{fallback}</>;
    return (
      <View
        style={[
          { backgroundColor: colors.iconWash },
          style as StyleProp<ViewStyle>,
          containerStyle,
        ]}
      />
    );
  }

  return (
    <Image
      {...rest}
      style={style}
      onError={(event) => {
        setFailed(true);
        reportError(event, { context: 'SafeImage', severity: 'warning' });
        onError?.(event);
      }}
    />
  );
}
