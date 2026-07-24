import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Briefcase, UsersThree, CaretLeft, SignOut, Check } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/components/brand/Logo';
import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily, textStyle } from '@/theme/typography';
import { Radius, Shadows, Spacing } from '@/theme/tokens';

export const AUTH_NAV_SIZE = 44;

/** Bouton retour auth — même taille que le logo header. */
export function AuthBackButton({ onPress }: { onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Retour"
      style={({ pressed }) => ({
        width: AUTH_NAV_SIZE,
        height: AUTH_NAV_SIZE,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: AUTH_NAV_SIZE,
          height: AUTH_NAV_SIZE,
          borderRadius: AUTH_NAV_SIZE / 2,
          backgroundColor: colors.iconWash,
          borderWidth: 0.1,
          borderColor: colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CaretLeft size={20} color={colors.ink} weight="bold" />
      </View>
    </Pressable>
  );
}

/** Logo header — emprise identique au bouton retour. */
export function AuthHeaderLogo() {
  return (
    <View
      style={{
        width: AUTH_NAV_SIZE,
        height: AUTH_NAV_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Logo size={32} />
    </View>
  );
}

/** Brand mark — logo + wordmark (app bar gauche). */
export function AuthBrandMark() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        flexShrink: 1,
        minWidth: 0,
      }}
      accessibilityRole="header"
      accessibilityLabel="TalentTchad"
    >
      <Logo size={32} />
      <Text
        numberOfLines={1}
        style={[textStyle('featureHeading'), { color: colors.ink, fontSize: 17, lineHeight: 22 }]}
      >
        TalentTchad
      </Text>
    </View>
  );
}

/** Bouton déconnexion — même chrome que le retour auth. */
export function AuthLogoutButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('auth.logout')}
      style={({ pressed }) => ({
        width: AUTH_NAV_SIZE,
        height: AUTH_NAV_SIZE,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: AUTH_NAV_SIZE,
          height: AUTH_NAV_SIZE,
          borderRadius: AUTH_NAV_SIZE / 2,
          backgroundColor: colors.iconWash,
          borderWidth: 0.1,
          borderColor: colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SignOut size={20} color={colors.ink} weight="bold" />
      </View>
    </Pressable>
  );
}

type Role = 'client' | 'provider';

interface RolePickerProps {
  value: Role;
  onChange: (role: Role) => void;
  /** Affiche un libellé au-dessus (défaut : auth.accountType / chooseRole). */
  label?: string;
  /** Masque le libellé (ex. déjà dans le sous-titre de page). */
  hideLabel?: boolean;
}

/** Sélecteur Client / Prestataire — rangées pleine largeur, état sélection clair. */
export function RolePicker({ value, onChange, label, hideLabel = false }: RolePickerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const options: Array<{
    role: Role;
    Icon: typeof UsersThree;
    desc: string;
  }> = [
    {
      role: 'client',
      Icon: UsersThree,
      desc: t('auth.clientDesc'),
    },
    {
      role: 'provider',
      Icon: Briefcase,
      desc: t('auth.providerDesc'),
    },
  ];

  return (
    <View style={{ marginBottom: Spacing.six, alignSelf: 'stretch', width: '100%' }}>
      {hideLabel ? null : (
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
          {label ?? t('profile.accountType')}
        </Text>
      )}

      <View style={{ gap: Spacing.two }}>
        {options.map(({ role, Icon, desc }) => {
          const selected = value === role;
          return (
            <Pressable
              key={role}
              onPress={() => onChange(role)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.92 : 1 }]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.three,
                  paddingVertical: Spacing.four,
                  paddingHorizontal: Spacing.four,
                  borderRadius: Radius.md,
                  borderWidth: selected ? 1.5 : 0.1,
                  borderColor: selected ? colors.orbit : colors.borderStrong,
                  backgroundColor: selected ? colors.orbitWash : colors.surfaceCard,
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
                  }}
                >
                  <Icon
                    size={22}
                    color={selected ? colors.onOrbit : colors.ink}
                    weight="bold"
                  />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      textStyle('button'),
                      {
                        color: colors.ink,
                        fontFamily: fontFamily('body', 'medium'),
                        marginBottom: 2,
                      },
                    ]}
                  >
                    {t(`auth.${role}`)}
                  </Text>
                  <Text
                    style={[textStyle('caption'), { color: colors.muted, lineHeight: 18 }]}
                    numberOfLines={2}
                  >
                    {desc}
                  </Text>
                </View>

                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: selected ? 0 : 0.1,
                    borderColor: colors.borderStrong,
                    backgroundColor: selected ? colors.orbit : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected ? (
                    <Check size={14} color={colors.onOrbit} weight="bold" />
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
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

/** Indicateur d’étapes segmenté (register / formulaires multi-étapes). */
export function AuthStepper({ step, total }: AuthStepperProps) {
  const { t } = useTranslation();
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
        {t('common.stepOf', { step, total })}
      </Text>
    </View>
  );
}

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLogo?: boolean;
  /** Remplace le slot gauche (ex. brand). */
  leading?: React.ReactNode;
  /** Remplace le slot droit (ex. déconnexion). */
  trailing?: React.ReactNode;
}

/** En-tête auth — retour/brand à gauche, logo/action à droite, titre. */
export function AuthHeader({
  title,
  subtitle,
  onBack,
  showLogo = true,
  leading,
  trailing,
}: AuthHeaderProps) {
  const { colors } = useAppTheme();

  const left =
    leading !== undefined ? (
      leading
    ) : onBack ? (
      <AuthBackButton onPress={onBack} />
    ) : (
      <View style={{ width: AUTH_NAV_SIZE }} />
    );

  const right =
    trailing !== undefined ? (
      trailing
    ) : showLogo ? (
      <AuthHeaderLogo />
    ) : (
      <View style={{ width: AUTH_NAV_SIZE }} />
    );

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing.six,
          gap: Spacing.three,
        }}
      >
        {left}
        {right}
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
