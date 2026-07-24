import React from 'react';
import { View, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretRight, type Icon as PhosphorIcon } from 'phosphor-react-native';
import type { TFunction } from 'i18next';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

/** Icon + label row height (above the system-nav inset). */
export const ADMIN_TAB_CONTENT_HEIGHT = 52;
/** Extra lift so tab items sit clearly above the system gesture/nav zone. */
export const ADMIN_TAB_BOTTOM_EXTRA = Spacing.two;

/** Padding bas pour le contenu des onglets admin (tab bar + marge). */
export function useAdminTabBarPadding() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Spacing.two);
  const paddingBottom = bottomInset + ADMIN_TAB_BOTTOM_EXTRA;
  const tabBarHeight = ADMIN_TAB_CONTENT_HEIGHT + paddingBottom;
  return {
    tabBarHeight,
    tabBarPaddingBottom: paddingBottom,
    /** paddingBottom pour PageScaffold content (tab bar + Spacing.six). */
    contentPaddingBottom: tabBarHeight + Spacing.six,
  };
}

export function formatAdminDate(ts: number | undefined, locale: string): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

export function formatAdminDateTime(ts: number | undefined, locale: string): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(locale === 'ar' ? 'ar' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ts).toLocaleString();
  }
}

type BadgeVariant = 'default' | 'verified' | 'premium' | 'danger' | 'accent' | 'taxonomy';

export function adminStatusBadgeVariant(status: string | undefined | null): BadgeVariant {
  switch (status) {
    case 'suspended':
    case 'rejected':
    case 'failed':
    case 'dismissed':
    case 'cancelled':
      return 'danger';
    case 'pending':
    case 'open':
    case 'held':
    case 'in_review':
    case 'accepted':
      return 'accent';
    case 'approved':
    case 'released':
    case 'resolved':
    case 'completed':
      return 'verified';
    case 'active':
      return 'default';
    default:
      return 'default';
  }
}

export function adminUserStatusLabel(t: TFunction, status: string | undefined | null): string {
  switch (status) {
    case 'pending':
      return t('admin.badgePending');
    case 'active':
      return t('admin.badgeActive');
    case 'suspended':
      return t('admin.badgeSuspended');
    case 'rejected':
      return t('admin.badgeRejected');
    default:
      return status ?? '—';
  }
}

export function adminVerificationStatusLabel(t: TFunction, status: string | undefined | null): string {
  switch (status) {
    case 'pending':
      return t('admin.badgePending');
    case 'approved':
      return t('admin.badgeApproved');
    case 'rejected':
      return t('admin.badgeRejected');
    default:
      return status ?? '—';
  }
}

export function adminReportStatusLabel(t: TFunction, status: string | undefined | null): string {
  switch (status) {
    case 'open':
      return t('admin.badgeOpen');
    case 'in_review':
      return t('admin.badgeInReview');
    case 'resolved':
      return t('admin.badgeResolved');
    case 'dismissed':
      return t('admin.badgeDismissed');
    default:
      return status ?? '—';
  }
}

export function adminPaymentStatusLabel(t: TFunction, status: string | undefined | null): string {
  switch (status) {
    case 'pending':
      return t('admin.badgePending');
    case 'held':
      return t('admin.badgeHeld');
    case 'released':
      return t('admin.badgeReleased');
    case 'refunded':
      return t('admin.badgeRefunded');
    case 'failed':
      return t('admin.badgeFailed');
    default:
      return status ?? '—';
  }
}

export function adminOrderStatusLabel(t: TFunction, status: string | undefined | null): string {
  switch (status) {
    case 'pending':
      return t('admin.badgePending');
    case 'accepted':
      return t('admin.badgeAccepted');
    case 'completed':
      return t('admin.badgeCompleted');
    case 'cancelled':
      return t('admin.badgeCancelled');
    default:
      return status ?? '—';
  }
}

export function adminRoleLabel(t: TFunction, role: string | undefined | null): string {
  switch (role) {
    case 'client':
      return t('admin.roleClient');
    case 'provider':
      return t('admin.roleProvider');
    case 'admin':
      return t('admin.roleAdmin');
    default:
      return role ?? '—';
  }
}

export function adminReportTargetLabel(t: TFunction, targetType: string): string {
  switch (targetType) {
    case 'user':
      return t('admin.targetUser');
    case 'service':
      return t('admin.targetService');
    case 'order':
      return t('admin.targetOrder');
    case 'review':
      return t('admin.targetReview');
    case 'message':
      return t('admin.targetMessage');
    default:
      return targetType;
  }
}

export function adminReportReasonLabel(t: TFunction, reason: string): string {
  const key = `admin.reason.${reason}`;
  const translated = t(key);
  return translated === key ? reason : translated;
}

export function AdminDetailSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: Spacing.three, marginBottom: Spacing.five }}>
      {title ? (
        <Text
          style={[
            textStyle('micro'),
            {
              fontFamily: fontFamily('body', 'medium'),
              color: colors.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            },
          ]}
        >
          {title}
        </Text>
      ) : null}
      <View style={{ gap: Spacing.three }}>{children}</View>
    </View>
  );
}

export function AdminDetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const { colors } = useAppTheme();
  const display = value === undefined || value === null || value === '' ? '—' : String(value);
  return (
    <View style={{ gap: Spacing.half }}>
      <Text style={[textStyle('micro'), { color: colors.muted }]}>{label}</Text>
      <Text style={[textStyle('body'), { color: colors.ink }]}>{display}</Text>
    </View>
  );
}

export function AdminAvatar({
  uri,
  initials,
  size = 48,
}: {
  uri?: string | null;
  initials: string;
  size?: number;
}) {
  const { colors } = useAppTheme();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.iconWash,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[
          textStyle('body'),
          { fontFamily: fontFamily('body', 'bold'), color: colors.primary, fontSize: size * 0.34 },
        ]}
      >
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

export function AdminIconWash({
  icon: Icon,
  size = 48,
}: {
  icon: PhosphorIcon;
  size?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.md,
        backgroundColor: colors.iconWash,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={22} color={colors.primary} />
    </View>
  );
}

interface AdminListCardProps {
  onPress: () => void;
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  badges?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showChevron?: boolean;
}

export function AdminListCard({
  onPress,
  leading,
  title,
  subtitle,
  meta,
  badges,
  children,
  style,
  showChevron = true,
}: AdminListCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{ width: '100%' }, { opacity: pressed ? 0.92 : 1 }]}
    >
      <View
        style={[
          {
            backgroundColor: colors.surfaceCard,
            borderRadius: Radius.lg,
            padding: Spacing.five,
            borderWidth: 0.1,
            borderColor: colors.border,
            gap: Spacing.three,
          },
          style,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three }}>
          {leading ? <View style={{ marginTop: 2 }}>{leading}</View> : null}
          <View style={{ flex: 1, minWidth: 0, gap: Spacing.one }}>
            <Text
              style={[
                textStyle('body'),
                { fontFamily: fontFamily('body', 'bold'), color: colors.ink },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text style={[textStyle('caption'), { color: colors.muted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {meta ? (
              <Text style={[textStyle('caption'), { color: colors.body }]} numberOfLines={2}>
                {meta}
              </Text>
            ) : null}
            {badges ? (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: Spacing.two,
                  marginTop: Spacing.one,
                }}
              >
                {badges}
              </View>
            ) : null}
            {children}
          </View>
          {showChevron ? (
            <View style={{ marginTop: 4 }}>
              <CaretRight size={18} color={colors.muted} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export function AdminStatusBadge({
  label,
  status,
}: {
  label: string;
  status?: string | null;
}) {
  return <Badge label={label} variant={adminStatusBadgeVariant(status)} />;
}

export function displayName(opts: {
  profile?: { firstName?: string; lastName?: string } | null;
  user?: { name?: string | null; email?: string | null } | null;
}): string {
  const { profile, user } = opts;
  if (profile?.firstName || profile?.lastName) {
    return `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  }
  return user?.name || user?.email || '—';
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}
