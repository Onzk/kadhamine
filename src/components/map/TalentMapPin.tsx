import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { useAppTheme } from '@/providers/ThemeProvider';
import { BrandColors } from '@/theme/tokens';

interface TalentMapPinProps {
  categoryIcon?: string;
  categoryLabel?: string;
  isPremium?: boolean;
  selected?: boolean;
}

/** Dimensions fixes — ancrées en bas (anchor y:1). */
export const PIN_WIDTH = 56;
export const PIN_HEIGHT = 68;

const TIP_Y = PIN_HEIGHT;
const TIP_BASE_Y = PIN_HEIGHT - 10;
const ON_ORBIT = '#FFFFFF';

function pinGeometry(selected: boolean) {
  const r = selected ? 22 : 18;
  const cx = PIN_WIDTH / 2;
  const cy = TIP_BASE_Y - r;
  return { r, cx, cy };
}

/**
 * Pin carte en SVG unique — évite le snapshot partiel des vues RN / icônes Phosphor
 * dans react-native-maps (Android surtout).
 */
export function TalentMapPin({
  categoryLabel,
  isPremium,
  selected = false,
}: TalentMapPinProps) {
  const { colors } = useAppTheme();
  const orbit = colors.orbit;
  const ring = selected ? BrandColors.canvas : colors.surfaceCard;
  const { r, cx, cy } = pinGeometry(selected);
  const initial = (categoryLabel?.trim() || '?').charAt(0).toUpperCase();
  const fontSize = selected ? 15 : 13;

  return (
    <View
      collapsable={false}
      style={{ width: PIN_WIDTH, height: PIN_HEIGHT, backgroundColor: 'transparent' }}
    >
      <Svg width={PIN_WIDTH} height={PIN_HEIGHT} viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`}>
        {selected ? (
          <Circle cx={cx} cy={cy} r={28} fill={orbit} opacity={0.22} />
        ) : null}

        <Circle cx={cx} cy={cy} r={r} fill={orbit} stroke={ring} strokeWidth={selected ? 3 : 2} />

        {isPremium ? (
          <Circle
            cx={cx + r * 0.62}
            cy={cy - r * 0.62}
            r={8}
            fill={BrandColors.gold}
            stroke={BrandColors.canvas}
            strokeWidth={1.5}
          />
        ) : null}

        <SvgText
          x={cx}
          y={cy + fontSize * 0.35}
          fill={ON_ORBIT}
          fontSize={fontSize}
          fontWeight="700"
          textAnchor="middle"
        >
          {initial}
        </SvgText>

        <Path
          d={`M ${cx - 7} ${TIP_BASE_Y} L ${cx + 7} ${TIP_BASE_Y} L ${cx} ${TIP_Y} Z`}
          fill={orbit}
        />

        {selected ? (
          <Circle
            cx={cx}
            cy={TIP_Y - 3}
            r={4}
            fill={orbit}
            stroke={BrandColors.canvas}
            strokeWidth={2}
          />
        ) : null}
      </Svg>
    </View>
  );
}
