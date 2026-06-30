import React from 'react';
import { Text as RNText, TextInput as RNTextInput, type TextProps, type TextInputProps } from 'react-native';
import { fontFamily, type FontWeight } from '@/theme/typography';

type ThemedTextProps = TextProps & { weight?: FontWeight };

export function Text({ style, weight = 'regular', ...props }: ThemedTextProps) {
  return <RNText style={[{ fontFamily: fontFamily(weight) }, style]} {...props} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return (
    <RNTextInput style={[{ fontFamily: fontFamily('regular') }, style]} {...props} />
  );
}
