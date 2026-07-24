import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { useUpload } from '@/hooks/useUpload';
import type { Id } from '../../convex/_generated/dataModel';

export type ImagePickerMediaTypes = 'images' | 'videos' | 'both';

export type UseImagePickerOptions = {
  allowsMultiple?: boolean;
  mediaTypes?: ImagePickerMediaTypes;
  cameraFacing?: 'front' | 'back';
  quality?: number;
};

export type PickedAsset = {
  uri: string;
  mimeType: string;
  type: 'image' | 'video';
  fileSize?: number;
};

function toMediaTypes(
  mediaTypes: ImagePickerMediaTypes,
): ImagePicker.MediaType | ImagePicker.MediaType[] {
  if (mediaTypes === 'images') return ['images'];
  if (mediaTypes === 'videos') return ['videos'];
  return ['images', 'videos'];
}

function mapAsset(asset: ImagePicker.ImagePickerAsset): PickedAsset {
  const isVideo = asset.type === 'video';
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    type: isVideo ? 'video' : 'image',
    fileSize: asset.fileSize,
  };
}

export function useImagePicker(options: UseImagePickerOptions = {}) {
  const {
    allowsMultiple = false,
    mediaTypes = 'images',
    cameraFacing = 'back',
    quality = 0.8,
  } = options;

  const { uploadFromUri } = useUpload();

  const pickFromLibrary = useCallback(async (): Promise<PickedAsset[] | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('PERMISSION_GALLERY');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: toMediaTypes(mediaTypes),
      quality,
      allowsMultipleSelection: allowsMultiple,
      selectionLimit: allowsMultiple ? 0 : 1,
    });

    if (result.canceled || result.assets.length === 0) return null;
    return result.assets.map(mapAsset);
  }, [allowsMultiple, mediaTypes, quality]);

  const pickFromCamera = useCallback(async (): Promise<PickedAsset | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('PERMISSION_CAMERA');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: toMediaTypes(mediaTypes === 'both' ? 'images' : mediaTypes),
      quality,
      cameraType:
        cameraFacing === 'front'
          ? ImagePicker.CameraType.front
          : ImagePicker.CameraType.back,
    });

    if (result.canceled || result.assets.length === 0) return null;
    return mapAsset(result.assets[0]!);
  }, [cameraFacing, mediaTypes, quality]);

  const uploadAsset = useCallback(
    async (asset: PickedAsset): Promise<Id<'_storage'>> => {
      return uploadFromUri(asset.uri, asset.mimeType);
    },
    [uploadFromUri],
  );

  return { pickFromLibrary, pickFromCamera, uploadAsset };
}
