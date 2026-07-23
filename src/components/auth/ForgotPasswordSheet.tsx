import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import { Envelope, WarningCircle } from 'phosphor-react-native';

import { AlertBottomSheet } from '@/components/ui/AlertBottomSheet';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import {
  AuthField,
  AuthPrimaryButton,
  isValidEmail,
} from '@/components/auth/AuthField';
import { SheetActionsFooter, SheetSingleAction } from '@/components/ui/SheetActions';
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

  const handleSuccessClose = () => {
    setSent(false);
    onClose();
  };

  return (
    <>
      <AppBottomSheet
        visible={visible && !sent}
        onClose={handleClose}
        title={t('auth.forgotPasswordTitle')}
        subtitle={t('auth.forgotPasswordSubtitle')}
        showClose={!loading}
      >
        <View style={{ alignSelf: 'stretch', width: '100%', gap: Spacing.one, paddingBottom: Spacing.four }}>
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

          <SheetActionsFooter style={{ marginTop: Spacing.one }}>
            <SheetSingleAction>
              <AuthPrimaryButton
                title={t('auth.forgotPasswordSend')}
                onPress={handleSendReset}
                loading={loading}
                disabled={!canSubmit}
                tone="ink"
                flat
              />
            </SheetSingleAction>
            <SheetSingleAction>
              <AuthPrimaryButton
                title={t('common.cancel')}
                onPress={handleClose}
                disabled={loading}
                tone="outline"
                flat
              />
            </SheetSingleAction>
          </SheetActionsFooter>
        </View>
      </AppBottomSheet>

      <AlertBottomSheet
        visible={visible && sent}
        onClose={handleSuccessClose}
        title={t('auth.forgotPasswordTitle')}
        message={t('auth.forgotPasswordSuccess', { email: email.trim() })}
        buttonLabel={t('common.done')}
      />
    </>
  );
}
