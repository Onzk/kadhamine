import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

/** White on brand blue — `onPrimary` flips dark in dark theme, so we force white for the blue fill. */
const ON_ORBIT = '#FFFFFF';

export type PillOption = { label: string; value: string };

type PillOptions = readonly string[] | readonly PillOption[];

function normalize(options: PillOptions): PillOption[] {
  return options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );
}

interface PillGroupBaseProps {
  /** List of options — plain strings or `{ label, value }`. */
  options: PillOptions;
  /** Style for the wrapping container. */
  style?: StyleProp<ViewStyle>;
  /** Accessible group label. */
  accessibilityLabel?: string;
}

interface SinglePillGroupProps extends PillGroupBaseProps {
  multiple?: false;
  /** Currently selected value (single-select). */
  value: string | null | undefined;
  onChange: (value: string) => void;
}

interface MultiPillGroupProps extends PillGroupBaseProps {
  multiple: true;
  /** Currently selected values (multi-select). */
  value: readonly string[];
  onChange: (value: string[]) => void;
}

export type PillGroupProps = SinglePillGroupProps | MultiPillGroupProps;

/**
 * Reusable pill/capsule group. Pills wrap to the next line automatically and
 * never touch thanks to `gap`. Selected = brand fill (orbit) + white text;
 * inactive = pastel/light-grey surface + dark text. Theme-aware (light + dark).
 */
export function PillGroup(props: PillGroupProps) {
  const { options, style, accessibilityLabel } = props;
  const { colors } = useAppTheme();
  const items = normalize(options);

  const isSelected = useCallback(
    (val: string) =>
      props.multiple ? props.value.includes(val) : props.value === val,
    [props],
  );

  const handlePress = useCallback(
    (val: string) => {
      if (props.multiple) {
        const set = new Set(props.value);
        if (set.has(val)) set.delete(val);
        else set.add(val);
        props.onChange(Array.from(set));
      } else {
        props.onChange(val);
      }
    },
    [props],
  );

  return (
    <View
      style={[styles.group, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {items.map((item) => {
        const selected = isSelected(item.value);
        return (
          <Pressable
            key={item.value}
            onPress={() => handlePress(item.value)}
            accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: selected ? colors.orbit : colors.surfaceStrong,
                  borderColor: selected ? colors.orbit : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  textStyle('caption'),
                  styles.label,
                  { color: selected ? ON_ORBIT : colors.ink },
                ]}
              >
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.two,
    columnGap: Spacing.two,
  },
  pill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 0.1,
  },
  label: {
    fontFamily: fontFamily('body', 'medium'),
  },
});
