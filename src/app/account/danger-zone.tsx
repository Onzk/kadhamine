import React, { useState } from 'react';
import { View, Text, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAction } from 'convex/react';
import { Trash, WarningCircle } from 'phosphor-react-native';

import {
  AuthField,
  AuthPrimaryButton,
} from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

export default function DangerZoneScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { confirm } = useAppDialog();
  const { signOut } = useAuth();
  const router = useRouter();
  const deleteAccount = useAction(api.account.deleteAccount);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = () => {
    confirm({
      title: t('profile.deleteAccountTitle'),
      message: t('profile.deleteAccountConfirm'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: async () => {
        if (password.length < 6) {
          setError(t('profile.deleteAccountPasswordRequired'));
          return false;
        }
        setLoading(true);
        setError('');
        try {
          await deleteAccount({ password });
          await signOut();
          router.replace('/(tabs)/profile');
        } catch (err) {
          console.error(err);
          setError(t('profile.deleteAccountError'));
          return false;
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <PageScaffold
      title={t('profile.moreActions')}
      subtitle={t('profile.dangerZoneSubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: Spacing.three,
            backgroundColor: colors.error + '10',
            borderRadius: Radius.lg,
            padding: Spacing.four,
            borderWidth: 0.1,
            borderColor: colors.error + '30',
            marginBottom: Spacing.five,
          }}
        >
          <WarningCircle size={22} color={colors.error} weight="fill" />
          <Text style={[textStyle('body'), { color: colors.ink, flex: 1, lineHeight: 22 }]}>
            {t('profile.deleteAccountWarning')}
          </Text>
        </View>

        {error ? (
          <Text style={[textStyle('caption'), { color: colors.error, marginBottom: Spacing.three }]}>
            {error}
          </Text>
        ) : null}

        <AuthField
          label={t('profile.deleteAccountPasswordLabel')}
          value={password}
          onChangeText={setPassword}
          isPassword
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          autoComplete="password"
          textContentType="password"
        />

        <AuthPrimaryButton
          title={t('profile.deleteAccountAction')}
          onPress={handleDelete}
          loading={loading}
          disabled={password.length < 6}
          icon={<Trash size={18} />}
        />

        <View style={{ marginTop: Spacing.six }}>
          <Text
            style={[textStyle('caption'), { color: colors.muted, textAlign: 'center' }]}
            onPress={() => Linking.openURL('mailto:support@talenttchad.com')}
          >
            {t('profile.supportEmail')}
          </Text>
        </View>
      </View>
    </PageScaffold>
  );
}
