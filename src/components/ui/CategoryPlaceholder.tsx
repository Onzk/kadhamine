import React from 'react';
import { View } from 'react-native';
import { Wrench } from 'lucide-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

interface CategoryPlaceholderProps {
  size?: number;
}

export function CategoryPlaceholder({ size = 40 }: CategoryPlaceholderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Wrench size={size} color={colors.muted} strokeWidth={1.5} />
    </View>
  );
}
