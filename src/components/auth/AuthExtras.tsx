import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Briefcase, UsersThree, CaretLeft } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/components/brand/Logo';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Shadows, Spacing } from '@/theme/tokens';

type Role = 'client' | 'provider';

interface RolePickerProps {
  value: Role;
  onChange: (role: Role) => void;
}

/** Sélecteur Client / Prestataire — card sélectionnée orange corail. */
export function RolePicker({ value, onChange }: RolePickerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const options: Array<{ role: Role; Icon: typeof UsersThree; desc: string }> = [
    { role: 'client', Icon: UsersThree, desc: t('auth.clientDesc') },
    { role: 'provider', Icon: Briefcase, desc: t('auth.providerDesc') },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.six }}>
      {options.map(({ role, Icon, desc }) => {
        const selected = value === role;
        return (
          <Pressable
            key={role}
            onPress={() => onChange(role)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: Spacing.four,
              paddingHorizontal: Spacing.three,
              borderRadius: 16,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? colors.orbit : colors.border,
              backgroundColor: selected ? colors.orbit + '14' : colors.surfaceCard,
              alignItems: 'center',
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              ...Shadows.nav,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: selected ? colors.orbit : colors.iconWash,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.two,
              }}
            >
              <Icon size={22} color={selected ? colors.onPrimary : colors.ink} weight="bold" />
            </View>
            <Text
              style={[
                textStyle('button'),
                { color: colors.ink, marginBottom: 4 },
              ]}
            >
              {t(`auth.${role}`)}
            </Text>
            <Text
              numberOfLines={2}
              style={[textStyle('micro'), { color: colors.muted, textAlign: 'center' }]}
            >
              {desc}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface CityChipsProps {
  cities: readonly string[];
  value: string;
  onChange: (city: string) => void;
}

/** Chips ville — sélection orange plein, grille flexible. */
export function CityChips({ cities, value, onChange }: CityChipsProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ marginBottom: Spacing.five }}>
      <Text
        style={[
          textStyle('caption'),
          {
            fontFamily: fontFamily('body', 'medium'),
            color: colors.ink,
            marginBottom: Spacing.three,
          },
        ]}
      >
        Ville
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {cities.map((city) => {
          const selected = value === city;
          return (
            <Pressable
              key={city}
              onPress={() => onChange(city)}
              style={({ pressed }) => ({
                paddingHorizontal: Spacing.four,
                paddingVertical: Spacing.two,
                borderRadius: Radius.pill,
                backgroundColor: selected ? colors.orbit : colors.surfaceCard,
                borderWidth: 1,
                borderColor: selected ? colors.orbit : colors.border,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text
                style={[
                  textStyle('caption'),
                  {
                    fontFamily: fontFamily('body', 'medium'),
                    color: selected ? colors.onPrimary : colors.ink,
                  },
                ]}
              >
                {city}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface AuthToggleRowProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  right?: React.ReactNode;
}

/** Toggle orange corail + label (+ action droite optionnelle). */
export function AuthToggleRow({ value, onChange, label, right }: AuthToggleRowProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.six,
        gap: Spacing.three,
      }}
    >
      <Pressable
        onPress={() => onChange(!value)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flex: 1 }}
      >
        <View
          style={{
            width: 48,
            height: 28,
            borderRadius: 14,
            padding: 3,
            backgroundColor: value ? colors.orbit : colors.switchTrackOff,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.surfaceCard,
              alignSelf: value ? 'flex-end' : 'flex-start',
              ...Shadows.nav,
            }}
          />
        </View>
        {typeof label === 'string' ? (
          <Text style={[textStyle('caption'), { color: colors.body, flex: 1 }]}>{label}</Text>
        ) : (
          label
        )}
      </Pressable>
      {right}
    </View>
  );
}

interface AuthLogoMarkProps {
  size?: number;
}

/** Logo dans halo orange — ancre visuelle de la marque. */
export function AuthLogoMark({ size = 72 }: AuthLogoMarkProps) {
  const { colors } = useAppTheme();
  const halo = size + 28;

  return (
    <View style={{ alignItems: 'center', marginBottom: Spacing.six }}>
      <View
        style={{
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: colors.orbit + '18',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            backgroundColor: colors.surfaceCard,
            alignItems: 'center',
            justifyContent: 'center',
            ...Shadows.nav,
          }}
        >
          {/* Logo importé dynamiquement pour éviter cycle */}
          <Logo size={size} />
        </View>
      </View>
    </View>
  );
}

interface AuthStepperProps {
  step: number;
  total: number;
}

/** Indicateur d’étapes segmenté (register multi-étapes). */
export function AuthStepper({ step, total }: AuthStepperProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ marginBottom: Spacing.six }}>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: Spacing.two }}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: i < step ? colors.orbit : colors.border,
            }}
          />
        ))}
      </View>
      <Text
        style={[
          textStyle('micro'),
          { color: colors.muted, fontFamily: fontFamily('body', 'medium') },
        ]}
      >
        Étape {step} sur {total}
      </Text>
    </View>
  );
}

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLogo?: boolean;
}

/** En-tête auth cohérent — retour, logo de marque, titre, sous-texte. */
export function AuthHeader({ title, subtitle, onBack, showLogo = true }: AuthHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing.six,
        }}
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceCard,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <CaretLeft size={20} color={colors.ink} weight="bold" />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}

        {showLogo ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Logo size={26} />
            <Text
              style={{
                fontFamily: fontFamily('body', 'bold'),
                fontSize: 17,
                color: colors.ink,
                letterSpacing: -0.3,
              }}
            >
              TalentTchad
            </Text>
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={{ width: 44 }} />
      </View>

      <Text
        style={[
          textStyle('productDisplay'),
          { color: colors.ink, marginBottom: subtitle ? Spacing.two : 0 },
        ]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[textStyle('body'), { color: colors.muted, lineHeight: 24 }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
