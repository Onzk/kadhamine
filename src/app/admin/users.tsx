import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery, useMutation } from 'convex/react';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppTheme } from '@/providers/ThemeProvider';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export default function AdminUsersScreen() {
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<'pending' | 'active' | 'suspended' | 'all'>('pending');

  const users = useQuery(api.admin.listUsers, {
    status: filter === 'all' ? undefined : filter,
  });
  const updateStatus = useMutation(api.admin.updateUserStatus);
  const setPremium = useMutation(api.admin.setPremium);

  const handleStatus = async (userId: Id<'users'>, status: 'active' | 'rejected' | 'suspended') => {
    await updateStatus({ userId, status });
  };

  const handlePremium = async (userId: Id<'users'>, isPremium: boolean) => {
    await setPremium({ userId, isPremium });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title="Utilisateurs" showBack />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 8 }}>
        {(['pending', 'active', 'suspended', 'all'] as const).map((f) => (
          <CategoryChip
            key={f}
            label={f === 'all' ? 'Tous' : f}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        {users?.map(({ user, profile }) => (
          <View
            key={user._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 20,
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
                {profile ? `${profile.firstName} ${profile.lastName}` : user.name ?? user.email}
              </Text>
              <Badge label={user.role ?? '?'} />
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>{user.email}</Text>
            {profile && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {profile.isVerified ? <Badge label="Vérifié" variant="verified" /> : null}
                {profile.isPremium ? <Badge label="Premium" variant="premium" /> : null}
              </View>
            )}

            {user.status === 'pending' && user.role === 'provider' && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <Button title="Valider" onPress={() => handleStatus(user._id, 'active')} style={{ flex: 1 }} />
                <Button
                  title="Refuser"
                  variant="danger"
                  onPress={() => handleStatus(user._id, 'rejected')}
                  style={{ flex: 1 }}
                />
              </View>
            )}

            {user.status === 'active' && (
              <Button
                title="Suspendre"
                variant="outline"
                onPress={() => handleStatus(user._id, 'suspended')}
                style={{ marginBottom: 8 }}
              />
            )}

            {user.role === 'provider' && profile && (
              <Button
                title={profile.isPremium ? 'Retirer Premium' : 'Activer Premium'}
                variant={profile.isPremium ? 'outline' : 'accent'}
                onPress={() => handlePremium(user._id, !profile.isPremium)}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
