import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/providers/ThemeProvider';
import { api } from '../../../convex/_generated/api';

export default function AdminReviewsScreen() {
  const { colors } = useAppTheme();
  const reviews = useQuery(api.admin.listPendingReviews);
  const moderate = useMutation(api.admin.moderateReview);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Modération des avis" showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {reviews?.map(({ review, client }) => (
          <View
            key={review._id}
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <StarRating rating={review.rating} />
            {review.comment && (
              <Text style={{ fontSize: 14, color: colors.body, marginTop: 8 }}>{review.comment}</Text>
            )}
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {client?.email}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button
                title="Approuver"
                onPress={() => moderate({ reviewId: review._id, isVisible: true })}
                style={{ flex: 1 }}
              />
              <Button
                title="Masquer"
                variant="danger"
                onPress={() =>
                  moderate({
                    reviewId: review._id,
                    isVisible: false,
                    reason: 'Contenu inapproprié',
                  })
                }
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
