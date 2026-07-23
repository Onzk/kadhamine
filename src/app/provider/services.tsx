import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from 'convex/react';
import { Wrench, Plus } from 'phosphor-react-native';
import type { Id } from '../../../convex/_generated/dataModel';

import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useAppTheme } from '@/providers/ThemeProvider';
import { formatPrice } from '@/types';
import { Radius, Spacing } from '@/theme/tokens';
import { api } from '../../../convex/_generated/api';

type EditTarget = {
  serviceId: Id<'services'>;
  title: string;
  description: string;
  price?: number;
  categoryId: Id<'categories'>;
};

export default function ProviderServicesScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const categories = useQuery(api.categories.list, { activeOnly: true });
  const services = useQuery(api.services.getMine);
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setCategoryId(undefined);
  };

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setCategoryId(undefined);
    setShowForm(true);
  };

  const openEdit = (target: EditTarget) => {
    setEditing(target);
    setTitle(target.title);
    setDescription(target.description);
    setPrice(target.price != null ? String(target.price) : '');
    setCategoryId(target.categoryId);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      if (editing) {
        await updateService({
          serviceId: editing.serviceId,
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId
            ? (categoryId as Id<'categories'>)
            : editing.categoryId,
          pricingType: price ? 'fixed' : 'negotiable',
          price: price ? parseInt(price, 10) : undefined,
        });
      } else {
        if (!categoryId) return;
        await createService({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId as Id<'categories'>,
          pricingType: price ? 'fixed' : 'negotiable',
          price: price ? parseInt(price, 10) : undefined,
        });
      }
      resetForm();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (serviceId: Id<'services'>, isActive: boolean) => {
    try {
      await updateService({ serviceId, isActive: !isActive });
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
    }
  };

  return (
    <PageScaffold
      title={t('profile.myServices')}
      subtitle="Créez et gérez vos offres de services."
      showBack
    >
      <View style={{ paddingHorizontal: PAGE_H_PAD, paddingTop: Spacing.four }}>
        <Button
          title={showForm ? t('common.cancel') : t('services.new')}
          icon={showForm ? undefined : <Plus size={18} color={colors.onPrimary} />}
          onPress={() => (showForm ? resetForm() : openCreate())}
          fullWidth
          style={{ marginBottom: 16 }}
        />

        {showForm && (
          <View
            style={{
              backgroundColor: colors.surfaceCard,
              borderRadius: Radius.xl,
              padding: 16,
              marginBottom: 16,
              borderWidth: 0.1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: 12 }}>
              {editing ? t('services.edit') : t('services.new')}
            </Text>
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
            <Button
              title={t('services.save')}
              onPress={handleSave}
              loading={loading}
              fullWidth
            />
          </View>
        )}

        {!services || services.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Aucun service"
            description="Créez votre premier service pour commencer à recevoir des commandes."
            actionLabel={t('services.new')}
            onAction={openCreate}
            actionVariant="primary"
          />
        ) : (
          services.map((item) => (
            <View
              key={item.service._id}
              style={{
                backgroundColor: colors.surfaceCard,
                borderRadius: Radius.xl,
                padding: 16,
                marginBottom: 10,
                borderWidth: 0.1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 }}>
                  {item.service.title}
                </Text>
                <Badge
                  label={item.service.isActive ? t('services.active') : t('services.paused')}
                  variant={item.service.isActive ? 'verified' : 'danger'}
                />
              </View>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }} numberOfLines={2}>
                {item.service.description}
              </Text>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 8 }}>
                {item.category?.nameFr}
                {item.service.price != null ? ` · ${formatPrice(item.service.price)}` : ''}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button
                  title={t('services.edit')}
                  variant="outline"
                  onPress={() =>
                    openEdit({
                      serviceId: item.service._id,
                      title: item.service.title,
                      description: item.service.description,
                      price: item.service.price,
                      categoryId: item.service.categoryId,
                    })
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  title={item.service.isActive ? t('services.pause') : t('services.activate')}
                  variant={item.service.isActive ? 'ghost' : 'primary'}
                  onPress={() => toggleActive(item.service._id, item.service.isActive)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </PageScaffold>
  );
}
