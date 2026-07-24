import { Image } from 'expo-image';
import {
  Camera,
  Image as ImageIcon,
  Images,
  Plus,
  WarningCircle,
  X,
} from 'phosphor-react-native';
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

import { AppBottomSheet, CLOSE_MS } from '@/components/ui/AppBottomSheet';
import { SettingsRow } from '@/components/ui/SettingsRow';
import {
  useImagePicker,
  type ImagePickerMediaTypes,
  type PickedAsset,
} from '@/hooks/useImagePicker';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
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

const THUMB = 96;
const SINGLE_H = 168;

/** Wait for AppBottomSheet / prior Modal close animation before opening another Modal. */
function waitForModalClose() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      requestAnimationFrame(() => resolve());
    }, CLOSE_MS);
  });
}

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

  const isSingle = maxCount === 1;
  const canAdd = value.length < maxCount;
  const hasMedia = mediaTypes === 'both' || mediaTypes === 'videos';

  const emptyHint =
    mode === 'camera'
      ? t('imagePicker.takePhoto')
      : mode === 'gallery'
        ? t('imagePicker.chooseGallery')
        : hasMedia
          ? t('imagePicker.addMedia')
          : t('imagePicker.addPhoto');

  const EmptyIcon = mode === 'camera' ? Camera : hasMedia ? Images : ImageIcon;

  const showAlert = async (options: Parameters<typeof alert>[0]) => {
    await waitForModalClose();
    alert(options);
  };

  const handlePermissionError = async (err: unknown) => {
    if (err instanceof Error) {
      if (err.message === 'PERMISSION_CAMERA') {
        await showAlert({
          title: t('common.error'),
          message: t('profile.cameraPermission'),
          icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
          iconTone: 'error',
        });
        return;
      }
      if (err.message === 'PERMISSION_GALLERY') {
        await showAlert({
          title: t('common.error'),
          message: t('profile.galleryPermission'),
          icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
          iconTone: 'error',
        });
        return;
      }
    }
    await showAlert({
      title: t('common.error'),
      message: t('profile.avatarUploadError'),
      icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
      iconTone: 'error',
    });
  };

  const ingestAssets = async (assets: PickedAsset[]) => {
    // Single mode: replace current item.
    const base = isSingle ? [] : value;
    const roomAfter = maxCount - base.length;
    if (roomAfter <= 0) return;
    const slice = assets.slice(0, roomAfter);

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
      onChange(isSingle ? uploaded : [...base, ...uploaded]);
    } catch (err) {
      console.error(err);
      await showAlert({
        title: t('common.error'),
        message: t('profile.avatarUploadError'),
        icon: <WarningCircle size={40} color={colors.error} weight="fill" />,
        iconTone: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const closeSheetThen = async () => {
    if (!sheetOpen) return;
    setSheetOpen(false);
    await waitForModalClose();
  };

  const pickCamera = async () => {
    await closeSheetThen();
    try {
      const asset = await pickFromCamera();
      if (!asset) return;
      await ingestAssets([asset]);
    } catch (err) {
      await handlePermissionError(err);
    }
  };

  const pickGallery = async () => {
    await closeSheetThen();
    try {
      const assets = await pickFromLibrary();
      if (!assets?.length) return;
      await ingestAssets(assets);
    } catch (err) {
      await handlePermissionError(err);
    }
  };

  const onAddPress = () => {
    if (uploading) return;
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

  const emptyContent = uploading ? (
    <>
      <ActivityIndicator size="small" color={colors.orbit} />
      <Text style={[textStyle('micro'), { color: colors.muted }]}>
        {t('imagePicker.uploading')}
      </Text>
    </>
  ) : (
    <>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.orbitWash,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EmptyIcon size={22} color={colors.orbit} weight="bold" />
      </View>
      <Text
        style={[
          textStyle('caption'),
          {
            color: colors.ink,
            fontFamily: fontFamily('body', 'medium'),
            textAlign: 'center',
            paddingHorizontal: Spacing.three,
          },
        ]}
      >
        {emptyHint}
      </Text>
    </>
  );

  return (
    <View style={style}>
      {label || maxCount > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.two,
            gap: Spacing.two,
          }}
        >
          {label ? (
            <Text
              style={[
                textStyle('caption'),
                {
                  fontFamily: fontFamily('body', 'medium'),
                  color: colors.ink,
                  flex: 1,
                },
              ]}
            >
              {label}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {maxCount > 1 ? (
            <Text style={[textStyle('micro'), { color: colors.muted }]}>
              {t('imagePicker.count', { current: value.length, max: maxCount })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {isSingle ? (
        value[0] ? (
          <View style={{ width: '100%', height: SINGLE_H }}>
            <Pressable
              onPress={onAddPress}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel={t('imagePicker.tapToReplace')}
              style={({ pressed }) => [
                { width: '100%', height: SINGLE_H },
                { opacity: pressed || uploading ? 0.92 : 1 },
              ]}
            >
              <View
                style={{
                  width: '100%',
                  height: SINGLE_H,
                  borderRadius: Radius.md,
                  overflow: 'hidden',
                  borderWidth: BorderWidth.default,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surfaceStrong,
                }}
              >
                <Image
                  source={{ uri: value[0].uri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                {uploading ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      backgroundColor: 'rgba(20,20,19,0.45)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.two,
                    }}
                  >
                    <ActivityIndicator color="#FFF" />
                    <Text style={[textStyle('micro'), { color: '#FFF' }]}>
                      {t('imagePicker.uploading')}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      paddingVertical: Spacing.two,
                      paddingHorizontal: Spacing.three,
                      backgroundColor: 'rgba(20,20,19,0.55)',
                    }}
                  >
                    <Text style={[textStyle('micro'), { color: '#FFF', textAlign: 'center' }]}>
                      {t('imagePicker.tapToReplace')}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable
              onPress={() => removeAt(0)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
              style={({ pressed }) => ({
                position: 'absolute',
                top: Spacing.two,
                right: Spacing.two,
                width: 32,
                height: 32,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#FFFFFF" weight="bold" />
              </View>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAddPress}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={emptyHint}
            style={({ pressed }) => [
              { width: '100%', height: SINGLE_H },
              { opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <View
              style={{
                width: '100%',
                height: SINGLE_H,
                borderRadius: Radius.md,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.borderStrong,
                backgroundColor: colors.surfaceCard,
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.two,
              }}
            >
              {emptyContent}
            </View>
          </Pressable>
        )
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three }}>
          {value.map((item, index) => (
            <View key={`${item.uri}-${index}`} style={{ width: THUMB, height: THUMB }}>
              <View
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: Radius.md,
                  overflow: 'hidden',
                  borderWidth: BorderWidth.default,
                  borderColor: colors.borderStrong,
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
                  width: 28,
                  height: 28,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View
                  style={{
                    position: 'absolute',
                    bottom: 78,
                    right: -8,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} color="#FFFFFF" weight="bold" />
                </View>
              </Pressable>
            </View>
          ))}

          {canAdd ? (
            <Pressable
              onPress={onAddPress}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel={emptyHint}
              style={({ pressed }) => ({
                width: THUMB,
                height: THUMB,
                opacity: pressed || uploading ? 0.9 : 1,
              })}
            >
              <View
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: Radius.md,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surfaceCard,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.one,
                  paddingHorizontal: Spacing.one,
                }}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.orbit} />
                ) : (
                  <Plus size={26} color={colors.orbit} weight="bold" />
                )}
              </View>
            </Pressable>
          ) : null}
        </View>
      )}

      <AppBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('imagePicker.sheetTitle')}
        subtitle={t('imagePicker.sheetSubtitle')}
        showClose
        bottomPadExtra={Spacing.four}
      >
        <SettingsRow
          icon={Camera}
          title={t('imagePicker.takePhoto')}
          onPress={() => void pickCamera()}
          showChevron={false}
        />
        <SettingsRow
          icon={ImageIcon}
          title={t('imagePicker.chooseGallery')}
          onPress={() => void pickGallery()}
          showChevron={false}
        />
      </AppBottomSheet>
    </View>
  );
}
