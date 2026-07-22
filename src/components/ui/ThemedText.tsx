import React from 'react';
import { Text as RNText, TextInput as RNTextInput, type TextProps, type TextInputProps } from 'react-native';
import { fontFamily, textStyle, type TypeScaleRole } from '@/theme/typography';

type ThemedTextProps = TextProps & {
  variant?: TypeScaleRole;
  display?: boolean;
};

export function Text({ style, variant, display, ...props }: ThemedTextProps) {
  const base = variant
    ? {
        ...textStyle(variant),
        ...(display ? { fontFamily: fontFamily('display') } : {}),
      }
    : { fontFamily: fontFamily(display ? 'display' : 'body') };
  return <RNText style={[base, style]} {...props} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput style={[{ fontFamily: fontFamily('body') }, style]} {...props} />;
}

interface TextLinkProps {
  title: string;
  onPress?: () => void;
  color?: string;
}

export function TextLink({ title, onPress, color }: TextLinkProps) {
  return (
    <RNText
      onPress={onPress}
      style={[
        textStyle('button'),
        {
          color: color ?? '#3860BE',
          textDecorationLine: 'underline',
        },
      ]}
    >
      {title}
    </RNText>
  );
}
