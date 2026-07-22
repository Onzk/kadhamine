import React from 'react';
import { View } from 'react-native';
import { Crown } from 'phosphor-react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { CategoryIcon } from '@/lib/categoryIcons';
import { BrandColors } from '@/theme/tokens';

interface TalentMapPinProps {
  categoryIcon?: string;
  isPremium?: boolean;
  selected?: boolean;
}

/** Pin goutte — médaillon catégorie + pointe, liseré or si Premium. */
export function TalentMapPin({ categoryIcon, isPremium, selected }: TalentMapPinProps) {
  const { colors } = useAppTheme();
  const size = selected ? 48 : 40;
  const tip = selected ? 12 : 10;

  return (
    <View style={{ alignItems: 'center', width: size + 8 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.orbit,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isPremium ? 3 : 2,
          borderColor: isPremium ? BrandColors.gold : colors.surfaceCard,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        }}
      >
        <CategoryIcon icon={categoryIcon} size={selected ? 22 : 18} color={colors.onPrimary} weight="bold" />
        {isPremium ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: BrandColors.gold,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: colors.surfaceCard,
            }}
          >
            <Crown size={10} color={colors.ink} weight="fill" />
          </View>
        ) : null}
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          marginTop: -2,
          borderLeftWidth: tip * 0.7,
          borderRightWidth: tip * 0.7,
          borderTopWidth: tip,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: colors.orbit,
        }}
      />
    </View>
  );
}
