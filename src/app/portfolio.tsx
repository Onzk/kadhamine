import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Trash, Image as ImageIcon } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  PortfolioDetailSheet,
  type PortfolioDetailItem,
} from '@/components/portfolio/PortfolioDetailSheet';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useUpload } from '@/hooks/useUpload';
import { Spacing } from '@/theme/tokens';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export default function PortfolioScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { uploadFromUri } = useUpload();
  const router = useRouter();

  const items = useQuery(api.portfolio.listMine);
  const createItem = useMutation(api.portfolio.create);
  const removeItem = useMutation(api.portfolio.remove);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PortfolioDetailItem | null>(null);

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert({ title: 'Permission caméra requise' });
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (result.canceled) return null;
      return result.assets[0];
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert({ title: 'Permission galerie requise' });
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (result.canceled) return null;
    return result.assets[0];
  };

  const handleAdd = async (useCamera: boolean) => {
    if (!title.trim()) {
      alert({ title: 'Titre requis' });
      return;
    }

    setLoading(true);
    try {
      const asset = await pickImage(useCamera);
      if (!asset) {
        setLoading(false);
        return;
      }

      const storageId = await uploadFromUri(asset.uri, asset.mimeType ?? 'image/jpeg');
      await createItem({
        title: title.trim(),
        description: description.trim() || undefined,
        mediaType: asset.type === 'video' ? 'video' : 'image',
        storageId,
      });

      setTitle('');
      setDescription('');
    } catch (err) {
      alert({ title: 'Erreur', message: "Impossible d'ajouter au portfolio" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (itemId: Id<'portfolio'>) => {
    confirm({
      title: 'Supprimer',
      message: 'Retirer cet élément du portfolio ?',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      destructive: true,
      onConfirm: () => {
        void removeItem({ itemId });
      },
    });
  };

  return (
    <PageScaffold
      title={t('service.portfolio')}
      subtitle={t('portfolio.manageSubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: 20,
            padding: 16,
            marginBottom: 20,
            borderWidth: 0.1,
            borderColor: colors.border,
          }}
        >
          <Input label="Titre" value={title} onChangeText={setTitle} />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title="Galerie"
              variant="outline"
              onPress={() => handleAdd(false)}
              loading={loading}
              icon={<ImageIcon size={16} color={colors.primary} />}
              style={{ flex: 1 }}
            />
            <Button
              title="Caméra"
              onPress={() => handleAdd(true)}
              loading={loading}
              icon={<Plus size={16} color={colors.onPrimary} />}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {items?.map((item) => (
          <Pressable
            key={item._id}
            onPress={() => setSelected(item)}
            style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.95 : 1 }]}
          >
            <View
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 20,
                marginBottom: 12,
                overflow: 'hidden',
                borderWidth: 0.1,
                borderColor: colors.border,
              }}
            >
              {item.mediaUrl && item.mediaType === 'image' && (
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={{ width: '100%', height: 160 }}
                  contentFit="cover"
                />
              )}
              <View style={{ padding: 14 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 }}>
                    {item.title}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleDelete(item._id);
                    }}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash size={18} color={colors.error} />
                    </View>
                  </Pressable>
                </View>
                {item.description ? (
                  <Text style={{ fontSize: 13, color: colors.body, marginTop: 4 }}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <PortfolioDetailSheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        item={selected}
        onOpenService={(serviceId) => router.push(`/service/${serviceId}`)}
      />
    </PageScaffold>
  );
}
