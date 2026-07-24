import React from 'react';
import { View, Text } from 'react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors, Radius } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'cancelled' | string;

/**
 * Couleurs solides (sans alpha), distinctes par statut, adaptées jour / nuit.
 * - pending   → ambre (attente)
 * - accepted  → bleu orbit (en cours)
 * - completed → vert (terminé)
 * - cancelled → rouge (annulé)
 */
export function orderStatusColors(
  status: OrderStatus,
  isDark: boolean,
): { bg: string; text: string } {
  switch (status) {
    case 'pending':
      return isDark
        ? { bg: '#F59E0B', text: BrandColors.ink }
        : { bg: '#D97706', text: '#FFFFFF' };
    case 'accepted':
      return isDark
        ? { bg: '#06B6D4', text: BrandColors.ink }
        : { bg: BrandColors.orbit, text: '#FFFFFF' };
    case 'completed':
      return isDark
        ? { bg: '#12B76A', text: '#FFFFFF' }
        : { bg: '#027A48', text: '#FFFFFF' };
    case 'cancelled':
      return { bg: BrandColors.crimson, text: '#FFFFFF' };
    default:
      return isDark
        ? { bg: '#3F3F46', text: '#FFFFFF' }
        : { bg: '#57534E', text: '#FFFFFF' };
  }
}

export function OrderStatusBadge({
  label,
  status,
}: {
  label: string;
  status: OrderStatus;
}) {
  const { isDark } = useAppTheme();
  const { bg, text } = orderStatusColors(status, isDark);

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={[
          textStyle('micro'),
          { fontFamily: fontFamily('body', 'medium'), color: text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
