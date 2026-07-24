import React from 'react';
import { View, Pressable } from 'react-native';
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

import { SafeImage } from '@/components/errors/SafeImage';
import { Enter } from '@/components/ui/Enter';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

const LIST_THUMB = 80;
/** Overlay actions on compact (grid) cards. */
const MINI_ACTION_SIZE = 24;

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

/** Variante sans année pour les cartes de grille (place réduite). */
function formatCompactDate(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

function MediaPlaceholder({
  mediaType,
  size = 'list',
}: {
  mediaType: PortfolioCardItem['mediaType'];
  size?: 'list' | 'compact';
}) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const Icon =
    mediaType === 'video' ? VideoCamera : mediaType === 'document' ? FileText : Images;
  const isList = size === 'list';

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.iconWash,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.one,
      }}
    >
      <Icon size={isList ? 22 : 24} color={colors.muted} weight="duotone" />
      {!isList ? (
        <Text style={[textStyle('micro'), { color: colors.muted }]}>
          {mediaType === 'video'
            ? t('portfolio.mediaVideo')
            : mediaType === 'document'
              ? t('portfolio.mediaDocument')
              : t('service.portfolio')}
        </Text>
      ) : null}
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
    const hasMiniActions = !!(onEdit || onDelete);
    const MediaTypeIcon =
      item.mediaType === 'video' ? VideoCamera : item.mediaType === 'document' ? FileText : null;
    const mediaTypeLabel =
      item.mediaType === 'video'
        ? t('portfolio.mediaVideo')
        : item.mediaType === 'document'
          ? t('portfolio.mediaDocument')
          : null;

    return (
      <Enter variant="card" index={enterIndex} style={{ width: '100%', position: 'relative' }}>
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
            <View style={{ width: '100%', aspectRatio: 4 / 3 }}>
              {imageUri ? (
                <SafeImage
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  fallback={<MediaPlaceholder mediaType={item.mediaType} size="compact" />}
                />
              ) : (
                <MediaPlaceholder mediaType={item.mediaType} size="compact" />
              )}

              {MediaTypeIcon && mediaTypeLabel ? (
                <View
                  style={{
                    position: 'absolute',
                    left: Spacing.one,
                    bottom: Spacing.one,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    paddingHorizontal: Spacing.oneHalf,
                    paddingVertical: 2,
                    borderRadius: Radius.pill,
                    backgroundColor: 'rgba(20,20,19,0.6)',
                  }}
                >
                  <MediaTypeIcon size={10} color="#FFFFFF" weight="bold" />
                  <Text
                    style={[
                      textStyle('micro'),
                      {
                        color: '#FFFFFF',
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 10,
                        lineHeight: 13,
                      },
                    ]}
                  >
                    {mediaTypeLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ padding: Spacing.two, gap: 3 }}>
              <Text
                numberOfLines={1}
                style={[
                  textStyle('caption'),
                  {
                    color: colors.ink,
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 12,
                    lineHeight: 16,
                  },
                ]}
              >
                {item.title}
              </Text>

              {item.relatedService || item.description ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 0 }}
                >
                  {item.relatedService ? (
                    <Briefcase size={10} color={colors.muted} weight="bold" />
                  ) : null}
                  <Text
                    numberOfLines={1}
                    style={[
                      textStyle('micro'),
                      {
                        color: colors.muted,
                        fontFamily: fontFamily('body', item.relatedService ? 'medium' : 'regular'),
                        fontSize: 10,
                        lineHeight: 13,
                        flexShrink: 1,
                      },
                    ]}
                  >
                    {item.relatedService ? item.relatedService.title : item.description}
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <CalendarBlank size={10} color={colors.muted} />
                <Text
                  style={[
                    textStyle('micro'),
                    { color: colors.muted, fontSize: 10, lineHeight: 13 },
                  ]}
                >
                  {formatCompactDate(item.createdAt, i18n.language)}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        {hasMiniActions ? (
          <View
            style={{
              position: 'absolute',
              top: Spacing.one,
              right: Spacing.one,
              flexDirection: 'row',
              gap: Spacing.one,
            }}
          >
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel={t('portfolio.edit')}
                style={({ pressed }) => [
                  { width: MINI_ACTION_SIZE, height: MINI_ACTION_SIZE },
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View
                  style={{
                    width: MINI_ACTION_SIZE,
                    height: MINI_ACTION_SIZE,
                    borderRadius: MINI_ACTION_SIZE / 2,
                    backgroundColor: 'rgba(20,20,19,0.55)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PencilSimple size={12} color="#FFFFFF" weight="bold" />
                </View>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={onDelete}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}
                style={({ pressed }) => [
                  { width: MINI_ACTION_SIZE, height: MINI_ACTION_SIZE },
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View
                  style={{
                    width: MINI_ACTION_SIZE,
                    height: MINI_ACTION_SIZE,
                    borderRadius: MINI_ACTION_SIZE / 2,
                    backgroundColor: 'rgba(225,29,72,0.85)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash size={12} color="#FFFFFF" weight="bold" />
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Enter>
    );
  }

  return (
    <Enter variant="card" index={enterIndex} style={{ width: '100%', marginBottom: Spacing.three }}>
      <View
        style={{
          padding: Spacing.four,
          borderRadius: Radius.lg,
          borderWidth: BorderWidth.default,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surfaceCard,
          gap: Spacing.three,
        }}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: Spacing.three,
            }}
          >
            <View
              style={{
                width: LIST_THUMB,
                height: LIST_THUMB,
                flexShrink: 0,
                borderRadius: Radius.md,
                overflow: 'hidden',
                backgroundColor: colors.surfaceStrong,
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <MediaPlaceholder mediaType={item.mediaType} size="list" />
              )}
            </View>

            <View style={{ flex: 1, minWidth: 0, gap: Spacing.one }}>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: fontFamily('body', 'medium'),
                  fontSize: 15,
                  lineHeight: 20,
                  letterSpacing: -0.2,
                  color: colors.ink,
                }}
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
                      maxWidth: '70%',
                      flexShrink: 1,
                    }}
                  >
                    <Briefcase size={12} color={colors.muted} weight="bold" />
                    <Text
                      numberOfLines={1}
                      style={[
                        textStyle('micro'),
                        {
                          color: colors.muted,
                          fontFamily: fontFamily('body', 'medium'),
                          flexShrink: 1,
                        },
                      ]}
                    >
                      {item.relatedService.title}
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <CalendarBlank size={12} color={colors.muted} />
                  <Text style={[textStyle('micro'), { color: colors.muted }]}>
                    {formatShortDate(item.createdAt, i18n.language)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>

        {showActions ? (
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.two,
            }}
          >
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                accessibilityRole="button"
                accessibilityLabel={t('portfolio.edit')}
                style={({ pressed }) => [{ flex: 1 }, { opacity: pressed ? 0.9 : 1 }]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.oneHalf,
                    paddingVertical: Spacing.four,
                    paddingHorizontal: Spacing.three,
                    borderRadius: Radius.md,
                    borderWidth: BorderWidth.default,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceCard,
                  }}
                >
                  <PencilSimple size={16} color={colors.ink} weight="bold" />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: fontFamily('body', 'medium'),
                      color: colors.ink,
                    }}
                  >
                    {t('portfolio.edit')}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={onDelete}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}
                style={({ pressed }) => [{ width: 52 }, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={{
                    height: 52,
                    width: 52,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: Radius.md,
                    backgroundColor: colors.error + '14',
                  }}
                >
                  <Trash size={18} color={colors.error} weight="bold" />
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Enter>
  );
}
