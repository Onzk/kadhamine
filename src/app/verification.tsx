import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { Badge } from '@/components/ui/Badge';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useUpload } from '@/hooks/useUpload';
import { api } from '../../convex/_generated/api';

type DocType = 'national_id' | 'passport';

export default function VerificationScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { uploadFromUri } = useUpload();

  const status = useQuery(api.verification.getStatus);
  const submit = useMutation(api.verification.submit);

  const [docType, setDocType] = useState<DocType>('national_id');
  const [docUri, setDocUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = async (selfie: boolean) => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Permission caméra requise');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      cameraType: selfie ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });

    if (!result.canceled) {
      if (selfie) setSelfieUri(result.assets[0].uri);
      else setDocUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!docUri || !selfieUri) {
      Alert.alert('Documents requis', 'Scannez votre pièce d\'identité et prenez un selfie.');
      return;
    }

    setLoading(true);
    try {
      const docStorageId = await uploadFromUri(docUri);
      const selfieStorageId = await uploadFromUri(selfieUri);
      await submit({ documentType: docType, documentStorageId: docStorageId, selfieStorageId });
      Alert.alert('Envoyé', 'Votre demande sera examinée par un administrateur.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title={t('profile.verification')} showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {status?.status === 'pending' && (
          <Badge label="En attente de validation" variant="accent" />
        )}
        {status?.status === 'approved' && (
          <Badge label="Identité vérifiée ✓" variant="verified" />
        )}
        {status?.status === 'rejected' && (
          <Badge label="Demande refusée — réessayez" variant="danger" />
        )}

        <Text style={{ fontSize: 15, color: colors.body, marginVertical: 16, lineHeight: 22 }}>
          Scannez votre carte nationale ou passeport, puis prenez un selfie pour obtenir le badge Vérifié.
        </Text>

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.body, marginBottom: 8 }}>
          Type de document
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <CategoryChip
            label="Carte nationale"
            selected={docType === 'national_id'}
            onPress={() => setDocType('national_id')}
          />
          <CategoryChip
            label="Passeport"
            selected={docType === 'passport'}
            onPress={() => setDocType('passport')}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Document</Text>
            <View
              style={{
                height: 120,
                borderRadius: 12,
                backgroundColor: colors.canvasSoft,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {docUri ? (
                <Image source={{ uri: docUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Button title="Scanner" variant="outline" onPress={() => capture(false)} />
              )}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Selfie</Text>
            <View
              style={{
                height: 120,
                borderRadius: 12,
                backgroundColor: colors.canvasSoft,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Button title="Selfie" variant="outline" onPress={() => capture(true)} />
              )}
            </View>
          </View>
        </View>

        {(!status || status.status === 'rejected') && (
          <Button title="Soumettre pour vérification" onPress={handleSubmit} loading={loading} fullWidth />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
