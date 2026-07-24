import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { Check } from 'phosphor-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

type Option = { id: string; label: string };

type Props = {
  title: string;
  subtitle?: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
};

/** Options à cocher — sans card / border / padding de conteneur. */
export function ReviewTagPicker({ title, subtitle, options, selected, onChange }: Props) {
  const { colors } = useAppTheme();

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <View style={{ gap: Spacing.four }}>
      <View style={{ gap: Spacing.one }}>
        <Text
          style={{
            fontFamily: fontFamily('body', 'medium'),
            fontSize: 15,
            color: colors.ink,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[textStyle('caption'), { color: colors.muted, lineHeight: 18 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: Spacing.four }}>
        {options.map((opt) => {
          const on = selected.includes(opt.id);
          return (
            <Pressable
              key={opt.id}
              onPress={() => toggle(opt.id)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: Spacing.three,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    marginTop: 2,
                    borderRadius: Radius.xs,
                    borderWidth: BorderWidth.default,
                    borderColor: on ? colors.orbit : colors.borderStrong,
                    backgroundColor: on ? colors.orbit : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {on ? <Check size={14} color={colors.onOrbit} weight="bold" /> : null}
                </View>
                <Text
                  style={[
                    textStyle('body'),
                    { color: colors.ink, flex: 1, lineHeight: 22, fontSize: 15 },
                  ]}
                >
                  {opt.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
