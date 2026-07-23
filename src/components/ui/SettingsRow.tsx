import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CaretRight, type IconProps } from 'phosphor-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

type PhosphorIcon = React.ComponentType<IconProps>;

export interface SettingsRowProps {
  icon: PhosphorIcon;
  iconBgColor?: string;
  title: string;
  description?: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  accessibilityHint?: string;
}

export function SettingsRow({
  icon: Icon,
  iconBgColor,
  title,
  description,
  onPress,
  destructive = false,
  showChevron = true,
  accessibilityHint,
}: SettingsRowProps) {
  const { colors, isDark } = useAppTheme();

  const iconFg = destructive ? colors.error : colors.onOrbit;
  const bg =
    iconBgColor ??
    (destructive
      ? colors.error + '18'
      : isDark
        ? colors.surfaceStrong
        : colors.orbit);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint ?? description}
      style={({ pressed }) => ({
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: Spacing.three + 2,
          paddingHorizontal: Spacing.four,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: Radius.md,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.three,
          }}
        >
          <Icon size={20} color={iconFg} weight="bold" />
        </View>

        <View style={{ flex: 1, minWidth: 0, paddingRight: Spacing.two }}>
          <Text
            numberOfLines={1}
            style={[
              textStyle('body'),
              {
                fontWeight: '600',
                color: destructive ? colors.error : colors.ink,
              },
            ]}
          >
            {title}
          </Text>
          {description ? (
            <Text
              numberOfLines={2}
              style={[
                textStyle('caption'),
                {
                  color: colors.muted,
                  marginTop: 3,
                  fontSize: 13.5,
                  lineHeight: 18,
                },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {showChevron ? <CaretRight size={16} color={colors.slate} weight="bold" /> : null}
      </View>
    </Pressable>
  );
}
