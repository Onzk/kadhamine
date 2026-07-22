import React from 'react';
import { Image, type ImageStyle, type StyleProp, type ViewStyle, View } from 'react-native';

type LogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

/** Logo TalentTchad — asset PNG officiel. */
export function Logo({ size = 64, style, imageStyle }: LogoProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={[{ width: size, height: size, resizeMode: 'contain' }, imageStyle]}
        accessibilityLabel="TalentTchad"
      />
    </View>
  );
}
