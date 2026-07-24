import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, Lightning, Plus, Trash } from 'phosphor-react-native';

import { AuthField, AuthPrimaryButton } from '@/components/auth/AuthField';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlutterFab } from '@/components/ui/FlutterFab';
import { PageScaffold, PAGE_H_PAD } from '@/components/ui/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { useAppTheme } from '@/providers/ThemeProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';
import { api } from '../../convex/_generated/api';

const MAX_SKILLS = 20;
const MAX_SKILL_LEN = 40;

/** Découpe une saisie multi-compétences (virgules, points-virgules, retours ligne). */
function parseSkillBatch(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const value = part.trim().replace(/\s+/g, ' ');
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/** Gestion des compétences prestataire — liste + bottomsheet d’ajout. */
export default function SkillsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert, confirm } = useAppDialog();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const updateProfile = useMutation(api.profiles.update);

  const profile = user?.profile;
  const isProvider = user?.role === 'provider';

  const [skills, setSkills] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    setSkills([...(profile.skills ?? [])]);
    setHydrated(true);
  }, [profile, hydrated]);

  /** Resync si le profil distant change après une sauvegarde. */
  useEffect(() => {
    if (!hydrated || !profile?.skills) return;
    const remote = profile.skills;
    setSkills((prev) => {
      if (prev.length === remote.length && prev.every((s, i) => s === remote[i])) {
        return prev;
      }
      return [...remote];
    });
  }, [profile?.skills, hydrated]);

  const persist = async (next: string[]) => {
    setLoading(true);
    try {
      await updateProfile({ skills: next });
      setSkills(next);
      return true;
    } catch (err) {
      alert({
        title: t('common.error'),
        message: err instanceof Error ? err.message : t('common.error'),
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openAddSheet = () => {
    setInput('');
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setInput('');
  };

  const handleAdd = async () => {
    const candidates = parseSkillBatch(input);
    if (candidates.length === 0) return;

    const tooLong = candidates.filter((s) => s.length > MAX_SKILL_LEN);
    if (tooLong.length > 0) {
      alert({
        title: t('common.error'),
        message: t('skills.tooLong', { max: MAX_SKILL_LEN }),
      });
      return;
    }

    const existing = new Set(skills.map((s) => s.toLowerCase()));
    const toAdd = candidates.filter((s) => !existing.has(s.toLowerCase()));

    if (toAdd.length === 0) {
      alert({ title: t('common.error'), message: t('skills.duplicate') });
      return;
    }

    const room = MAX_SKILLS - skills.length;
    if (room <= 0) {
      alert({
        title: t('common.error'),
        message: t('skills.maxReached', { max: MAX_SKILLS }),
      });
      return;
    }

    const accepted = toAdd.slice(0, room);
    const next = [...skills, ...accepted];
    const ok = await persist(next);
    if (!ok) return;

    closeSheet();

    const skipped =
      candidates.length - toAdd.length + Math.max(0, toAdd.length - accepted.length);
    alert({
      title: t('skills.savedTitle'),
      message:
        accepted.length === 1
          ? t('skills.addedBody', { skill: accepted[0] })
          : skipped > 0
            ? t('skills.addedManyPartialBody', {
                count: accepted.length,
                skipped,
              })
            : t('skills.addedManyBody', { count: accepted.length }),
      icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
    });
  };

  const previewSkills = parseSkillBatch(input);
  const existingKeys = new Set(skills.map((s) => s.toLowerCase()));
  const room = Math.max(0, MAX_SKILLS - skills.length);
  let acceptedSoFar = 0;
  const previewItems = previewSkills.map((skill) => {
    const tooLong = skill.length > MAX_SKILL_LEN;
    const duplicate = existingKeys.has(skill.toLowerCase());
    const overLimit = !tooLong && !duplicate && acceptedSoFar >= room;
    if (!tooLong && !duplicate && !overLimit) {
      acceptedSoFar += 1;
    }
    return {
      skill,
      invalid: tooLong || duplicate || overLimit,
    };
  });

  const handleDelete = (skill: string) => {
    confirm({
      title: t('skills.deleteTitle'),
      message: t('skills.deleteMessage', { skill }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        const next = skills.filter((s) => s !== skill);
        const ok = await persist(next);
        if (!ok) return;
        alert({
          title: t('skills.deletedTitle'),
          message: t('skills.deletedBody'),
          icon: <CheckCircle size={40} color={colors.orbit} weight="fill" />,
        });
      },
    });
  };

  if (!user) {
    return (
      <PageScaffold title={t('skills.title')} subtitle={t('skills.subtitle')} showBack>
        <EmptyState
          title={t('auth.loginRequiredTitle')}
          description={t('orders.loginRequired')}
          actionLabel={t('auth.signIn')}
          onAction={() => router.push('/(auth)/login')}
        />
      </PageScaffold>
    );
  }

  if (!isProvider) {
    return (
      <PageScaffold title={t('skills.title')} subtitle={t('skills.subtitle')} showBack>
        <EmptyState
          icon={Lightning}
          title={t('skills.providersOnlyTitle')}
          description={t('skills.providersOnlyBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </PageScaffold>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <PageScaffold
        title={t('skills.title')}
        subtitle={t('skills.subtitle')}
        showBack
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View
          style={{
            paddingHorizontal: PAGE_H_PAD,
            paddingTop: Spacing.five,
            gap: Spacing.four,
          }}
        >
          {!hydrated ? (
            <Text style={[textStyle('body'), { color: colors.muted, textAlign: 'center' }]}>
              {t('common.loading')}
            </Text>
          ) : skills.length === 0 ? (
            <EmptyState
              icon={Lightning}
              title={t('skills.emptyTitle')}
              description={t('skills.emptyDesc')}
              actionLabel={t('skills.add')}
              onAction={openAddSheet}
              actionVariant="primary"
            />
          ) : (
            <>
              <Text style={[textStyle('caption'), { color: colors.muted }]}>
                {t('skills.countHint', { count: skills.length, max: MAX_SKILLS })}
              </Text>
              <View style={{ gap: Spacing.two }}>
                {skills.map((skill) => (
                  <View
                    key={skill}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.three,
                      paddingVertical: Spacing.three,
                      paddingHorizontal: Spacing.four,
                      borderRadius: Radius.lg,
                      borderWidth: BorderWidth.default,
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.surfaceCard,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: Radius.md,
                        backgroundColor: colors.orbitWash,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Lightning size={18} color={colors.orbit} weight="fill" />
                    </View>
                    <Text
                      numberOfLines={2}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: fontFamily('body', 'medium'),
                        fontSize: 15,
                        color: colors.ink,
                      }}
                    >
                      {skill}
                    </Text>
                    <Pressable
                      onPress={() => handleDelete(skill)}
                      disabled={loading}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.delete')}
                      style={({ pressed }) => [
                        { width: 44 },
                        { opacity: pressed || loading ? 0.85 : 1 },
                      ]}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: Radius.md,
                          backgroundColor: colors.error + '14',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash size={18} color={colors.error} weight="bold" />
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </PageScaffold>

      {skills.length > 0 || hydrated ? (
        <FlutterFab
          absolute
          bottom={Math.max(insets.bottom, 8) + 16}
          onPressed={openAddSheet}
          icon={<Plus size={24} color={colors.onOrbit} weight="bold" />}
          backgroundColor={colors.orbit}
          foregroundColor={colors.onOrbit}
          accessibilityLabel={t('skills.add')}
        />
      ) : null}

      <AppBottomSheet
        visible={sheetOpen}
        onClose={closeSheet}
        title={t('skills.addSheetTitle')}
        subtitle={t('skills.addSheetSubtitle')}
      >
        <View style={{ alignSelf: 'stretch', width: '100%', gap: Spacing.four }}>
          <AuthField
            label={t('skills.fieldLabel')}
            value={input}
            onChangeText={setInput}
            placeholder={t('skills.placeholderBatch')}
            hint={t('skills.batchHint')}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 96 }}
            autoFocus
          />
          {previewItems.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: Spacing.two,
                marginTop: -Spacing.two,
              }}
            >
              {previewItems.map(({ skill, invalid }) => (
                <Badge
                  key={skill}
                  label={skill}
                  variant={invalid ? 'danger' : 'accent'}
                />
              ))}
            </View>
          ) : null}
          <AuthPrimaryButton
            title={t('skills.add')}
            onPress={handleAdd}
            loading={loading}
            disabled={!input.trim() || loading}
            tone="orbit"
            flat
          />
        </View>
      </AppBottomSheet>
    </View>
  );
}
