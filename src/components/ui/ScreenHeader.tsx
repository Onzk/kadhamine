import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/providers/ThemeProvider';
import { textStyle } from '@/theme/typography';
import { Radius, Shadows, Spacing } from '@/theme/tokens';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack, rightAction }: ScreenHeaderProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: Spacing.three,
        paddingBottom: Spacing.three,
        paddingHorizontal: Spacing.four,
        backgroundColor: colors.canvas,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          borderRadius: Radius.pill,
          paddingVertical: Spacing.two,
          paddingHorizontal: Spacing.four,
          ...Shadows.nav,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.two }}>
          {showBack && (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surfaceStrong,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <CaretLeft size={20} color={colors.ink} weight="bold" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[textStyle('featureHeading'), { color: colors.ink }]}>{title}</Text>
            {subtitle && (
              <Text style={[textStyle('caption'), { color: colors.muted, marginTop: 2 }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
  );
}
