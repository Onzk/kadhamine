import {
  Smiley,
  SmileyMeh,
  SmileySad,
  SmileySticker,
  SmileyXEyes,
  type Icon,
} from 'phosphor-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { RATING_EXPRESSIONS } from '@/constants/reviews';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

const ICONS: Record<(typeof RATING_EXPRESSIONS)[number]['icon'], Icon> = {
  SmileyXEyes,
  SmileySad,
  SmileyMeh,
  Smiley,
  SmileySticker,
};

/** Côté max d’une case : l’espace réservé ne varie pas avec la sélection. */
const CELL_MAX = 56;
/** La case non sélectionnée est rétrécie dans son carré (pas d’agrandissement hors flux). */
const UNSELECTED_RATIO = 0.88;

type Props = {
  value: number;
  onChange: (rating: number) => void;
  labels?: string[];
};

/**
 * Échelle d’expérience 1–5 : le libellé de la seule option sélectionnée est
 * affiché sur toute la largeur (évite les mots débordants en colonnes étroites).
 */
export function ExpressionRating({ value, onChange, labels }: Props) {
  const { colors } = useAppTheme();

  const selectedItem = RATING_EXPRESSIONS.find((item) => item.value === value);
  const selectedLabel = selectedItem
    ? (labels?.[selectedItem.value - 1] ?? selectedItem.labelFr)
    : '';

  return (
    <View style={{ gap: Spacing.one }}>
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        {RATING_EXPRESSIONS.map((item) => {
          const IconComp = ICONS[item.icon];
          const selected = value === item.value;
          const label = labels?.[item.value - 1] ?? item.labelFr;

          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                { flex: 1, opacity: pressed && !selected ? 0.88 : 1 },
              ]}
            >
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: '100%',
                    maxWidth: CELL_MAX,
                    aspectRatio: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: selected ? '100%' : `${UNSELECTED_RATIO * 100}%`,
                      height: selected ? '100%' : `${UNSELECTED_RATIO * 100}%`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: Radius.md,
                      backgroundColor: selected ? `${item.color}1F` : colors.surfaceStrong,
                      borderWidth: selected ? 2 : BorderWidth.default,
                      borderColor: selected ? item.color : colors.borderStrong,
                    }}
                  >
                    <IconComp
                      size={selected ? 28 : 24}
                      color={selected ? item.color : colors.ink}
                      weight={selected ? 'fill' : 'regular'}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ minHeight: 20, justifyContent: 'center' }}>
        <Text
          numberOfLines={1}
          style={[
            textStyle('caption'),
            {
              textAlign: 'center',
              color: selectedItem ? selectedItem.color : colors.muted,
              fontFamily: fontFamily('body', 'medium'),
            },
          ]}
        >
          {selectedLabel}
        </Text>
      </View>
    </View>
  );
}
