import React from 'react';
import { FlutterFab, type FlutterFabProps } from '@/components/ui/FlutterFab';

export type FabButtonProps = {
  onPress: () => void;
  /** Conservé pour compat — non affiché (FAB icône seule). */
  text?: string;
  iconText: string;
  backgroundColor?: string;
  textColor?: string;
  bottom?: number;
  right?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/**
 * Alias → `FlutterFab` icône seule (Material Flutter).
 */
export function FabButton({
  onPress,
  text,
  iconText,
  backgroundColor,
  textColor,
  bottom,
  right,
  disabled,
  accessibilityLabel,
}: FabButtonProps) {
  return (
    <FlutterFab
      absolute
      onPressed={disabled ? null : onPress}
      icon={iconText}
      backgroundColor={backgroundColor}
      foregroundColor={textColor}
      disabled={disabled}
      bottom={bottom}
      right={right}
      accessibilityLabel={accessibilityLabel ?? text ?? 'Action'}
    />
  );
}

export default FabButton;

export type { FlutterFabProps };
