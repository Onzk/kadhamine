import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import { Envelope, CheckCircle, WarningCircle } from 'phosphor-react-native';

import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import {
  AuthField,
  AuthPrimaryButton,
  AuthGhostButton,
  isValidEmail,
} from '@/components/auth/AuthField';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

interface ForgotPasswordSheetProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordSheet({ visible, onClose, initialEmail = '' }: ForgotPasswordSheetProps) {
  const { t } = useTranslation();
  const { signIn } = useAuthActions();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState(initialEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setEmailTouched(false);
      setLoading(false);
      setError('');
      setSent(false);
    }
  }, [initialEmail, visible]);

  const emailError = emailTouched && email.length > 0 && !isValidEmail(email);
  const canSubmit = isValidEmail(email);

  const handleSendReset = async () => {
    setEmailTouched(true);
    if (!canSubmit) {
      setError(t('auth.forgotPasswordInvalidEmail'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signIn('password', { email: email.trim(), flow: 'reset' });
      setSent(true);
    } catch (err) {
      console.error(err);
      setError(t('auth.forgotPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={handleClose}
      title={t('auth.forgotPasswordTitle')}
      subtitle={sent ? undefined : t('auth.forgotPasswordSubtitle')}
      showClose={!loading}
    >
      {sent ? (
        <View style={{ gap: Spacing.four, paddingBottom: Spacing.two }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: Spacing.three,
              backgroundColor: colors.success + '12',
              borderRadius: Radius.lg,
              padding: Spacing.four,
              borderWidth: 0.1,
              borderColor: colors.success + '30',
            }}
          >
            <CheckCircle size={22} color={colors.success} weight="fill" />
            <Text style={[textStyle('body'), { color: colors.ink, flex: 1, lineHeight: 24 }]}>
              {t('auth.forgotPasswordSuccess', { email: email.trim() })}
            </Text>
          </View>
          <AuthPrimaryButton title={t('common.done')} onPress={handleClose} />
        </View>
      ) : (
        <View style={{ gap: Spacing.one, paddingBottom: Spacing.two }}>
          {error ? (
            <View
              accessibilityRole="alert"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.two,
                backgroundColor: colors.error + '12',
                borderRadius: Radius.lg,
                padding: Spacing.three,
                marginBottom: Spacing.three,
                borderWidth: 0.1,
                borderColor: colors.error + '30',
              }}
            >
              <WarningCircle size={18} color={colors.error} weight="fill" />
              <Text style={[textStyle('caption'), { color: colors.error, flex: 1 }]}>{error}</Text>
            </View>
          ) : null}

          <AuthField
            variant="light"
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            onBlur={() => setEmailTouched(true)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholder="vous@exemple.com"
            leftIcon={<Envelope size={20} />}
            error={emailError ? t('auth.forgotPasswordInvalidEmail') : undefined}
            accessibilityLabel={t('auth.email')}
            returnKeyType="send"
            onSubmitEditing={handleSendReset}
          />

          <View style={{ gap: Spacing.three, marginTop: Spacing.one }}>
            <AuthPrimaryButton
              title={t('auth.forgotPasswordSend')}
              onPress={handleSendReset}
              loading={loading}
              disabled={!canSubmit}
            />
            <AuthGhostButton title={t('common.cancel')} onPress={handleClose} />
          </View>
        </View>
      )}
    </AppBottomSheet>
  );
}
