import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/providers/ThemeProvider';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack, rightAction }: ScreenHeaderProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.canvas,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
          {showBack && (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.surfaceCard,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ChevronLeft size={20} color={colors.ink} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{title}</Text>
            {subtitle && (
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{subtitle}</Text>
            )}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
  );
}
