import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { CheckCircle, WarningCircle } from 'phosphor-react-native';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { AuthPrimaryButton } from '@/components/auth/AuthField';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { Badge } from '@/components/ui/Badge';
import {
  ImagePickerField,
  type ImagePickerValueItem,
} from '@/components/ui/ImagePickerField';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

type DocType = 'national_id' | 'passport';

export default function VerificationScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();

  const status = useQuery(api.verification.getStatus);
  const submit = useMutation(api.verification.submit);

  const [docType, setDocType] = useState<DocType>('national_id');
  const [document, setDocument] = useState<ImagePickerValueItem[]>([]);
  const [selfie, setSelfie] = useState<ImagePickerValueItem[]>([]);
  const [loading, setLoading] = useState(false);

  const canResubmit = !status || status.status === 'rejected';
  const isPending = status?.status === 'pending';
  const isApproved = status?.status === 'approved';
  const rejectionReason = status?.status === 'rejected' ? status.reviewNotes : undefined;

  const handleSubmit = async () => {
    const docId = document[0]?.storageId;
    const selfieId = selfie[0]?.storageId;
    if (!docId || !selfieId) {
      alert({
        title: t('verification.docsRequiredTitle'),
        message: t('verification.docsRequiredBody'),
      });
      return;
    }

    setLoading(true);
    try {
      await submit({
        documentType: docType,
        documentStorageId: docId as Id<'_storage'>,
        selfieStorageId: selfieId as Id<'_storage'>,
      });
      setDocument([]);
      setSelfie([]);
      alert({
        title: t('verification.submittedTitle'),
        message: t('verification.submittedBody'),
        icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
      });
    } catch (err) {
      alert({
        title: t('common.error'),
        message:
          err instanceof Error ? err.message : t('verification.submitError'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageScaffold
      title={t('profile.verification')}
      subtitle={t('verification.subtitle')}
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        {isPending ? (
          <Badge label={t('verification.statusPending')} variant="accent" />
        ) : null}
        {isApproved ? (
          <Badge label={t('verification.statusApproved')} variant="verified" />
        ) : null}
        {status?.status === 'rejected' ? (
          <Badge label={t('verification.statusRejected')} variant="danger" />
        ) : null}

        <Text
          style={{
            fontSize: 15,
            color: colors.body,
            marginVertical: 16,
            lineHeight: 22,
          }}
        >
          {t('verification.intro')}
        </Text>

        {rejectionReason ? (
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.two,
              backgroundColor: colors.error + '12',
              borderRadius: Radius.lg,
              padding: Spacing.three,
              marginBottom: Spacing.four,
              borderWidth: 0.1,
              borderColor: colors.error + '30',
            }}
          >
            <WarningCircle size={20} color={colors.error} weight="fill" />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  textStyle('caption'),
                  { color: colors.error, fontWeight: '600', marginBottom: 4 },
                ]}
              >
                {t('verification.rejectionTitle')}
              </Text>
              <Text style={[textStyle('caption'), { color: colors.error }]}>
                {rejectionReason}
              </Text>
            </View>
          </View>
        ) : null}

        {isApproved ? (
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>
            {t('verification.approvedHint')}
          </Text>
        ) : null}

        {isPending ? (
          <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>
            {t('verification.pendingHint')}
          </Text>
        ) : null}

        {canResubmit ? (
          <>
            <Text
              style={[
                textStyle('body'),
                {
                  color: colors.ink,
                  fontWeight: '600',
                  marginBottom: Spacing.two,
                },
              ]}
            >
              {t('verification.docType')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              <CategoryChip
                label={t('verification.nationalId')}
                selected={docType === 'national_id'}
                onPress={() => setDocType('national_id')}
              />
              <CategoryChip
                label={t('verification.passport')}
                selected={docType === 'passport'}
                onPress={() => setDocType('passport')}
              />
            </View>

            <ImagePickerField
              label={t('verification.document')}
              value={document}
              onChange={setDocument}
              maxCount={1}
              mode="camera"
              mediaTypes="images"
              style={{ marginBottom: Spacing.five }}
            />

            <ImagePickerField
              label={t('verification.selfie')}
              value={selfie}
              onChange={setSelfie}
              maxCount={1}
              mode="camera"
              mediaTypes="images"
              cameraFacing="front"
              style={{ marginBottom: Spacing.six }}
            />

            <AuthPrimaryButton
              title={t('verification.submit')}
              onPress={handleSubmit}
              loading={loading}
              disabled={!document[0]?.storageId || !selfie[0]?.storageId}
              tone="ink"
            />
          </>
        ) : null}
      </View>
    </PageScaffold>
  );
}
