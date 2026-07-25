import React from 'react';
import { Text, View } from 'react-native';

import { Enter } from '@/components/ui/Enter';
import type { WithEnterIndex } from '@/components/ui/enterIndex';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

interface SettingsSectionProps extends WithEnterIndex {
  title?: string;
  children: React.ReactNode;
  /** Extra margin above the section. Default true. */
  spaced?: boolean;
}

export function SettingsSection({
  title,
  children,
  spaced = true,
  enterIndex = 0,
}: SettingsSectionProps) {
  const { colors } = useAppTheme();

  return (
    <Enter
      variant="section"
      index={enterIndex}
      style={{ marginTop: spaced ? Spacing.six : 0, marginBottom: Spacing.three }}
    >
      {title ? (
        <Text
          style={[
            textStyle('micro'),
            {
              color: colors.slate,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.7,
              marginBottom: Spacing.twoHalf,
              paddingHorizontal: Spacing.one,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: colors.surfaceCard,
          borderRadius: Radius.lg,
          borderWidth: 0.1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        {React.Children.toArray(children).map((child, index, arr) => (
          <React.Fragment key={index}>
            {child}
            {index < arr.length - 1 ? (
              <View
                style={{
                  alignSelf: 'stretch',
                  borderTopWidth: 0.1,
                  borderTopColor: colors.border,
                }}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </Enter>
  );
}
