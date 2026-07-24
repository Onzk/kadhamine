import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CaretRight, type IconProps } from 'phosphor-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

type PhosphorIcon = React.ComponentType<IconProps>;

export type SettingsRowBadgeTone = 'amber' | 'orbit';

export interface SettingsRowBadge {
  label: string;
  tone: SettingsRowBadgeTone;
}

export interface SettingsRowProps {
  icon: PhosphorIcon;
  iconBgColor?: string;
  title: string;
  /** Compact status / CTA pill shown right after the title. */
  badge?: SettingsRowBadge;
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
  badge,
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

  const badgeColors =
    badge?.tone === 'amber'
      ? {
          bg: isDark ? '#F59E0B22' : '#F59E0B1A',
          text: isDark ? '#FCD34D' : '#B45309',
          border: isDark ? '#F59E0B55' : '#F59E0B44',
        }
      : badge
        ? {
            bg: colors.orbitWash,
            text: colors.orbit,
            border: colors.orbit + '40',
          }
        : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${title}, ${badge.label}` : title}
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
              flexWrap: 'nowrap',
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                textStyle('body'),
                {
                  flexShrink: 1,
                  fontWeight: '600',
                  color: destructive ? colors.error : colors.ink,
                },
              ]}
            >
              {title}
            </Text>
            {badge && badgeColors ? (
              <View
                style={{
                  flexShrink: 0,
                  backgroundColor: badgeColors.bg,
                  borderColor: badgeColors.border,
                  borderWidth: 0.1,
                  borderRadius: Radius.pill,
                  paddingHorizontal: Spacing.two,
                  paddingVertical: 2,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 11,
                    lineHeight: 14,
                    color: badgeColors.text,
                  }}
                >
                  {badge.label}
                </Text>
              </View>
            ) : null}
          </View>
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
