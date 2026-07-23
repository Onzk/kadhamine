import React from 'react';
import { View, Text } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { Image } from 'expo-image';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function AdminVerificationsScreen() {
  const { colors } = useAppTheme();
  const items = useQuery(api.admin.listVerifications, { status: 'pending' });
  const review = useMutation(api.admin.reviewVerification);

  return (
    <PageScaffold
      title="Vérifications d'identité"
      subtitle="Examinez et validez les demandes d'identité."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        {items?.map(({ request, profile, docUrl, selfieUrl }) => (
          <View
            key={request._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
              borderWidth: 0.1,
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
                <Image source={{ uri: docUrl }} style={{ width: 120, height: 80, borderRadius: 6 }} contentFit="cover" />
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
      </View>
    </PageScaffold>
  );
}
