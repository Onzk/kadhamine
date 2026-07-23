import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProviderGrid } from '@/components/cards/ProviderGrid';
import { PageScaffold } from '@/components/ui/PageHeader';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { api } from '../../convex/_generated/api';

export default function TalentsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const talents = useQuery(api.profiles.listHome, { limit: 20 });

  const bottomPad = Math.max(insets.bottom, Spacing.three) + Spacing.six;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('talents.title')}
        subtitle={t('talents.subtitle')}
        showBack
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        <View style={{ marginTop: Spacing.two }}>
          <ProviderGrid
            items={talents}
            onPressProvider={(profileId) =>
              router.push({ pathname: '/provider/[id]', params: { id: profileId } })
            }
            emptyTitle={t('home.providersEmpty')}
            emptyDescription={t('home.providersEmptyDesc')}
          />
        </View>
      </PageScaffold>
    </View>
  );
}
