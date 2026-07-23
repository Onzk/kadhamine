import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/theme/tokens';

/** Conteneur actions bottom sheet — pleine largeur, empilement vertical. */
export function SheetActionsFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

/** Un seul bouton — occupe toute la largeur disponible. */
export function SheetSingleAction({ children }: { children: React.ReactNode }) {
  return <View style={styles.single}>{children}</View>;
}

/** Rangée d’actions — 50/50 si deux boutons. */
export function SheetActionRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/** Slot flex pour un bouton d’action (moitié de la rangée). */
export function SheetActionSlot({ children }: { children: React.ReactNode }) {
  return <View style={styles.slot}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: {
    alignSelf: 'stretch',
    width: '100%',
    gap: Spacing.three,
  },
  single: {
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'stretch',
    gap: Spacing.three,
  },
  slot: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignSelf: 'stretch',
    minHeight: 54,
  },
});
