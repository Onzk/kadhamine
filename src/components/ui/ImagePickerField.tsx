import { Image } from 'expo-image';
import { Camera, Image as ImageIcon, Plus, X } from 'phosphor-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SettingsRow } from '@/components/ui/SettingsRow';
import {
  useImagePicker,
  type ImagePickerMediaTypes,
  type PickedAsset,
} from '@/hooks/useImagePicker';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import type { Id } from '../../../convex/_generated/dataModel';

export type ImagePickerValueItem = {
  /** Local file URI or remote preview URL. */
  uri: string;
  storageId?: Id<'_storage'>;
  mimeType?: string;
};

export type ImagePickerFieldProps = {
  value: ImagePickerValueItem[];
  onChange: (items: ImagePickerValueItem[]) => void;
  /** 1 = single image; >1 = multi. */
  maxCount?: number;
  label?: string;
  mode?: 'camera' | 'gallery' | 'both';
  mediaTypes?: ImagePickerMediaTypes;
  /** Used when picking from camera (e.g. selfie = front). */
  cameraFacing?: 'front' | 'back';
  style?: StyleProp<ViewStyle>;
};

const THUMB = 72;

export function ImagePickerField({
  value,
  onChange,
  maxCount = 1,
  label,
  mode = 'both',
  mediaTypes = 'images',
  cameraFacing = 'back',
  style,
}: ImagePickerFieldProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const { pickFromLibrary, pickFromCamera, uploadAsset } = useImagePicker({
    allowsMultiple: maxCount > 1,
    mediaTypes,
    cameraFacing,
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const canAdd = value.length < maxCount;

  const handlePermissionError = (err: unknown) => {
    if (err instanceof Error) {
      if (err.message === 'PERMISSION_CAMERA') {
        alert({ title: t('profile.cameraPermission') });
        return;
      }
      if (err.message === 'PERMISSION_GALLERY') {
        alert({ title: t('profile.galleryPermission') });
        return;
      }
    }
    alert({ title: t('common.error'), message: t('profile.avatarUploadError') });
  };

  const ingestAssets = async (assets: PickedAsset[]) => {
    const room = maxCount - value.length;
    if (room <= 0) return;
    const slice = assets.slice(0, room);

    setUploading(true);
    try {
      const uploaded: ImagePickerValueItem[] = [];
      for (const asset of slice) {
        const storageId = await uploadAsset(asset);
        uploaded.push({
          uri: asset.uri,
          storageId,
          mimeType: asset.mimeType,
        });
      }
      onChange(maxCount === 1 ? uploaded : [...value, ...uploaded]);
    } catch (err) {
      console.error(err);
      alert({ title: t('common.error'), message: t('profile.avatarUploadError') });
    } finally {
      setUploading(false);
    }
  };

  const pickCamera = async () => {
    setSheetOpen(false);
    try {
      const asset = await pickFromCamera();
      if (!asset) return;
      await ingestAssets([asset]);
    } catch (err) {
      handlePermissionError(err);
    }
  };

  const pickGallery = async () => {
    setSheetOpen(false);
    try {
      const assets = await pickFromLibrary();
      if (!assets?.length) return;
      await ingestAssets(assets);
    } catch (err) {
      handlePermissionError(err);
    }
  };

  const onAddPress = () => {
    if (!canAdd || uploading) return;
    if (mode === 'camera') {
      void pickCamera();
      return;
    }
    if (mode === 'gallery') {
      void pickGallery();
      return;
    }
    setSheetOpen(true);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={style}>
      {label ? (
        <Text
          style={[
            textStyle('body'),
            { color: colors.ink, marginBottom: Spacing.two, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three }}>
        {value.map((item, index) => (
          <View key={`${item.uri}-${index}`} style={{ width: THUMB, height: THUMB }}>
            <View
              style={{
                width: THUMB,
                height: THUMB,
                borderRadius: Radius.sm,
                overflow: 'hidden',
                borderWidth: BorderWidth.default,
                borderColor: colors.border,
                backgroundColor: colors.surfaceStrong,
              }}
            >
              <Image
                source={{ uri: item.uri }}
                style={{ width: THUMB, height: THUMB }}
                contentFit="cover"
              />
            </View>
            <Pressable
              onPress={() => removeAt(index)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
              style={({ pressed }) => ({
                position: 'absolute',
                top: -6,
                right: -6,
                width: 24,
                height: 24,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: Radius.pill,
                  backgroundColor: colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: BorderWidth.default,
                  borderColor: colors.border,
                }}
              >
                <X size={12} color={colors.onAccent} weight="bold" />
              </View>
            </Pressable>
          </View>
        ))}

        {canAdd ? (
          <Pressable
            onPress={onAddPress}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={label ?? 'Ajouter'}
            style={({ pressed }) => ({
              width: THUMB,
              height: THUMB,
              opacity: pressed || uploading ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: THUMB,
                height: THUMB,
                borderRadius: Radius.sm,
                borderWidth: BorderWidth.default,
                borderColor: colors.border,
                backgroundColor: colors.surfaceCard,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.orbit} />
              ) : (
                <Plus size={22} color={colors.muted} weight="bold" />
              )}
            </View>
          </Pressable>
        ) : null}
      </View>

      <AppBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('profile.avatarTitle')}
        subtitle={t('profile.avatarSubtitle')}
      >
        <SettingsRow
          icon={Camera}
          title={t('profile.avatarCamera')}
          onPress={() => void pickCamera()}
          showChevron={false}
        />
        <SettingsRow
          icon={ImageIcon}
          title={t('profile.avatarGallery')}
          onPress={() => void pickGallery()}
          showChevron={false}
        />
      </AppBottomSheet>
    </View>
  );
}
