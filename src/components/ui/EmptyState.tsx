import React from 'react';
import { View, type ViewStyle } from 'react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { Tray } from 'phosphor-react-native';

import { useAppTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/ThemedText';
import { fontFamily } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

type ButtonVariant = React.ComponentProps<typeof Button>['variant'];

export type EmptyStateAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
};

export interface EmptyStateProps {
  icon?: PhosphorIcon;
  title: string;
  description?: string;
  /** Raccourci pour une action principale unique */
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  /** Actions optionnelles (boutons empilés) */
  actions?: EmptyStateAction[];
  /** Padding et icône réduits — panneaux compacts (ex. bottom sheet carte) */
  compact?: boolean;
  style?: ViewStyle;
}

function resolveActions({
  actions,
  actionLabel,
  onAction,
  actionVariant,
}: Pick<EmptyStateProps, 'actions' | 'actionLabel' | 'onAction' | 'actionVariant'>): EmptyStateAction[] {
  if (actions && actions.length > 0) return actions;
  if (actionLabel && onAction) {
    return [{ label: actionLabel, onPress: onAction, variant: actionVariant ?? 'primary' }];
  }
  return [];
}

/**
 * État vide réutilisable — icône, titre, description et actions optionnelles.
 */
export function EmptyState({
  icon: IconComponent = Tray,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant,
  actions,
  compact = false,
  style,
}: EmptyStateProps) {
  const { colors } = useAppTheme();
  const resolvedActions = resolveActions({ actions, actionLabel, onAction, actionVariant });
  const iconCircle = compact ? 56 : 72;
  const iconSize = compact ? 24 : 32;

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: compact ? Spacing.eight : Spacing.fifteen,
          paddingHorizontal: compact ? Spacing.five : Spacing.seven,
        },
        style,
      ]}
    >
      <View
        style={{
          width: iconCircle,
          height: iconCircle,
          borderRadius: Radius.full,
          backgroundColor: colors.iconWash,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: compact ? Spacing.three : Spacing.four,
        }}
      >
        <IconComponent size={iconSize} color={colors.ink} weight="regular" />
      </View>

      <Text
        variant={compact ? 'body' : 'featureHeading'}
        style={{
          color: colors.ink,
          textAlign: 'center',
          marginBottom: description ? Spacing.two : resolvedActions.length ? Spacing.four : 0,
          ...(compact
            ? {
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 16,
                lineHeight: 22,
              }
            : {}),
        }}
      >
        {title}
      </Text>

      {description ? (
        <Text
          variant="body"
          style={{
            color: colors.muted,
            textAlign: 'center',
            marginBottom: resolvedActions.length ? Spacing.four : 0,
          }}
        >
          {description}
        </Text>
      ) : null}

      {resolvedActions.length > 0 ? (
        <View style={{ width: '100%', maxWidth: 320, gap: Spacing.two, alignItems: 'stretch' }}>
          {resolvedActions.map((action) => (
            <Button
              key={action.label}
              title={action.label}
              onPress={action.onPress}
              variant={action.variant ?? 'primary'}
              loading={action.loading}
              icon={action.icon}
              fullWidth
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
