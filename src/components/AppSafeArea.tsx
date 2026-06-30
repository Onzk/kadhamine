import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/ThemeProvider';

interface AppSafeAreaProps extends ViewProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function AppSafeArea({
  children,
  edges = ['top', 'bottom'],
  style,
  ...props
}: AppSafeAreaProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;
  const paddingLeft = edges.includes('left') ? insets.left : 0;
  const paddingRight = edges.includes('right') ? insets.right : 0;

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.canvas,
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
  );
}
