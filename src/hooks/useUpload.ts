import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export function useUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const uploadFromUri = async (uri: string, mimeType = 'image/jpeg'): Promise<Id<'_storage'>> => {
    const postUrl = await generateUploadUrl();
    const fileResponse = await fetch(uri);
    const blob = await fileResponse.blob();
    const uploadResponse = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': mimeType },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Échec de l\'upload');
    }

    const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> };
    return storageId;
  };

  return { uploadFromUri };
}
