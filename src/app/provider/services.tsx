import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Wrench } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppTheme } from '@/providers/ThemeProvider';
import { api } from '../../../convex/_generated/api';

export default function ProviderServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const services = useQuery(api.services.getMine);
  const createService = useMutation(api.services.create);

  const handleCreate = async () => {
    if (!title || !description || !categoryId) return;
    setLoading(true);
    try {
      await createService({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId as Id<'categories'>,
        pricingType: price ? 'fixed' : 'negotiable',
        price: price ? parseInt(price, 10) : undefined,
      });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setPrice('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScreenHeader title={t('profile.myServices')} showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Button
          title={showForm ? t('common.cancel') : '+ Nouveau service'}
          onPress={() => setShowForm(!showForm)}
          fullWidth
          style={{ marginBottom: 16 }}
        />

        {showForm && (
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Input label="Titre" value={title} onChangeText={setTitle} />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <Input
              label="Prix (XAF, optionnel)"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {categories?.map((cat) => (
                <CategoryChip
                  key={cat._id}
                  label={cat.nameFr}
                  icon={cat.icon}
                  selected={categoryId === cat._id}
                  onPress={() => setCategoryId(cat._id)}
                />
              ))}
            </ScrollView>
            <Button title={t('common.save')} onPress={handleCreate} loading={loading} fullWidth />
          </View>
        )}

        {!services || services.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucun service"
            description="Créez votre premier service pour commencer à recevoir des commandes."
          />
        ) : (
          services.map((item) => (
            <View
              key={item.service._id}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
                {item.service.title}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                {item.category?.nameFr} · {item.service.isActive ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
