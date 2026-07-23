import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

interface SatelliteButtonProps {
  onPress?: () => void;
  size?: number;
}

/** White circular micro-CTA docked on portrait cards — DESIGN.md */
export function SatelliteButton({ onPress, size = 52 }: SatelliteButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceCard,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 0.1,
          borderColor: colors.ink,
        }}
      >
        <ArrowRight size={20} color={colors.ink} weight="bold" />
      </View>
    </Pressable>
  );
}
