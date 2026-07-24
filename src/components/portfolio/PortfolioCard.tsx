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

const LIST_THUMB = 80;
const ACTION_SIZE = 44;

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
        gap: isList ? Spacing.one : Spacing.two,
      }}
    >
      <Icon size={isList ? 22 : 28} color={colors.muted} weight="duotone" />
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
              <MediaPlaceholder mediaType={item.mediaType} size="compact" />
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
    <View style={{ width: '100%', marginBottom: Spacing.three }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
          padding: Spacing.four,
          borderRadius: Radius.lg,
          borderWidth: BorderWidth.default,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surfaceCard,
        }}
      >
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            { flex: 1, minWidth: 0 },
            { opacity: pressed ? 0.96 : 1 },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.three,
            }}
          >
            <View
              style={{
                width: LIST_THUMB,
                height: LIST_THUMB,
                flexShrink: 0,
                borderRadius: Radius.sm,
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

            <View
              style={{
                flex: 1,
                minWidth: 0,
                justifyContent: 'space-between',
                gap: Spacing.one,
                minHeight: LIST_THUMB,
                paddingVertical: 2,
              }}
            >
              <View style={{ gap: 4 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: fontFamily('body', 'medium'),
                    fontSize: 14,
                    lineHeight: 18,
                    letterSpacing: -0.2,
                    color: colors.ink,
                  }}
                >
                  {item.title}
                </Text>

                {item.description ? (
                  <Text
                    numberOfLines={2}
                    style={[textStyle('caption'), { color: colors.muted, lineHeight: 17 }]}
                  >
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: Spacing.two,
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
              alignItems: 'center',
              gap: Spacing.two,
              flexShrink: 0,
            }}
          >
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                hitSlop={Spacing.one}
                accessibilityRole="button"
                accessibilityLabel={t('portfolio.edit')}
                style={({ pressed }) => [
                  { width: ACTION_SIZE, height: ACTION_SIZE },
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View
                  style={{
                    width: ACTION_SIZE,
                    height: ACTION_SIZE,
                    borderRadius: Radius.button,
                    backgroundColor: colors.iconWash,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PencilSimple size={18} color={colors.ink} weight="bold" />
                </View>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                onPress={onDelete}
                hitSlop={Spacing.one}
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}
                style={({ pressed }) => [
                  { width: ACTION_SIZE, height: ACTION_SIZE },
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View
                  style={{
                    width: ACTION_SIZE,
                    height: ACTION_SIZE,
                    borderRadius: Radius.button,
                    backgroundColor: colors.error + '14',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash size={18} color={colors.error} weight="bold" />
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
