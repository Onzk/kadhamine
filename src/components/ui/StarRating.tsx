import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ rating, size = 16, showValue }: StarRatingProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          color={colors.accent}
          fill={star <= Math.round(rating) ? colors.accent : 'transparent'}
        />
      ))}
      {showValue && (
        <Text style={{ fontSize: size - 2, fontWeight: '600', color: colors.ink, marginLeft: 4 }}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
