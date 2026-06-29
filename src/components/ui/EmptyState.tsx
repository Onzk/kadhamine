import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '📭', title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>{icon}</Text>
      <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink, textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" />
      )}
    </View>
  );
}
