import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from 'convex/react';
import { Star } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const existing = useQuery(
    api.reviews.getByOrder,
    orderId ? { orderId: orderId as Id<'orders'> } : 'skip',
  );
  const createReview = useMutation(api.reviews.create);
  const ratingColor = colors.rating ?? colors.accentSoft;

  const handleSubmit = async () => {
    if (!orderId) return;
    if (rating < 1 || rating > 5) {
      Alert.alert(t('common.error'), t('reviews.rating'));
      return;
    }
    setLoading(true);
    try {
      await createReview({
        orderId: orderId as Id<'orders'>,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert(t('reviews.thanks'), undefined, [
        { text: t('common.done'), onPress: () => router.replace('/(tabs)/orders') },
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (existing === undefined) {
    return (
      <PageScaffold
        title={t('reviews.leaveReview')}
        subtitle="Partagez votre expérience pour aider la communauté."
        showBack
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
          <Text style={{ textAlign: 'center', marginTop: 32, color: colors.muted }}>
            {t('common.loading')}
          </Text>
        </View>
      </PageScaffold>
    );
  }

  if (existing) {
    return (
      <PageScaffold
        title={t('reviews.title')}
        subtitle="Consultez les avis liés à cette commande."
        showBack
      >
        <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
          <Text style={{ fontSize: 15, color: colors.body, marginBottom: 12 }}>
            {t('reviews.thanks')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={28}
                color={ratingColor}
                weight={star <= existing.rating ? 'fill' : 'regular'}
              />
            ))}
          </View>
          {existing.comment ? (
            <Text style={{ fontSize: 14, color: colors.muted }}>{existing.comment}</Text>
          ) : null}
          <Button
            title={t('orders.title')}
            onPress={() => router.replace('/(tabs)/orders')}
            fullWidth
            style={{ marginTop: 24 }}
          />
        </View>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      title={t('reviews.leaveReview')}
      subtitle="Partagez votre expérience pour aider la communauté."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 12 }}>
          {t('reviews.rating')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              style={{
                padding: 8,
                borderRadius: Radius.md,
                backgroundColor: star <= rating ? colors.iconWash : colors.surfaceStrong,
              }}
            >
              <Star
                size={32}
                color={ratingColor}
                weight={star <= rating ? 'fill' : 'regular'}
              />
            </Pressable>
          ))}
        </View>

        <Input
          label={t('reviews.comment')}
          value={comment}
          onChangeText={setComment}
          placeholder={t('reviews.commentPlaceholder')}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />

        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>
          {t('reviews.officialOnly')}
        </Text>

        <Button
          title={t('reviews.submit')}
          onPress={handleSubmit}
          loading={loading}
          fullWidth
        />
      </View>
    </PageScaffold>
  );
}
