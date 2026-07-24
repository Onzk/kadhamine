import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, Linking, ActivityIndicator, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAction, useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Lock,
  Globe,
  Moon,
  Sun,
  Desktop,
  Info,
  ShieldCheck,
  FileText,
  DotsThree,
  SignOut,
  Bell,
  Headset,
  Crown,
  Wrench,
  Images,
  Lightning,
  ShoppingBag,
  SquaresFour,
  Camera,
  Image as ImageIcon,
  UserFocus,
  Envelope,
  IdentificationCard,
  Eye,
  ClipboardText,
  Star,
} from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
  PasswordStrengthMeter,
} from '@/components/auth/AuthField';
import { GuestProfileHeader, ProfileHeader } from '@/components/profile/ProfileHeader';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { SettingsSection } from '@/components/ui/SettingsSection';
import { useAuth } from '@/providers/AuthProvider';
import { useAppLanguage } from '@/providers/I18nProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { clearOnboardingSeen } from '@/services/onboardingStorage';
import { SUPPORTED_LANGUAGES } from '@/constants/chad';
import { useUpload } from '@/hooks/useUpload';
import { Radius, Shadows, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

/** Fallback until onLayout measures the guest auth panel. */
const GUEST_PANEL_FALLBACK_HEIGHT = 320;

type ThemeMode = 'light' | 'dark' | 'system';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { user, isLoading, signOut } = useAuth();
  const { language, setLanguage } = useAppLanguage();
  const router = useRouter();
  const { uploadFromUri } = useUpload();

  const updateProfile = useMutation(api.profiles.update);
  const updateAvatar = useMutation(api.profiles.updateAvatar);
  const updateLanguagePref = useMutation(api.users.updateLanguage);
  const changePassword = useAction(api.account.changePassword);

  const [personalSheet, setPersonalSheet] = useState(false);
  const [passwordSheet, setPasswordSheet] = useState(false);
  const [languageSheet, setLanguageSheet] = useState(false);
  const [avatarSheet, setAvatarSheet] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [guestPanelHeight, setGuestPanelHeight] = useState(GUEST_PANEL_FALLBACK_HEIGHT);

  const onGuestPanelLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.ceil(e.nativeEvent.layout.height);
    if (next > 0) setGuestPanelHeight(next);
  }, []);
  const profile = user?.profile;
  const isProvider = user?.role === 'provider';
  const isAdmin = user?.role === 'admin';

  const myServices = useQuery(api.services.getMine, isProvider ? {} : 'skip');
  const myPortfolio = useQuery(api.portfolio.listMine, isProvider ? {} : 'skip');
  const verificationStatus = useQuery(
    api.verification.getStatus,
    isProvider ? {} : 'skip',
  );

  const servicesCount = myServices?.length ?? 0;
  const skillsCount = profile?.skills?.length ?? 0;
  const portfolioCount = myPortfolio?.length ?? 0;
  const isVerified = !!profile?.isVerified;
  const isPremium = !!profile?.isPremium;
  const verificationRequestStatus = verificationStatus?.status;

  const servicesBadge =
    myServices === undefined
      ? undefined
      : servicesCount === 0
        ? { label: t('profile.badgeToComplete'), tone: 'amber' as const }
        : { label: String(servicesCount), tone: 'orbit' as const };

  const skillsBadge =
    skillsCount === 0
      ? { label: t('profile.badgeToComplete'), tone: 'amber' as const }
      : { label: String(skillsCount), tone: 'orbit' as const };

  const portfolioBadge =
    myPortfolio === undefined
      ? undefined
      : portfolioCount === 0
        ? { label: t('profile.badgeToComplete'), tone: 'amber' as const }
        : { label: String(portfolioCount), tone: 'orbit' as const };

  const verificationBadge = (() => {
    if (isVerified || verificationRequestStatus === 'approved') {
      return { label: t('profile.badgeVerified'), tone: 'orbit' as const };
    }
    if (verificationRequestStatus === 'pending') {
      return { label: t('profile.badgePending'), tone: 'orbit' as const };
    }
    if (verificationRequestStatus === 'rejected') {
      return { label: t('profile.badgeRetry'), tone: 'amber' as const };
    }
    if (verificationStatus === undefined) return undefined;
    return { label: t('profile.badgeToVerify'), tone: 'amber' as const };
  })();

  const premiumBadge = isPremium
    ? { label: t('profile.badgePremiumActive'), tone: 'orbit' as const }
    : { label: t('profile.badgeGoPremium'), tone: 'amber' as const };

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.name ?? t('profile.defaultName');

  const initials = useMemo(() => {
    const a = profile?.firstName?.[0] ?? user?.name?.[0] ?? '?';
    const b = profile?.lastName?.[0] ?? '';
    return `${a}${b}`.toUpperCase();
  }, [profile?.firstName, profile?.lastName, user?.name]);

  const roleLabel = useMemo(() => {
    if (!user?.role) return undefined;
    if (user.role === 'admin') return t('profile.roleAdmin');
    if (user.role === 'provider') return t('auth.provider');
    return t('auth.client');
  }, [t, user?.role]);

  const themeLabel = useMemo(() => {
    if (mode === 'light') return t('profile.themeLight');
    if (mode === 'dark') return t('profile.themeDark');
    return t('profile.themeSystem');
  }, [mode, t]);

  const appearanceIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Desktop;

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeLabel ?? language;

  const openPersonalSheet = () => {
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setProfileError('');
    setPersonalSheet(true);
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError(t('profile.personalInfoRequired'));
      return;
    }
    if (!profile) {
      setProfileError(t('profile.personalInfoUnavailable'));
      return;
    }
    setSavingProfile(true);
    setProfileError('');
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setPersonalSheet(false);
    } catch (err) {
      console.error(err);
      setProfileError(t('profile.personalInfoError'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError(t('profile.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSheet(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert({
        title: t('profile.passwordChangedTitle'),
        message: t('profile.passwordChangedBody'),
      });
    } catch (err) {
      console.error(err);
      setPasswordError(t('profile.passwordChangeError'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLanguageSelect = async (code: (typeof SUPPORTED_LANGUAGES)[number]['code']) => {
    setLanguage(code);
    if (user) {
      try {
        await updateLanguagePref({ language: code });
      } catch (err) {
        console.error(err);
      }
    }
    setLanguageSheet(false);
  };

  const cycleTheme = () => {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(mode);
    setMode(order[(idx + 1) % order.length]!);
  };

  const handleLogout = () => {
    confirm({
      title: t('auth.logout'),
      message: t('profile.logoutConfirm'),
      confirmLabel: t('auth.logout'),
      destructive: true,
      onConfirm: async () => {
        await clearOnboardingSeen();
        await signOut();
        router.replace('/(auth)/onboarding');
      },
    });
  };

  const pickAndUploadAvatar = useCallback(
    async (source: 'camera' | 'library') => {
      if (!profile) {
        alert({ title: t('profile.avatarUnavailable') });
        return;
      }
      setAvatarSheet(false);
      setAvatarLoading(true);
      try {
        let asset: ImagePicker.ImagePickerAsset | null = null;
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            alert({ title: t('profile.cameraPermission') });
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
          });
          if (!result.canceled) asset = result.assets[0] ?? null;
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            alert({ title: t('profile.galleryPermission') });
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
          });
          if (!result.canceled) asset = result.assets[0] ?? null;
        }
        if (!asset) return;
        const storageId = await uploadFromUri(asset.uri, asset.mimeType ?? 'image/jpeg');
        await updateAvatar({ storageId });
      } catch (err) {
        console.error(err);
        alert({
          title: t('common.error'),
          message: t('profile.avatarUploadError'),
        });
      } finally {
        setAvatarLoading(false);
      }
    },
    [profile, t, updateAvatar, uploadFromUri, alert],
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.orbit} />
      </View>
    );
  }

  const isGuest = user === null;

  if (isGuest) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <PageScaffold
          title={t('profile.title')}
          subtitle={t('auth.guestSubtitle')}
          bottomInset={false}
          contentContainerStyle={{
            paddingBottom: guestPanelHeight + Spacing.four,
          }}
        >
          <View style={{ paddingHorizontal: PAGE_H_PAD }}>
            <SettingsSection title={t('profile.sectionPreferences')} spaced={false}>
              <SettingsRow
                icon={Globe}
                title={t('profile.language')}
                description={currentLanguageLabel}
                onPress={() => setLanguageSheet(true)}
              />
              <SettingsRow
                icon={appearanceIcon}
                title={t('profile.appearance')}
                description={themeLabel}
                onPress={cycleTheme}
                showChevron={false}
              />
            </SettingsSection>

            <SettingsSection title={t('profile.sectionSupport')}>
              <SettingsRow
                icon={Info}
                title={t('profile.about')}
                description={t('profile.aboutRowDesc')}
                onPress={() => router.push('/about')}
              />
              <SettingsRow
                icon={ShieldCheck}
                title={t('profile.privacy')}
                description={t('profile.privacyRowDesc')}
                onPress={() => router.push('/legal/privacy')}
              />
              <SettingsRow
                icon={FileText}
                title={t('profile.terms')}
                description={t('profile.termsRowDesc')}
                onPress={() => router.push('/legal/terms')}
              />
            </SettingsSection>
          </View>

          <GuestSheets
            languageSheet={languageSheet}
            setLanguageSheet={setLanguageSheet}
            language={language}
            onLanguageSelect={handleLanguageSelect}
          />
        </PageScaffold>

        <View
          onLayout={onGuestPanelLayout}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
          }}
        >
          <View
            style={{
              backgroundColor: colors.canvas,
              borderTopLeftRadius: Radius.xl,
              borderTopRightRadius: Radius.xl,
              paddingHorizontal: PAGE_H_PAD,
              paddingBottom: Spacing.four,
              overflow: 'hidden',
              ...Shadows.elevated,
            }}
          >
            <View
              style={{
                alignItems: 'center',
                paddingTop: Spacing.three,
                paddingBottom: Spacing.two,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            <GuestProfileHeader
              compact
              title={t('auth.guestTitle')}
              subtitle={t('profile.guestPanelHint')}
              signInLabel={t('auth.signIn')}
              signUpLabel={t('auth.signUp')}
              onPressSignIn={() => router.push('/(auth)/login')}
              onPressSignUp={() => router.push('/(auth)/register')}
              onPressAvatar={() => router.push('/(auth)/login')}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <PageScaffold
      title={t('profile.title')}
      subtitle={t('profile.subtitle')}
      bottomInset={false}
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD }}>
        <ProfileHeader
          displayName={displayName}
          email={user?.email ?? undefined}
          roleLabel={roleLabel}
          avatarUrl={profile?.avatarUrl}
          initials={initials}
          isPremium={!!profile?.isPremium}
          isVerified={!!profile?.isVerified}
          verifiedLabel={t('common.verified')}
          premiumLabel={t('common.premium')}
          onEditAvatar={profile ? () => setAvatarSheet(true) : undefined}
          avatarLoading={avatarLoading}
        />

        {isProvider ? (
          <>
            <SettingsSection title={t('profile.stats')} spaced={false}>
              <ProviderStatsGrid
                viewCount={profile?.viewCount ?? 0}
                completedOrders={profile?.completedOrders ?? 0}
                averageRating={profile?.averageRating ?? 0}
                trustScore={profile?.trustScore ?? 0}
              />
            </SettingsSection>

            <SettingsSection title={t('profile.sectionProvider')}>
              <SettingsRow
                icon={Wrench}
                title={t('profile.myServices')}
                badge={servicesBadge}
                description={t('profile.myServicesDesc')}
                onPress={() => router.push('/provider/services')}
              />
              <SettingsRow
                icon={Lightning}
                title={t('skills.title')}
                badge={skillsBadge}
                description={t('profile.skillsDesc')}
                onPress={() => router.push('/skills')}
              />
              <SettingsRow
                icon={Images}
                title={t('service.portfolio')}
                badge={portfolioBadge}
                description={t('profile.portfolioDesc')}
                onPress={() => router.push('/portfolio')}
              />
              {profile?._id ? (
                <SettingsRow
                  icon={UserFocus}
                  title={t('profile.publicProfile')}
                  description={t('profile.publicProfileDesc')}
                  onPress={() =>
                    router.push({ pathname: '/provider/[id]', params: { id: profile._id } })
                  }
                />
              ) : null}
              <SettingsRow
                icon={ShieldCheck}
                title={t('profile.verification')}
                badge={verificationBadge}
                description={t('profile.verificationDesc')}
                onPress={() => router.push('/verification')}
              />
              <SettingsRow
                icon={Crown}
                title={t('profile.premium')}
                badge={premiumBadge}
                description={t('profile.premiumDesc')}
                onPress={() => router.push('/premium')}
              />
            </SettingsSection>
          </>
        ) : null}

        <SettingsSection title={t('profile.sectionAccount')} spaced={isProvider}>
          <SettingsRow
            icon={User}
            title={t('profile.personalInfo')}
            description={t('profile.personalInfoDesc')}
            onPress={openPersonalSheet}
          />
          <SettingsRow
            icon={Lock}
            title={t('profile.password')}
            description={t('profile.passwordDesc')}
            onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordError('');
              setPasswordSheet(true);
            }}
          />
          {!isProvider ? (
            <SettingsRow
              icon={ShoppingBag}
              title={t('orders.title')}
              description={t('profile.ordersDesc')}
              onPress={() => router.push('/(tabs)/orders')}
            />
          ) : null}
          {isAdmin ? (
            <SettingsRow
              icon={SquaresFour}
              title={t('profile.administration')}
              description={t('profile.administrationDesc')}
              onPress={() => router.push('/admin')}
            />
          ) : null}
          <SettingsRow
            icon={Bell}
            title={t('profile.notifications')}
            description={t('profile.notificationsDesc')}
            onPress={() => router.push('/notifications')}
          />
          <SettingsRow
            icon={DotsThree}
            title={t('profile.moreActions')}
            description={t('profile.moreActionsDesc')}
            onPress={() => router.push('/account/danger-zone')}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sectionPreferences')}>
          <SettingsRow
            icon={Globe}
            title={t('profile.language')}
            description={currentLanguageLabel}
            onPress={() => setLanguageSheet(true)}
          />
          <SettingsRow
            icon={appearanceIcon}
            title={t('profile.appearance')}
            description={themeLabel}
            onPress={cycleTheme}
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sectionSupport')}>
          <SettingsRow
            icon={Headset}
            title={t('profile.helpSupport')}
            description={t('profile.helpSupportDesc')}
            onPress={() => Linking.openURL('mailto:support@talenttchad.com')}
          />
          <SettingsRow
            icon={Info}
            title={t('profile.about')}
            description={t('profile.aboutRowDesc')}
            onPress={() => router.push('/about')}
          />
          <SettingsRow
            icon={ShieldCheck}
            title={t('profile.privacy')}
            description={t('profile.privacyRowDesc')}
            onPress={() => router.push('/legal/privacy')}
          />
          <SettingsRow
            icon={FileText}
            title={t('profile.terms')}
            description={t('profile.termsRowDesc')}
            onPress={() => router.push('/legal/terms')}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sectionSession')}>
          <SettingsRow
            icon={SignOut}
            title={t('auth.logout')}
            description={t('profile.logoutDesc')}
            onPress={handleLogout}
            destructive
            showChevron={false}
          />
        </SettingsSection>
      </View>

      <AppBottomSheet
        visible={personalSheet}
        onClose={() => setPersonalSheet(false)}
        title={t('profile.personalInfo')}
        subtitle={t('profile.personalInfoSheetSubtitle')}
      >
        {profileError ? (
          <Text style={[textStyle('caption'), { color: colors.error, marginBottom: Spacing.three }]}>
            {profileError}
          </Text>
        ) : null}
        <AuthField
          label={t('profile.firstName')}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Amina"
          leftIcon={<User size={20} />}
          autoCapitalize="words"
        />
        <AuthField
          label={t('profile.lastName')}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Deby"
          leftIcon={<User size={20} />}
          autoCapitalize="words"
        />
        <AuthField
          label={t('auth.email')}
          value={user?.email ?? ''}
          editable={false}
          hint={t('profile.emailReadOnly')}
          placeholder="vous@exemple.com"
          leftIcon={<Envelope size={20} />}
        />
        <AuthField
          label={t('profile.accountType')}
          value={roleLabel ?? ''}
          editable={false}
          hint={t('profile.accountTypeReadOnly')}
          placeholder={t('profile.accountType')}
          leftIcon={<IdentificationCard size={20} />}
        />
        <AuthPrimaryButton
          title={t('common.save')}
          onPress={handleSaveProfile}
          loading={savingProfile}
        />
      </AppBottomSheet>

      <AppBottomSheet
        visible={passwordSheet}
        onClose={() => setPasswordSheet(false)}
        title={t('profile.password')}
        subtitle={t('profile.passwordSheetSubtitle')}
      >
        {passwordError ? (
          <Text style={[textStyle('caption'), { color: colors.error, marginBottom: Spacing.three }]}>
            {passwordError}
          </Text>
        ) : null}
        <AuthField
          label={t('profile.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          isPassword
          showPassword={showCurrentPassword}
          onTogglePassword={() => setShowCurrentPassword((v) => !v)}
          placeholder="••••••••"
          leftIcon={<Lock size={20} />}
        />
        <AuthField
          label={t('profile.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          isPassword
          showPassword={showNewPassword}
          onTogglePassword={() => setShowNewPassword((v) => !v)}
          placeholder="Au moins 8 caractères"
          leftIcon={<Lock size={20} />}
        />
        <PasswordStrengthMeter password={newPassword} />
        <AuthField
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword((v) => !v)}
          placeholder="••••••••"
          leftIcon={<Lock size={20} />}
        />
        <AuthPrimaryButton
          title={t('profile.changePassword')}
          onPress={handleSavePassword}
          loading={savingPassword}
          disabled={!currentPassword || newPassword.length < 8}
        />
      </AppBottomSheet>

      <AppBottomSheet
        visible={avatarSheet}
        onClose={() => setAvatarSheet(false)}
        title={t('profile.avatarTitle')}
        subtitle={t('profile.avatarSubtitle')}
      >
        <SettingsRow
          icon={Camera}
          title={t('profile.avatarCamera')}
          onPress={() => pickAndUploadAvatar('camera')}
          showChevron={false}
        />
        <SettingsRow
          icon={ImageIcon}
          title={t('profile.avatarGallery')}
          onPress={() => pickAndUploadAvatar('library')}
          showChevron={false}
        />
      </AppBottomSheet>

      <GuestSheets
        languageSheet={languageSheet}
        setLanguageSheet={setLanguageSheet}
        language={language}
        onLanguageSelect={handleLanguageSelect}
      />
    </PageScaffold>
  );
}

interface GuestSheetsProps {
  languageSheet: boolean;
  setLanguageSheet: (v: boolean) => void;
  language: string;
  onLanguageSelect: (code: (typeof SUPPORTED_LANGUAGES)[number]['code']) => void;
}

function ProviderStatsGrid({
  viewCount,
  completedOrders,
  averageRating,
  trustScore,
}: {
  viewCount: number;
  completedOrders: number;
  averageRating: number;
  trustScore: number;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const stats = [
    {
      key: 'views',
      label: t('providerDashboard.statViews'),
      value: String(viewCount),
      icon: Eye,
    },
    {
      key: 'orders',
      label: t('providerDashboard.statOrders'),
      value: String(completedOrders),
      icon: ClipboardText,
    },
    {
      key: 'rating',
      label: t('providerDashboard.statRating'),
      value: averageRating.toFixed(1),
      icon: Star,
    },
    {
      key: 'trust',
      label: t('providerDashboard.statTrust'),
      value: String(trustScore),
      icon: ShieldCheck,
    },
  ] as const;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.four,
      }}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isLastCol = index % 2 === 1;
        const isBottomRow = index >= 2;
        return (
          <View
            key={stat.key}
            style={{
              width: '50%',
              paddingRight: isLastCol ? 0 : Spacing.two,
              paddingLeft: isLastCol ? Spacing.two : 0,
              paddingBottom: isBottomRow ? 0 : Spacing.four,
              paddingTop: isBottomRow ? Spacing.two : 0,
              borderRightWidth: isLastCol ? 0 : 0.1,
              borderBottomWidth: isBottomRow ? 0 : 0.1,
              borderColor: colors.borderHairline,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.orbitWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} color={colors.orbit} weight="fill" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[
                    textStyle('featureHeading'),
                    {
                      color: colors.ink,
                      fontSize: 22,
                      lineHeight: 28,
                    },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    marginTop: 1,
                  }}
                  numberOfLines={1}
                >
                  {stat.label}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function GuestSheets({
  languageSheet,
  setLanguageSheet,
  language,
  onLanguageSelect,
}: GuestSheetsProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <AppBottomSheet
      visible={languageSheet}
      onClose={() => setLanguageSheet(false)}
      title={t('profile.language')}
      subtitle={t('profile.languageSheetSubtitle')}
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <Pressable
          key={lang.code}
          onPress={() => onLanguageSelect(lang.code)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: Spacing.three,
              paddingHorizontal: Spacing.two,
              borderRadius: 12,
              backgroundColor: language === lang.code ? colors.orbitWash : 'transparent',
              marginBottom: Spacing.one,
            }}
          >
            <Text style={[textStyle('body'), { color: colors.ink, fontWeight: '600' }]}>
              {lang.nativeLabel}
            </Text>
            {language === lang.code ? (
              <Text style={[textStyle('caption'), { color: colors.orbit }]}>✓</Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </AppBottomSheet>
  );
}
