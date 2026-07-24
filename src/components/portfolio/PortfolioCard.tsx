import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  CalendarBlank,
  FileText,
  Images,
  PencilSimple,
  Trash,
  VideoCamera,
} from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type PortfolioCardItem = {
  _id: Id<'portfolio'>;
  title: string;
  description?: string | null;
  mediaType: 'image' | 'video' | 'document';
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  relatedService?: { _id: Id<'services'>; title: string } | null;
  createdAt: number;
};

function formatShortDate(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

function MediaPlaceholder({
  mediaType,
}: {
  mediaType: PortfolioCardItem['mediaType'];
}) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const Icon =
    mediaType === 'video' ? VideoCamera : mediaType === 'document' ? FileText : Images;

  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 16 / 10,
        backgroundColor: colors.iconWash,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.two,
      }}
    >
      <Icon size={28} color={colors.muted} weight="duotone" />
      <Text style={[textStyle('micro'), { color: colors.muted }]}>
        {mediaType === 'video'
          ? t('portfolio.mediaVideo')
          : mediaType === 'document'
            ? t('portfolio.mediaDocument')
            : t('service.portfolio')}
      </Text>
    </View>
  );
}

interface PortfolioCardProps {
  item: PortfolioCardItem;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Grille compacte (profil public) vs liste (gestion). */
  compact?: boolean;
}

/** Carte présentation d’une réalisation portfolio. */
export function PortfolioCard({
  item,
  onPress,
  onEdit,
  onDelete,
  compact = false,
}: PortfolioCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const imageUri =
    item.mediaType === 'image'
      ? item.mediaUrl || item.thumbnailUrl || null
      : item.thumbnailUrl || null;
  const showActions = !compact && (onEdit || onDelete);

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.92 : 1 }]}
      >
        <View
          style={{
            borderRadius: Radius.md,
            overflow: 'hidden',
            backgroundColor: colors.surfaceCard,
            borderWidth: BorderWidth.default,
            borderColor: colors.borderStrong,
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', aspectRatio: 1 }}
              contentFit="cover"
            />
          ) : (
            <View style={{ aspectRatio: 1 }}>
              <MediaPlaceholder mediaType={item.mediaType} />
            </View>
          )}
          <View style={{ padding: Spacing.three, gap: 4 }}>
            <Text
              numberOfLines={2}
              style={[
                textStyle('caption'),
                {
                  color: colors.ink,
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 13,
                  lineHeight: 17,
                },
              ]}
            >
              {item.title}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { width: '100%', marginBottom: Spacing.four },
        { opacity: pressed ? 0.96 : 1 },
      ]}
    >
      <View
        style={{
          backgroundColor: colors.surfaceCard,
          borderRadius: Radius.md,
          overflow: 'hidden',
          borderWidth: BorderWidth.default,
          borderColor: colors.borderStrong,
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', aspectRatio: 16 / 10 }}
            contentFit="cover"
          />
        ) : (
          <MediaPlaceholder mediaType={item.mediaType} />
        )}

        <View style={{ padding: Spacing.four, gap: Spacing.two }}>
          <Text
            numberOfLines={2}
            style={[
              textStyle('body'),
              {
                color: colors.ink,
                fontFamily: fontFamily('body', 'bold'),
                fontSize: 16,
                lineHeight: 22,
              },
            ]}
          >
            {item.title}
          </Text>

          {item.description ? (
            <Text
              numberOfLines={2}
              style={[textStyle('caption'), { color: colors.muted, lineHeight: 18 }]}
            >
              {item.description}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: Spacing.two,
              marginTop: Spacing.one,
            }}
          >
            {item.relatedService ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: Spacing.two,
                  paddingVertical: 4,
                  borderRadius: Radius.pill,
                  backgroundColor: colors.iconWash,
                  maxWidth: '70%',
                }}
              >
                <Briefcase size={12} color={colors.muted} weight="bold" />
                <Text
                  numberOfLines={1}
                  style={[
                    textStyle('micro'),
                    { color: colors.ink, fontFamily: fontFamily('body', 'medium') },
                  ]}
                >
                  {item.relatedService.title}
                </Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CalendarBlank size={12} color={colors.muted} />
              <Text style={[textStyle('micro'), { color: colors.muted }]}>
                {formatShortDate(item.createdAt, i18n.language)}
              </Text>
            </View>
          </View>

          {showActions ? (
            <View
              style={{
                flexDirection: 'row',
                gap: Spacing.two,
                marginTop: Spacing.two,
                paddingTop: Spacing.three,
                borderTopWidth: BorderWidth.default,
                borderTopColor: colors.border,
              }}
            >
              {onEdit ? (
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onEdit();
                  }}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t('portfolio.edit')}
                  style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      minHeight: 40,
                      borderRadius: Radius.button,
                      backgroundColor: colors.iconWash,
                    }}
                  >
                    <PencilSimple size={16} color={colors.ink} weight="bold" />
                    <Text
                      style={[
                        textStyle('caption'),
                        { color: colors.ink, fontFamily: fontFamily('body', 'medium') },
                      ]}
                    >
                      {t('common.edit')}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
              {onDelete ? (
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onDelete();
                  }}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                  style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      minHeight: 40,
                      borderRadius: Radius.button,
                      backgroundColor: colors.iconWash,
                    }}
                  >
                    <Trash size={16} color={colors.error} weight="bold" />
                    <Text
                      style={[
                        textStyle('caption'),
                        { color: colors.error, fontFamily: fontFamily('body', 'medium') },
                      ]}
                    >
                      {t('common.delete')}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
