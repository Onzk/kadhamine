import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import {
  Buildings,
  Envelope,
  Phone,
  CurrencyCircleDollar,
  Percent,
} from 'phosphor-react-native';

import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { SheetActionsFooter } from '@/components/ui/SheetActions';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily } from '@/theme/typography';
import { api } from '../../../convex/_generated/api';

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();
  const platform = useQuery(api.settings.getPlatform);
  const updatePlatform = useMutation(api.settings.updatePlatform);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [currency, setCurrency] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!platform || sheetOpen) return;
    setName(platform.name);
    setSupportEmail(platform.supportEmail);
    setSupportPhone(platform.supportPhone);
    setCurrency(platform.currency);
    setCommissionPercent(String(Math.round(platform.commissionRate * 100)));
  }, [platform, sheetOpen]);

  const openSheet = () => {
    if (platform) {
      setName(platform.name);
      setSupportEmail(platform.supportEmail);
      setSupportPhone(platform.supportPhone);
      setCurrency(platform.currency);
      setCommissionPercent(String(Math.round(platform.commissionRate * 100)));
    }
    setSheetOpen(true);
  };

  const handleSave = async () => {
    const value = Number(commissionPercent.replace(',', '.'));
    if (Number.isNaN(value) || value < 0 || value > 100) {
      alert({
        title: t('common.error'),
        message: t('admin.invalidCommission'),
      });
      return;
    }

    setLoading(true);
    try {
      await updatePlatform({
        name: name.trim() || undefined,
        supportEmail: supportEmail.trim() || undefined,
        supportPhone: supportPhone.trim(),
        currency: currency.trim() || undefined,
        commissionRate: value / 100,
      });
      setSheetOpen(false);
      alert({
        title: t('admin.success'),
        message: t('admin.settingsSaved'),
      });
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.errorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageScaffold
      title={t('admin.settingsTitle')}
      subtitle={t('admin.settingsSubtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four, gap: Spacing.four }}>
        <View
          style={{
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            padding: Spacing.five,
            borderWidth: 0.1,
            borderColor: colors.border,
            gap: Spacing.three,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: fontFamily('body', 'bold'),
              color: colors.ink,
            }}
          >
            {platform?.name ?? '—'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {platform?.supportEmail ?? '—'}
          </Text>
          {platform?.supportPhone ? (
            <Text style={{ fontSize: 13, color: colors.muted }}>{platform.supportPhone}</Text>
          ) : null}
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {platform
              ? t('admin.currentCommission', {
                  rate: Math.round(platform.commissionRate * 100),
                  currency: platform.currency,
                })
              : t('common.loading')}
          </Text>
          <Text style={{ fontSize: 13, color: colors.body }}>{t('admin.commissionHint')}</Text>
        </View>

        <AuthPrimaryButton
          title={t('admin.editSettings')}
          tone="ink"
          flat
          onPress={openSheet}
          disabled={platform == null}
        />
      </View>

      <AppBottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('admin.editSettingsTitle')}
        subtitle={t('admin.editSettingsSubtitle')}
        footer={
          <SheetActionsFooter>
            <AuthPrimaryButton
              title={t('common.save')}
              tone="ink"
              flat
              loading={loading}
              onPress={handleSave}
            />
          </SheetActionsFooter>
        }
      >
        <AuthField
          label={t('admin.platformName')}
          value={name}
          onChangeText={setName}
          placeholder="Kadhamine"
          leftIcon={<Buildings size={20} />}
        />
        <AuthField
          label={t('admin.supportEmail')}
          value={supportEmail}
          onChangeText={setSupportEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="support@talenttchad.com"
          leftIcon={<Envelope size={20} />}
        />
        <AuthField
          label={t('admin.supportPhone')}
          value={supportPhone}
          onChangeText={setSupportPhone}
          keyboardType="phone-pad"
          placeholder="+235…"
          leftIcon={<Phone size={20} />}
        />
        <AuthField
          label={t('admin.currency')}
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
          placeholder="XAF"
          leftIcon={<CurrencyCircleDollar size={20} />}
        />
        <AuthField
          label={t('admin.commissionRate')}
          value={commissionPercent}
          onChangeText={setCommissionPercent}
          keyboardType="decimal-pad"
          placeholder="10"
          leftIcon={<Percent size={20} />}
        />
      </AppBottomSheet>
    </PageScaffold>
  );
}
