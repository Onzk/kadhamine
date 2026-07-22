import React from 'react';
import { View } from 'react-native';
import { ShieldCheck, CreditCard, SealCheck, type Icon as PhosphorIcon } from 'phosphor-react-native';

import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/tokens';

interface TrustItem {
  icon: PhosphorIcon;
  title: string;
  caption: string;
}

const ITEMS: TrustItem[] = [
  { icon: ShieldCheck, title: 'Vérifiés', caption: 'Talents contrôlés' },
  { icon: CreditCard, title: 'Sécurisé', caption: 'Paiement FedaPay' },
  { icon: SealCheck, title: 'Fiable', caption: 'Avis officiels' },
];

/** Bande de réassurance — 3 promesses de la marketplace. */
export function TrustStrip() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        marginHorizontal: Spacing.four,
        flexDirection: 'row',
        borderRadius: Radius.lg,
        backgroundColor: colors.surfaceCard,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingVertical: Spacing.four,
      }}
    >
      {ITEMS.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <View
            key={item.title}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingHorizontal: Spacing.two,
              borderLeftWidth: index === 0 ? 0 : 1,
              borderLeftColor: colors.border,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.iconWash,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.two,
              }}
            >
              <IconComponent size={20} color={colors.ink} weight="bold" />
            </View>
            <Text
              style={[
                textStyle('caption'),
                { fontFamily: fontFamily('body', 'medium'), color: colors.ink },
              ]}
            >
              {item.title}
            </Text>
            <Text style={[textStyle('micro'), { color: colors.muted, textAlign: 'center' }]}>
              {item.caption}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
