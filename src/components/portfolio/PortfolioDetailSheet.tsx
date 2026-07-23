import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CalendarBlank, Briefcase } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type PortfolioDetailItem = {
  _id: Id<'portfolio'>;
  title: string;
  description?: string | null;
  mediaType: 'image' | 'video' | 'document';
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  serviceId?: Id<'services'> | null;
  relatedService?: { _id: Id<'services'>; title: string } | null;
  createdAt: number;
};

export interface PortfolioDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  item: PortfolioDetailItem | null;
  onOpenService?: (serviceId: Id<'services'>) => void;
}

function formatDate(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

/** Bottom sheet — détail d'une réalisation portfolio. */
export function PortfolioDetailSheet({
  visible,
  onClose,
  item,
  onOpenService,
}: PortfolioDetailSheetProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const imageUri = item?.mediaUrl || item?.thumbnailUrl || null;
  const related = item?.relatedService;
  const relatedId = related?._id ?? item?.serviceId ?? null;

  return (
    <AppBottomSheet
      visible={visible && !!item}
      onClose={onClose}
      title={item?.title ?? t('portfolio.detailTitle')}
      subtitle={t('portfolio.detailSubtitle')}
      scrollable
      stickyHeader
      maxHeightRatio={0.88}
      contentContainerStyle={{ paddingBottom: Spacing.six }}
    >
      {item ? (
        <View style={{ gap: Spacing.four }}>
          {imageUri && item.mediaType === 'image' ? (
            <View
              style={{
                borderRadius: Radius.md,
                overflow: 'hidden',
                backgroundColor: colors.surfaceStrong,
                borderWidth: BorderWidth.default,
                borderColor: colors.border,
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', aspectRatio: 4 / 3 }}
                contentFit="cover"
              />
            </View>
          ) : imageUri ? (
            <View
              style={{
                borderRadius: Radius.md,
                padding: Spacing.five,
                backgroundColor: colors.surfaceStrong,
                borderWidth: BorderWidth.default,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={[textStyle('caption'), { color: colors.muted }]}>
                {item.mediaType === 'video'
                  ? t('portfolio.mediaVideo')
                  : t('portfolio.mediaDocument')}
              </Text>
            </View>
          ) : null}

          {item.description ? (
            <Text
              style={[
                textStyle('body'),
                { color: colors.ink, lineHeight: 24, fontSize: 15 },
              ]}
            >
              {item.description}
            </Text>
          ) : (
            <Text style={[textStyle('caption'), { color: colors.muted }]}>
              {t('portfolio.noDescription')}
            </Text>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.two,
            }}
          >
            <CalendarBlank size={16} color={colors.muted} />
            <Text style={[textStyle('caption'), { color: colors.muted }]}>
              {t('portfolio.publishedOn', {
                date: formatDate(item.createdAt, i18n.language),
              })}
            </Text>
          </View>

          {related && relatedId && onOpenService ? (
            <Pressable
              onPress={() => {
                onClose();
                onOpenService(relatedId);
              }}
              style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.9 : 1 }]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.three,
                  padding: Spacing.four,
                  borderRadius: Radius.md,
                  backgroundColor: colors.surfaceCard,
                  borderWidth: BorderWidth.default,
                  borderColor: colors.border,
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
                    borderWidth: BorderWidth.default,
                    borderColor: colors.border,
                  }}
                >
                  <Briefcase size={18} color={colors.ink} weight="bold" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      textStyle('micro'),
                      {
                        color: colors.muted,
                        fontFamily: fontFamily('body', 'medium'),
                        marginBottom: 2,
                      },
                    ]}
                  >
                    {t('portfolio.relatedService')}
                  </Text>
                  <Text
                    style={[
                      textStyle('caption'),
                      {
                        color: colors.ink,
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 14,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {related.title}
                  </Text>
                </View>
                <ArrowRight size={18} color={colors.ink} weight="bold" />
              </View>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </AppBottomSheet>
  );
}
