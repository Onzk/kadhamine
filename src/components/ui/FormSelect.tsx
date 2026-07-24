import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CaretDown, CaretUp, Check } from 'phosphor-react-native';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

export type FormSelectOption = {
  value: string;
  label: string;
};

interface FormSelectProps {
  label: string;
  placeholder: string;
  options: FormSelectOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  /** Allow clearing selection (shows a “none” row). */
  clearable?: boolean;
  clearLabel?: string;
  sheetTitle?: string;
  sheetSubtitle?: string;
  disabled?: boolean;
  /**
   * `sheet` opens AppBottomSheet (default).
   * `inline` expands options under the field — use inside another bottom sheet.
   */
  variant?: 'sheet' | 'inline';
}

/**
 * Field-like select. Selected row uses orbit accent (logo blue / night cyan).
 */
export function FormSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  clearable = false,
  clearLabel,
  sheetTitle,
  sheetSubtitle,
  disabled = false,
  variant = 'sheet',
}: FormSelectProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (value == null || value === '') return null;
    return options.find((o) => o.value === value)?.label ?? null;
  }, [options, value]);

  const display = selectedLabel ?? placeholder;
  const isPlaceholder = selectedLabel == null;

  const pick = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  const optionRows = (
    <>
      {clearable ? (
        <Pressable
          onPress={() => pick(null)}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: Spacing.four,
              paddingHorizontal: Spacing.three,
              borderRadius: Radius.md,
              backgroundColor: value == null ? colors.orbitWash : 'transparent',
              marginBottom: Spacing.one,
            }}
          >
            <Text
              style={[
                textStyle('body'),
                {
                  color: colors.ink,
                  fontWeight: value == null ? '600' : '400',
                },
              ]}
            >
              {clearLabel ?? placeholder}
            </Text>
            {value == null ? <Check size={18} color={colors.orbit} weight="bold" /> : null}
          </View>
        </Pressable>
      ) : null}

      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => pick(opt.value)}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: Spacing.four,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.md,
                backgroundColor: selected ? colors.orbitWash : 'transparent',
                marginBottom: Spacing.one,
              }}
            >
              <Text
                style={[
                  textStyle('body'),
                  {
                    color: colors.ink,
                    fontWeight: selected ? '600' : '400',
                    flex: 1,
                    marginRight: Spacing.two,
                  },
                ]}
              >
                {opt.label}
              </Text>
              {selected ? <Check size={18} color={colors.orbit} weight="bold" /> : null}
            </View>
          </Pressable>
        );
      })}
    </>
  );

  return (
    <View style={{ marginBottom: Spacing.three }}>
      <Text
        style={[
          textStyle('caption'),
          {
            fontFamily: fontFamily('body', 'medium'),
            color: colors.ink,
            marginBottom: Spacing.two,
          },
        ]}
      >
        {label}
      </Text>

      <Pressable
        onPress={() => {
          if (disabled) return;
          if (variant === 'inline') setOpen((v) => !v);
          else setOpen(true);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        })}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: 52,
            paddingHorizontal: Spacing.four,
            backgroundColor: colors.surfaceCard,
            borderRadius: 12,
            borderWidth: 0.1,
            borderColor: open ? colors.orbit : colors.borderStrong,
            gap: Spacing.two,
          }}
        >
          <Text
            style={[
              textStyle('body'),
              {
                flex: 1,
                color: isPlaceholder ? colors.muted : colors.ink,
              },
            ]}
            numberOfLines={1}
          >
            {display}
          </Text>
          {open ? (
            <CaretUp size={18} color={colors.orbit} weight="bold" />
          ) : (
            <CaretDown size={18} color={colors.muted} weight="bold" />
          )}
        </View>
      </Pressable>

      {variant === 'inline' && open ? (
        <View
          style={{
            marginTop: Spacing.two,
            padding: Spacing.three,
            borderRadius: 12,
            backgroundColor: colors.surfaceCard,
            borderWidth: 0.1,
            borderColor: colors.border,
          }}
        >
          {optionRows}
        </View>
      ) : null}

      {variant === 'sheet' ? (
        <AppBottomSheet
          visible={open}
          onClose={() => setOpen(false)}
          title={sheetTitle ?? label}
          subtitle={sheetSubtitle}
        >
          {optionRows}
        </AppBottomSheet>
      ) : null}
    </View>
  );
}
