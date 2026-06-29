import React from 'react';
import { Pressable, Text } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

interface CategoryChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ label, icon, selected, onPress }: CategoryChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 9999,
        backgroundColor: selected ? colors.primary : colors.surfaceCard,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        opacity: pressed ? 0.85 : 1,
        marginRight: 8,
      })}
    >
      {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
      <Text
        style={{
          fontSize: 13,
          fontWeight: selected ? '600' : '500',
          color: selected ? colors.onPrimary : colors.body,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
