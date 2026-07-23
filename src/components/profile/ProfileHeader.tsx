import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PencilSimple, Plus, User } from 'phosphor-react-native';

import { Badge } from '@/components/ui/Badge';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { textStyle } from '@/theme/typography';

const AVATAR_SIZE = 104;
const AVATAR_SIZE_COMPACT = 80;
const BADGE_SIZE = 32;
const CTA_HEIGHT = 52;

interface ProfileHeaderProps {
  displayName: string;
  email?: string;
  roleLabel?: string;
  avatarUrl?: string;
  initials: string;
  onEditAvatar?: () => void;
  avatarLoading?: boolean;
}

export function ProfileHeader({
  displayName,
  email,
  roleLabel,
  avatarUrl,
  initials,
  onEditAvatar,
  avatarLoading,
}: ProfileHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={{ alignItems: 'center', paddingTop: Spacing.four, paddingBottom: Spacing.six }}>
      <Pressable
        onPress={onEditAvatar}
        disabled={!onEditAvatar || avatarLoading}
        accessibilityRole="button"
        accessibilityLabel="modifier la photo de profil"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      >
        <View style={{ position: 'relative', width: AVATAR_SIZE, height: AVATAR_SIZE }}>
          <View
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 0.1,
              borderColor: colors.borderHairline,
            }}
          >
            {avatarLoading ? (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surfaceStrong,
                }}
              >
                <ActivityIndicator color={colors.orbit} />
              </View>
            ) : avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[...colors.orbitGradient]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 34, fontWeight: '700', color: colors.onOrbit }}>
                  {initials}
                </Text>
              </LinearGradient>
            )}
          </View>
          {onEditAvatar ? (
            <View
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                borderRadius: BADGE_SIZE / 2,
                backgroundColor: colors.orbit,
                borderWidth: 0.1,
                borderColor: colors.canvas,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PencilSimple size={14} color={colors.onOrbit} weight="bold" />
            </View>
          ) : null}
        </View>
      </Pressable>

      <Text
        style={[
          textStyle('featureHeading'),
          { color: colors.ink, marginTop: Spacing.four, textAlign: 'center' },
        ]}
      >
        {displayName}
      </Text>

      {roleLabel ? (
        <View style={{ marginTop: Spacing.two }}>
          <Badge label={roleLabel} variant="accent" />
        </View>
      ) : null}

      {email ? (
        <Text
          style={[
            textStyle('caption'),
            { color: colors.muted, marginTop: Spacing.two, textAlign: 'center' },
          ]}
        >
          {email}
        </Text>
      ) : null}
    </View>
  );
}

interface GuestProfileHeaderProps {
  title?: string;
  subtitle?: string;
  signInLabel: string;
  signUpLabel: string;
  onPressSignIn: () => void;
  onPressSignUp: () => void;
  onPressAvatar?: () => void;
  /** Tighter spacing for bottom panel embedding. */
  compact?: boolean;
}

export function GuestProfileHeader({
  title,
  subtitle,
  signInLabel,
  signUpLabel,
  onPressSignIn,
  onPressSignUp,
  onPressAvatar,
  compact = false,
}: GuestProfileHeaderProps) {
  const { colors, isDark } = useAppTheme();
  const avatarAction = onPressAvatar ?? onPressSignIn;
  const avatarSize = compact ? AVATAR_SIZE_COMPACT : AVATAR_SIZE;
  const iconSize = compact ? 36 : 44;

  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: compact ? 0 : Spacing.five,
        paddingBottom: compact ? 0 : Spacing.six,
        width: '100%',
      }}
    >
      <View style={{ marginBottom: compact ? Spacing.three : Spacing.six }}>
        <Pressable
          onPress={avatarAction}
          accessibilityRole="button"
          accessibilityLabel={signInLabel}
          style={{ width: avatarSize, height: avatarSize }}
        >
          <View style={{ position: 'relative', width: avatarSize, height: avatarSize }}>
            <View
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                overflow: 'hidden',
                borderWidth: 0.1,
                borderColor: isDark ? colors.borderHairline : colors.borderLight,
              }}
            >
              <LinearGradient
                colors={[...colors.orbitGradient]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -avatarSize * 0.15,
                    left: -avatarSize * 0.1,
                    width: avatarSize * 0.7,
                    height: avatarSize * 0.55,
                    borderRadius: avatarSize,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                  }}
                />
                <User size={iconSize} color={colors.onOrbit} weight="duotone" />
              </LinearGradient>
            </View>

            <View
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                borderRadius: BADGE_SIZE / 2,
                backgroundColor: colors.orbit,
                borderWidth: 0.1,
                borderColor: colors.canvas,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} color={colors.onOrbit} weight="bold" />
            </View>
          </View>
        </Pressable>
      </View>

      {title ? (
        <Text
          style={[
            textStyle('featureHeading'),
            {
              color: colors.ink,
              textAlign: 'center',
              marginBottom: subtitle ? Spacing.one : Spacing.three,
              ...(compact ? { fontSize: 18, lineHeight: 22 } : null),
            },
          ]}
        >
          {title}
        </Text>
      ) : null}

      {subtitle ? (
        <Text
          style={[
            textStyle('caption'),
            {
              color: colors.muted,
              textAlign: 'center',
              marginBottom: Spacing.four,
              lineHeight: 18,
              maxWidth: 320,
            },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      ) : null}

      <View style={{ width: '100%', gap: Spacing.two }}>
        <Pressable
          onPress={onPressSignIn}
          accessibilityRole="button"
          accessibilityLabel={signInLabel}
          style={({ pressed }) => ({
            width: '100%',
            minHeight: CTA_HEIGHT,
            opacity: pressed ? 0.88 : 1,
            transform: pressed ? [{ scale: 0.985 }] : undefined,
          })}
        >
          <View
            style={{
              minHeight: CTA_HEIGHT,
              paddingVertical: Spacing.three,
              paddingHorizontal: Spacing.five,
              borderRadius: Radius.button,
              backgroundColor: colors.orbit,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                textStyle('button'),
                { color: colors.onOrbit, fontSize: 16, lineHeight: 20, textAlign: 'center' },
              ]}
            >
              {signInLabel}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onPressSignUp}
          accessibilityRole="button"
          accessibilityLabel={signUpLabel}
          style={({ pressed }) => ({
            width: '100%',
            minHeight: CTA_HEIGHT,
            opacity: pressed ? 0.88 : 1,
            transform: pressed ? [{ scale: 0.985 }] : undefined,
          })}
        >
          <View
            style={{
              minHeight: CTA_HEIGHT,
              paddingVertical: Spacing.three,
              paddingHorizontal: Spacing.five,
              borderRadius: Radius.button,
              backgroundColor: colors.surfaceCard,
              borderWidth: 0.1,
              borderColor: colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                textStyle('button'),
                { color: colors.ink, fontSize: 16, lineHeight: 20, textAlign: 'center' },
              ]}
            >
              {signUpLabel}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
