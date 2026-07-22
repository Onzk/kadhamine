import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';

/** Marge visuelle sous le safe area — évite que le contenu touche la barre système. */
const BOTTOM_EXTRA = Spacing.four;

interface AppSafeAreaProps extends ViewProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/**
 * Fond canvas plein écran (y compris sous la barre système),
 * puis contenu inseté à l'intérieur via safe area.
 */
export function AppSafeArea({
  children,
  edges = ['top', 'left', 'right', 'bottom'],
  style,
  ...props
}: AppSafeAreaProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom')
    ? Math.max(insets.bottom, Spacing.three) + BOTTOM_EXTRA
    : 0;
  const paddingLeft = edges.includes('left') ? insets.left : 0;
  const paddingRight = edges.includes('right') ? insets.right : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View
        style={[
          {
            flex: 1,
            paddingTop,
            paddingBottom,
            paddingLeft,
            paddingRight,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </View>
  );
}
