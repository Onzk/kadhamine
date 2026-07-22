import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Gear,
  Moon,
  Shield,
  Crown,
  SignOut,
  CaretRight,
  ChartBar,
  Wrench,
  SquaresFour,
  Images,
} from 'phosphor-react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppLanguage } from '@/providers/I18nProvider';
import { SUPPORTED_LANGUAGES } from '@/constants/chad';
import { BrandColors, Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, toggle, isDark } = useAppTheme();
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useAppLanguage();
  const router = useRouter();

  const profile = user?.profile;
  const isProvider = user?.role === 'provider';
  const isAdmin = user?.role === 'admin';
  const isGuest = !user;

  if (isGuest) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 48, paddingBottom: 32 }}>
          <Text style={[textStyle('productDisplay'), { color: colors.ink, marginBottom: 12 }]}>
            {t('auth.guestTitle')}
          </Text>
          <Text style={[textStyle('body'), { color: colors.muted, marginBottom: 32 }]}>
            {t('auth.guestSubtitle')}
          </Text>
          <Button
            title={t('auth.signIn')}
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            style={{ marginBottom: 12 }}
          />
          <Button
            title={t('auth.signUp')}
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
          />
          <View style={{ marginTop: 32 }}>
            <Eyebrow label={t('profile.language')} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: Radius.pill,
                    backgroundColor: language === lang.code ? colors.primary : colors.surfaceCard,
                    borderWidth: 1.5,
                    borderColor: colors.ink,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: language === lang.code ? colors.onPrimary : colors.body,
                    }}
                  >
                    {lang.nativeLabel}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const menuItems = [
    ...(isProvider
      ? [
          { icon: ChartBar, label: t('profile.dashboard'), route: '/provider/dashboard' },
          { icon: Wrench, label: t('profile.myServices'), route: '/provider/services' },
          { icon: Images, label: t('service.portfolio'), route: '/portfolio' },
        ]
      : []),
    { icon: Shield, label: t('profile.verification'), route: '/verification' },
    { icon: Crown, label: t('profile.premium'), route: '/premium' },
    ...(isAdmin ? [{ icon: SquaresFour, label: 'Administration', route: '/admin' }] : []),
    { icon: Gear, label: t('profile.settings'), route: '/settings' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View
          style={{
            backgroundColor: colors.ink,
            padding: Spacing.eight,
            paddingTop: Spacing.four,
            borderBottomLeftRadius: Radius.stadium,
            borderBottomRightRadius: Radius.stadium,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.surfaceCard,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.ink }}>
              {profile?.firstName?.[0] ?? '?'}
            </Text>
          </View>

          <Text style={[textStyle('cardHeading'), { color: colors.onPrimary }]}>
            {profile ? `${profile.firstName} ${profile.lastName}` : user?.name ?? 'Utilisateur'}
          </Text>
          <Text style={[textStyle('caption'), { color: colors.dust, marginTop: 4 }]}>
            {user?.email}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {profile?.isVerified && <Badge label={t('common.verified')} variant="verified" />}
            {profile?.isPremium && <Badge label={t('common.premium')} variant="premium" />}
            {profile?.badge && <Badge label={t(`badges.${profile.badge}`)} variant="accent" />}
          </View>

          {isProvider && profile && (
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: BrandColors.gold }}>
                  {profile.averageRating.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.dust }}>Note</Text>
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: BrandColors.gold }}>
                  {profile.completedOrders}
                </Text>
                <Text style={{ fontSize: 12, color: colors.dust }}>Prestations</Text>
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: BrandColors.gold }}>
                  {profile.trustScore}
                </Text>
                <Text style={{ fontSize: 12, color: colors.dust }}>Confiance</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ padding: Spacing.four }}>
          <Eyebrow label={t('profile.language')} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: Radius.pill,
                  backgroundColor: language === lang.code ? colors.primary : colors.surfaceCard,
                  borderWidth: 1.5,
                  borderColor: colors.ink,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: language === lang.code ? colors.onPrimary : colors.body,
                  }}
                >
                  {lang.nativeLabel}
                </Text>
              </Pressable>
            ))}
          </View>

          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as never)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.stadium,
                padding: Spacing.four,
                marginBottom: Spacing.two,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <item.icon size={20} color={colors.ink} />
              <Text style={{ flex: 1, fontSize: 15, color: colors.ink, marginLeft: 12 }}>
                {item.label}
              </Text>
              <CaretRight size={18} color={colors.muted} />
            </Pressable>
          ))}

          <Pressable
            onPress={toggle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceCard,
              borderRadius: Radius.stadium,
              padding: Spacing.four,
              marginBottom: Spacing.two,
            }}
          >
            <Moon size={20} color={colors.ink} />
            <Text style={{ flex: 1, fontSize: 15, color: colors.ink, marginLeft: 12 }}>
              {t('profile.theme')} ({isDark ? 'Sombre' : 'Clair'})
            </Text>
          </Pressable>

          <Button
            title={t('auth.logout')}
            variant="outline"
            onPress={signOut}
            icon={<SignOut size={18} color={colors.error} />}
            fullWidth
            style={{ marginTop: 16, borderColor: colors.error }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
