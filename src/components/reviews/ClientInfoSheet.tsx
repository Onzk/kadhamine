import React from 'react';
import { View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { useQuery } from 'convex/react';
import type { Id } from '../../../convex/_generated/dataModel';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Text } from '@/components/ui/ThemedText';
import { StarRating } from '@/components/ui/StarRating';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

type Props = {
  visible: boolean;
  onClose: () => void;
  clientId: Id<'users'> | null;
};

export function ClientInfoSheet({ visible, onClose, clientId }: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const data = useQuery(
    api.reviews.getClientPublicRatingForProvider,
    visible && clientId ? { clientId } : 'skip',
  );

  const categoryName = (cat: {
    nameFr: string;
    nameAr?: string;
    nameSara?: string;
  } | null) => {
    if (!cat) return t('provider.anonymousClient');
    if (i18n.language === 'ar' && cat.nameAr) return cat.nameAr;
    if (i18n.language === 'sara' && cat.nameSara) return cat.nameSara;
    return cat.nameFr;
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title={t('reviews.clientInfoTitle')}
      subtitle={t('reviews.clientInfoSubtitle')}
    >
      <ScrollView
        style={{ maxHeight: 420 }}
        contentContainerStyle={{ gap: Spacing.four, paddingBottom: Spacing.six }}
        showsVerticalScrollIndicator={false}
      >
        {!data ? (
          <Text style={[textStyle('body'), { color: colors.muted, textAlign: 'center' }]}>
            {t('common.loading')}
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  overflow: 'hidden',
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {data.avatarUrl ? (
                  <Image
                    source={{ uri: data.avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <Text
                    style={{
                      fontFamily: fontFamily('body', 'medium'),
                      fontSize: 20,
                      color: colors.ink,
                    }}
                  >
                    {(data.name ?? '?').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 17,
                    color: colors.ink,
                  }}
                >
                  {data.name ?? t('provider.anonymousClient')}
                </Text>
                {data.city ? (
                  <Text style={[textStyle('caption'), { color: colors.muted }]}>
                    {[data.city, data.region].filter(Boolean).join(', ')}
                  </Text>
                ) : null}
                {(data.clientReviewCount ?? 0) > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <StarRating rating={data.clientAverageRating ?? 0} size={14} />
                    <Text style={[textStyle('micro'), { color: colors.muted }]}>
                      {data.clientAverageRating?.toFixed(1)} · {data.clientReviewCount}
                    </Text>
                  </View>
                ) : (
                  <Text style={[textStyle('micro'), { color: colors.muted }]}>
                    {t('reviews.noClientReviews')}
                  </Text>
                )}
              </View>
            </View>

            {data.reviews.length === 0 ? null : (
              <View style={{ gap: Spacing.three }}>
                {data.reviews.map((r) => (
                  <View
                    key={r._id}
                    style={{
                      padding: Spacing.three,
                      borderRadius: Radius.md,
                      backgroundColor: colors.surfaceStrong,
                      borderWidth: BorderWidth.default,
                      borderColor: colors.border,
                      gap: Spacing.two,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={[textStyle('caption'), { color: colors.orbit }]}>
                        {categoryName(r.category)}
                      </Text>
                      <StarRating rating={r.rating} size={12} />
                    </View>
                    {r.comment ? (
                      <Text style={[textStyle('body'), { color: colors.body }]}>{r.comment}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </AppBottomSheet>
  );
}
