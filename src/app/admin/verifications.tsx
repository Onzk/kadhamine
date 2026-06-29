import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/providers/ThemeProvider';
import { api } from '../../../convex/_generated/api';

export default function AdminVerificationsScreen() {
  const { colors } = useAppTheme();
  const items = useQuery(api.admin.listVerifications, { status: 'pending' });
  const review = useMutation(api.admin.reviewVerification);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Vérifications d'identité" showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {items?.map(({ request, profile, docUrl, selfieUrl }) => (
          <View
            key={request._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: 8 }}>
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Prestataire'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
              {request.documentType === 'national_id' ? 'Carte nationale' : 'Passeport'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {docUrl && (
                <Image source={{ uri: docUrl }} style={{ width: 120, height: 80, borderRadius: 8 }} contentFit="cover" />
              )}
              {selfieUrl && (
                <Image source={{ uri: selfieUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} contentFit="cover" />
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Approuver" onPress={() => review({ requestId: request._id, approved: true })} style={{ flex: 1 }} />
              <Button
                title="Refuser"
                variant="danger"
                onPress={() => review({ requestId: request._id, approved: false })}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
