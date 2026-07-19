import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.fifteen,
        paddingHorizontal: Spacing.seven,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: Radius.lg,
          backgroundColor: colors.surfaceCard,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.four,
        }}
      >
        <Icon size={32} color={colors.muted} strokeWidth={1.5} />
      </View>
      <Text style={[textStyle('featureHeading'), { color: colors.ink, textAlign: 'center', marginBottom: Spacing.two }]}>
        {title}
      </Text>
      {description && (
        <Text
          style={[
            textStyle('body'),
            { color: colors.muted, textAlign: 'center', marginBottom: Spacing.five },
          ]}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" />
      )}
    </View>
  );
}
