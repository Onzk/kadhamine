import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { fontFamily } from '@/theme/typography';

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
        paddingVertical: 48,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.surfaceStrong,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon size={32} color={colors.muted} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: colors.ink,
          textAlign: 'center',
          marginBottom: 8,
          fontFamily: fontFamily('semiBold'),
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: 14,
            color: colors.muted,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 20,
            fontFamily: fontFamily('regular'),
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" />
      )}
    </View>
  );
}
