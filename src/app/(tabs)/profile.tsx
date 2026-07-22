import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
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
      <PageScaffold
        title={t('auth.guestTitle')}
        subtitle={t('auth.guestSubtitle')}
        headerActions={
          <View>
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
          </View>
        }
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, marginTop: Spacing.two }}>
          <Eyebrow label={t('profile.language')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.three }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: Radius.pill,
                  backgroundColor: language === lang.code ? colors.orbit : colors.surfaceCard,
                  borderWidth: 1,
                  borderColor: language === lang.code ? colors.orbit : colors.border,
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
      </PageScaffold>
    );
  }

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user?.name ?? 'Utilisateur';

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

  const hasBadges = Boolean(profile?.isVerified || profile?.isPremium || profile?.badge);
  const showProfileMeta = hasBadges || (isProvider && profile);

  return (
    <PageScaffold
      title={displayName}
      subtitle={user?.email}
      rightAction={
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceCard,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>
            {profile?.firstName?.[0] ?? '?'}
          </Text>
        </View>
      }
      headerActions={
        showProfileMeta ? (
          <View>
            {hasBadges ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile?.isVerified && <Badge label={t('common.verified')} variant="verified" />}
                {profile?.isPremium && <Badge label={t('common.premium')} variant="premium" />}
                {profile?.badge && <Badge label={t(`badges.${profile.badge}`)} variant="accent" />}
              </View>
            ) : null}

            {isProvider && profile ? (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 24,
                  marginTop: hasBadges ? Spacing.five : 0,
                }}
              >
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: BrandColors.gold }}>
                    {profile.averageRating.toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Note</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: BrandColors.gold }}>
                    {profile.completedOrders}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Prestations</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: BrandColors.gold }}>
                    {profile.trustScore}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Confiance</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : undefined
      }
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, marginTop: Spacing.two }}>
        <Eyebrow label={t('profile.language')} />
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: Spacing.three,
            marginBottom: Spacing.six,
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: Radius.pill,
                backgroundColor: language === lang.code ? colors.orbit : colors.surfaceCard,
                borderWidth: 1,
                borderColor: language === lang.code ? colors.orbit : colors.border,
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
          style={{ marginTop: Spacing.four, borderColor: colors.error }}
        />
      </View>
    </PageScaffold>
  );
}
