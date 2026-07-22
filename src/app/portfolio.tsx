import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Trash, Image as ImageIcon } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useUpload } from '@/hooks/useUpload';
import { Spacing } from '@/theme/tokens';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export default function PortfolioScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { uploadFromUri } = useUpload();

  const items = useQuery(api.portfolio.listMine);
  const createItem = useMutation(api.portfolio.create);
  const removeItem = useMutation(api.portfolio.remove);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission caméra requise');
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
      Alert.alert('Permission galerie requise');
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
      Alert.alert('Titre requis');
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
      Alert.alert('Erreur', 'Impossible d\'ajouter au portfolio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (itemId: Id<'portfolio'>) => {
    Alert.alert('Supprimer', 'Retirer cet élément du portfolio ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeItem({ itemId }) },
    ]);
  };

  return (
    <PageScaffold title={t('service.portfolio')} showBack>
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: 20,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
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
          <View
            key={item._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 20,
              marginBottom: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {item.mediaUrl && item.mediaType === 'image' && (
              <Image source={{ uri: item.mediaUrl }} style={{ width: '100%', height: 160 }} contentFit="cover" />
            )}
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 }}>
                  {item.title}
                </Text>
                <Pressable onPress={() => handleDelete(item._id)}>
                  <Trash size={18} color={colors.error} />
                </Pressable>
              </View>
              {item.description && (
                <Text style={{ fontSize: 13, color: colors.body, marginTop: 4 }}>{item.description}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </PageScaffold>
  );
}
