import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ExpressionRating } from '@/components/reviews/ExpressionRating';
import { ReviewTagPicker } from '@/components/reviews/ReviewTagPicker';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/ThemedText';
import {
  CLIENT_REVIEW_OPTIONS,
  PROVIDER_REVIEW_OPTIONS,
  SERVICE_REVIEW_OPTIONS,
  buildReviewCommentBlock,
  type ReviewOptionDef,
} from '@/constants/reviews';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

export type ProviderServiceReviewValue = {
  rating: number;
  providerTagIds: string[];
  serviceTagIds: string[];
  freeText: string;
  comment: string;
};

export type ClientReviewValue = {
  rating: number;
  tagIds: string[];
  freeText: string;
  comment: string;
};

/** Blocs affichables — pour stepper checkout / pages dédiées. */
export type ReviewFormPart =
  | 'rating'
  | 'providerTags'
  | 'serviceTags'
  | 'comment'
  | 'clientTags';

type ProviderServiceProps = {
  mode: 'providerService';
  value: ProviderServiceReviewValue;
  onChange: (next: ProviderServiceReviewValue) => void;
  parts?: ReviewFormPart[];
  requiredHint?: string;
};

type ClientProps = {
  mode: 'client';
  value: ClientReviewValue;
  onChange: (next: ClientReviewValue) => void;
  parts?: ReviewFormPart[];
  requiredHint?: string;
};

type Props = ProviderServiceProps | ClientProps;

function resolveOptionLabel(
  t: (key: string, opts?: { defaultValue?: string }) => string,
  opt: ReviewOptionDef,
) {
  return t(opt.i18nKey, { defaultValue: opt.labelFr });
}

/** Card blanche autour d’un groupe (note / options / commentaire). */
function SectionCard({
  children,
  paddingBottom,
}: {
  children: React.ReactNode;
  paddingBottom?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceCard,
        borderRadius: Radius.lg,
        borderWidth: BorderWidth.default,
        borderColor: colors.borderStrong,
        padding: Spacing.five,
        paddingBottom: paddingBottom ?? Spacing.five,
        gap: Spacing.four,
      }}
    >
      {children}
    </View>
  );
}

export function emptyProviderServiceReview(): ProviderServiceReviewValue {
  return {
    rating: 0,
    providerTagIds: [],
    serviceTagIds: [],
    freeText: '',
    comment: '',
  };
}

export function emptyClientReview(): ClientReviewValue {
  return {
    rating: 0,
    tagIds: [],
    freeText: '',
    comment: '',
  };
}

export function OrderReviewForm(props: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const expressionLabels = useMemo(
    () => [
      t('reviews.expression.1'),
      t('reviews.expression.2'),
      t('reviews.expression.3'),
      t('reviews.expression.4'),
      t('reviews.expression.5'),
    ],
    [t],
  );

  if (props.mode === 'client') {
    const parts = props.parts ?? (['rating', 'clientTags', 'comment'] as ReviewFormPart[]);
    const { value, onChange } = props;
    const clientOptions = CLIENT_REVIEW_OPTIONS.map((opt) => ({
      id: opt.id,
      label: resolveOptionLabel(t, opt),
    }));

    const push = (partial: Partial<ClientReviewValue>) => {
      const next = { ...value, ...partial };
      const labels = next.tagIds.map((id) => {
        const opt = CLIENT_REVIEW_OPTIONS.find((o) => o.id === id);
        return opt ? resolveOptionLabel(t, opt) : id;
      });
      next.comment = buildReviewCommentBlock({
        clientHeading: t('reviews.clientTagsHeading'),
        clientLabels: labels,
        freeText: next.freeText,
      });
      onChange(next);
    };

    return (
      <View style={{ gap: Spacing.five }}>
        {parts.includes('rating') ? (
          <SectionCard paddingBottom={Spacing.three}>
            <Text
              style={{
                fontFamily: fontFamily('body', 'medium'),
                fontSize: 16,
                color: colors.ink,
                textAlign: 'center',
              }}
            >
              {t('reviews.experiencePrompt')}
            </Text>
            <ExpressionRating
              value={value.rating}
              onChange={(rating) => push({ rating })}
              labels={expressionLabels}
            />
          </SectionCard>
        ) : null}

        {parts.includes('clientTags') ? (
          <SectionCard>
            <ReviewTagPicker
              title={t('reviews.clientTagsTitle')}
              subtitle={t('reviews.tagsPickHint')}
              options={clientOptions}
              selected={value.tagIds}
              onChange={(tagIds) => push({ tagIds })}
            />
          </SectionCard>
        ) : null}

        {parts.includes('comment') ? (
          <SectionCard>
            <Input
              label={t('reviews.comment')}
              value={value.freeText}
              onChangeText={(freeText) => push({ freeText })}
              placeholder={t('reviews.commentPlaceholder')}
              multiline
              numberOfLines={4}
              style={{ minHeight: 112, textAlignVertical: 'top' }}
            />
          </SectionCard>
        ) : null}

        {props.requiredHint ? (
          <Text style={[textStyle('caption'), { color: colors.muted, lineHeight: 18 }]}>
            {props.requiredHint}
          </Text>
        ) : null}
      </View>
    );
  }

  const parts =
    props.parts ??
    (['rating', 'providerTags', 'serviceTags', 'comment'] as ReviewFormPart[]);
  const { value, onChange } = props;
  const providerOptions = PROVIDER_REVIEW_OPTIONS.map((opt) => ({
    id: opt.id,
    label: resolveOptionLabel(t, opt),
  }));
  const serviceOptions = SERVICE_REVIEW_OPTIONS.map((opt) => ({
    id: opt.id,
    label: resolveOptionLabel(t, opt),
  }));

  const push = (partial: Partial<ProviderServiceReviewValue>) => {
    const next = { ...value, ...partial };
    next.comment = buildReviewCommentBlock({
      providerHeading: t('reviews.providerTagsHeading'),
      providerLabels: next.providerTagIds.map((id) => {
        const opt = PROVIDER_REVIEW_OPTIONS.find((o) => o.id === id);
        return opt ? resolveOptionLabel(t, opt) : id;
      }),
      serviceHeading: t('reviews.serviceTagsHeading'),
      serviceLabels: next.serviceTagIds.map((id) => {
        const opt = SERVICE_REVIEW_OPTIONS.find((o) => o.id === id);
        return opt ? resolveOptionLabel(t, opt) : id;
      }),
      freeText: next.freeText,
    });
    onChange(next);
  };

  return (
    <View style={{ gap: Spacing.five }}>
      {parts.includes('rating') ? (
        <SectionCard paddingBottom={Spacing.three}>
          <Text
            style={{
              fontFamily: fontFamily('body', 'medium'),
              fontSize: 16,
              color: colors.ink,
              textAlign: 'center',
            }}
          >
            {t('reviews.experiencePrompt')}
          </Text>
          <ExpressionRating
            value={value.rating}
            onChange={(rating) => push({ rating })}
            labels={expressionLabels}
          />
        </SectionCard>
      ) : null}

      {parts.includes('providerTags') ? (
        <SectionCard>
          <ReviewTagPicker
            title={t('reviews.providerTagsTitle')}
            subtitle={t('reviews.tagsPickHint')}
            options={providerOptions}
            selected={value.providerTagIds}
            onChange={(providerTagIds) => push({ providerTagIds })}
          />
        </SectionCard>
      ) : null}

      {parts.includes('serviceTags') ? (
        <SectionCard>
          <ReviewTagPicker
            title={t('reviews.serviceTagsTitle')}
            subtitle={t('reviews.tagsPickHint')}
            options={serviceOptions}
            selected={value.serviceTagIds}
            onChange={(serviceTagIds) => push({ serviceTagIds })}
          />
        </SectionCard>
      ) : null}

      {parts.includes('comment') ? (
        <SectionCard>
          <Input
            label={t('reviews.comment')}
            value={value.freeText}
            onChangeText={(freeText) => push({ freeText })}
            placeholder={t('reviews.commentPlaceholder')}
            multiline
            numberOfLines={4}
            style={{ minHeight: 112, textAlignVertical: 'top' }}
          />
        </SectionCard>
      ) : null}

      {props.requiredHint ? (
        <Text style={[textStyle('caption'), { color: colors.muted, lineHeight: 18 }]}>
          {props.requiredHint}
        </Text>
      ) : null}
    </View>
  );
}

export function useProviderServiceReviewState() {
  return useState(emptyProviderServiceReview);
}
