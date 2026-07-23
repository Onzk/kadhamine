import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  StatusBar,
  type ListRenderItem,
} from 'react-native';
import { Plus } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlutterFab } from '@/components/ui/FlutterFab';
import { useAppTheme } from '@/providers/ThemeProvider';

type DemoRow = { id: string; title: string; subtitle: string };

const DATA: DemoRow[] = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  title: `Élément ${i + 1}`,
  subtitle: 'Exemple de liste — FAB icône seule (Flutter Material).',
}));

/** Démo — FlutterFab icône seule. Route : /fab-demo */
export default function FabDemoScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const renderItem: ListRenderItem<DemoRow> = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.ink }]}>{item.title}</Text>
      <Text style={[styles.cardSub, { color: colors.muted }]}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Flutter FAB</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Icône seule — r16, élévation 6 → 12.
        </Text>
      </View>

      <FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      />

      <FlutterFab
        absolute
        onPressed={() => {}}
        icon={<Plus size={24} color={colors.onPrimary} weight="bold" />}
        accessibilityLabel="Ajouter"
        backgroundColor={colors.orbit}
        foregroundColor={colors.onPrimary}
        bottom={Math.max(insets.bottom, 8) + 16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 18,
  },
});
