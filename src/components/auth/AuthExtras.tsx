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

/** Sélecteur Client / Prestataire — 50/50, card sélectionnée brand blue. */
export function RolePicker({ value, onChange }: RolePickerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const options: Array<{ role: Role; Icon: typeof UsersThree; desc: string }> = [
    { role: 'client', Icon: UsersThree, desc: t('auth.clientDesc') },
    { role: 'provider', Icon: Briefcase, desc: t('auth.providerDesc') },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'stretch',
        width: '100%',
        gap: Spacing.three,
        marginBottom: Spacing.six,
      }}
    >
      {options.map(({ role, Icon, desc }) => {
        const selected = value === role;
        return (
          <Pressable
            key={role}
            onPress={() => onChange(role)}
            style={({ pressed }) => ({
              flex: 1,
              flexBasis: 0,
              minWidth: 0,
              minHeight: 132,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View
              style={{
                flex: 1,
                minHeight: 132,
                paddingVertical: Spacing.four,
                paddingHorizontal: Spacing.two,
                borderRadius: Radius.lg,
                borderWidth: 0.1,
                borderColor: selected ? colors.orbit : colors.border,
                backgroundColor: selected ? colors.orbit + '14' : colors.surfaceCard,
                alignItems: 'center',
                ...Shadows.nav,
              }}
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
                <Icon size={22} color={selected ? colors.onOrbit : colors.ink} weight="bold" />
              </View>
              <Text
                style={[
                  textStyle('button'),
                  { color: colors.ink, marginBottom: 4, textAlign: 'center' },
                ]}
              >
                {t(`auth.${role}`)}
              </Text>
              <Text
                style={[
                  textStyle('micro'),
                  {
                    color: colors.muted,
                    textAlign: 'center',
                    lineHeight: 16,
                    flexShrink: 1,
                  },
                ]}
              >
                {desc}
              </Text>
            </View>
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

/** Chips ville — sélection brand blue plein, grille flexible. */
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
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <View
                style={{
                  paddingHorizontal: Spacing.four,
                  paddingVertical: Spacing.two,
                  borderRadius: Radius.pill,
                  backgroundColor: selected ? colors.orbit : colors.surfaceCard,
                  borderWidth: 0.1,
                  borderColor: selected ? colors.orbit : colors.border,
                }}
              >
                <Text
                  style={[
                    textStyle('caption'),
                    {
                      fontFamily: fontFamily('body', 'medium'),
                      color: selected ? colors.onOrbit : colors.ink,
                    },
                  ]}
                >
                  {city}
                </Text>
              </View>
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

/** Toggle brand blue + label (+ action droite optionnelle). */
export function AuthToggleRow({ value, onChange, label, right }: AuthToggleRowProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.five,
        gap: Spacing.four,
        minHeight: 48,
      }}
    >
      <Pressable
        onPress={() => onChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        style={{
          flex: 1,
          minHeight: 48,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.three,
            flex: 1,
            minHeight: 48,
          }}
        >
          <View
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              padding: 3,
              backgroundColor: value ? colors.orbit : colors.switchTrackOff,
              justifyContent: 'center',
              flexShrink: 0,
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
            <Text
              style={[
                textStyle('caption'),
                {
                  color: colors.ink,
                  flexShrink: 1,
                  lineHeight: 20,
                },
              ]}
              numberOfLines={2}
            >
              {label}
            </Text>
          ) : (
            label
          )}
        </View>
      </Pressable>
      {right ? (
        <View style={{ flexShrink: 0, justifyContent: 'center', minHeight: 48 }}>{right}</View>
      ) : null}
    </View>
  );
}

interface AuthLogoMarkProps {
  size?: number;
}

/** Logo dans halo brand blue — ancre visuelle de la marque. */
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

/** En-tête auth — retour à gauche, logo seul à droite (sans wordmark), titre. */
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
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceCard,
                borderWidth: 0.1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CaretLeft size={20} color={colors.ink} weight="bold" />
            </View>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}

        {showLogo ? <Logo size={28} /> : <View style={{ width: 44 }} />}
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
        <Text style={[textStyle('body'), { color: colors.slate, lineHeight: 24 }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
