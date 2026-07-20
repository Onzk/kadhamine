import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Crown,
  Globe,
  Bell,
  CaretRight,
  SignOut,
  User,
} from 'phosphor-react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppLanguage } from '@/providers/I18nProvider';
import { SUPPORTED_LANGUAGES } from '@/constants/chad';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useAppLanguage();
  const router = useRouter();

  const rows = [
    {
      icon: User,
      label: t('profile.editProfile', { defaultValue: 'Profil' }),
      onPress: () => router.push('/(tabs)/profile'),
    },
    ...(user?.role === 'provider'
      ? [
          {
            icon: Shield,
            label: t('profile.verification', { defaultValue: 'Vérification identité' }),
            onPress: () => router.push('/verification'),
          },
          {
            icon: Crown,
            label: t('profile.premium'),
            onPress: () => router.push('/premium'),
          },
        ]
      : []),
    {
      icon: Bell,
      label: t('notifications.title', { defaultValue: 'Notifications' }),
      onPress: () => router.push('/notifications'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title={t('profile.settings', { defaultValue: 'Paramètres' })} showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {rows.map((row) => (
          <Pressable
            key={row.label}
            onPress={row.onPress}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceCard,
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surfaceStrong,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <row.icon size={20} color={colors.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.ink }}>
              {row.label}
            </Text>
            <CaretRight size={18} color={colors.muted} />
          </Pressable>
        ))}

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.muted,
            marginTop: 16,
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          {t('profile.language')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 9999,
                backgroundColor: language === lang.code ? colors.primary : colors.surfaceCard,
                borderWidth: 1,
                borderColor: language === lang.code ? colors.primary : colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Globe size={14} color={language === lang.code ? colors.onPrimary : colors.ink} />
              <Text
                style={{
                  color: language === lang.code ? colors.onPrimary : colors.ink,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {lang.nativeLabel}
              </Text>
            </Pressable>
          ))}
        </View>

        {user ? (
          <Pressable
            onPress={() => {
              Alert.alert(t('auth.SignOut'), undefined, [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('auth.SignOut'),
                  style: 'destructive',
                  onPress: () => signOut(),
                },
              ]);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.error,
            }}
          >
            <SignOut size={18} color={colors.error} />
            <Text style={{ color: colors.error, fontWeight: '600' }}>{t('auth.SignOut')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
