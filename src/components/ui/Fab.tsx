import React, { useState } from 'react';
import { Pressable, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';

import { useAppTheme } from '@/providers/ThemeProvider';
import { fontFamily } from '@/theme/typography';
import { Shadows } from '@/theme/tokens';

/**
 * Specs FAB — Flutter Material 3 :
 * - standard 56 (r16), large 96 (r28), mini/small 40 (r12)
 * - extended : hauteur 56, r16, padding H 20, gap icône 8
 * - élévation Flutter : 6 repos / 12 pressé / 0 disabled
 * - zone tactile min 48, marge 16
 */
export const FAB_SIZE = {
  standard: 56,
  large: 96,
  mini: 40,
} as const;

export const FAB_ICON = {
  standard: 24,
  large: 36,
  mini: 24,
} as const;

/** Rayons Flutter M3 (pas de cercle plein). */
export const FAB_RADIUS = {
  standard: 16,
  large: 28,
  mini: 12,
} as const;

export const FAB_EDGE_MARGIN = 16;
export const FAB_MIN_TAP = 48;
export const FAB_GAP = 16;

export type FabSize = keyof typeof FAB_SIZE;
export type FabTone = 'orbit' | 'ink' | 'surface';

function rippleColor(tone: FabTone) {
  return tone === 'surface' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.24)';
}

function useToneColors(tone: FabTone) {
  const { colors } = useAppTheme();
  if (tone === 'surface') {
    return { bg: colors.surfaceCard, fg: colors.ink, border: colors.border };
  }
  if (tone === 'ink') {
    return { bg: colors.ink, fg: colors.onPrimary, border: 'transparent' };
  }
  return { bg: colors.orbit, fg: colors.onOrbit, border: 'transparent' };
}

/** Élévation Flutter : 6 / 12 / 0. */
function fabShadow(pressed: boolean, disabled = false) {
  if (disabled) {
    return {
      elevation: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    };
  }
  return pressed ? Shadows.fabPressed : Shadows.fab;
}

interface FabBadgeProps {
  count: number;
}

function FabBadge({ count }: FabBadgeProps) {
  const { colors } = useAppTheme();
  if (count <= 0) return null;
  const label = count > 9 ? '9+' : String(count);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
        backgroundColor: colors.signal,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.1,
        borderColor: colors.canvas,
      }}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 10,
          lineHeight: 12,
          fontFamily: fontFamily('body', 'bold'),
        }}
      >
        {label}
      </Text>
    </View>
  );
}

interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
  renderIcon: (opts: { size: number; color: string }) => React.ReactNode;
  size?: FabSize;
  tone?: FabTone;
  badgeCount?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** FAB circulaire — style Material en ligne. */
export function Fab({
  onPress,
  accessibilityLabel,
  renderIcon,
  size = 'standard',
  tone = 'orbit',
  badgeCount = 0,
  disabled = false,
  style,
}: FabProps) {
  const { bg, fg, border } = useToneColors(tone);
  const dim = FAB_SIZE[size];
  const iconSize = FAB_ICON[size];
  const slop = Math.max(0, Math.ceil((FAB_MIN_TAP - dim) / 2));
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: rippleColor(tone), borderless: false, radius: dim / 2 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[{ width: dim, height: dim, opacity: disabled ? 0.6 : 1 }, style]}
    >
      <View
        style={{
          width: dim,
          height: dim,
          borderRadius: FAB_RADIUS[size],
          backgroundColor: disabled ? '#BDBDBD' : bg,
          borderWidth: border === 'transparent' ? 0 : 0.1,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
          ...fabShadow(pressed, disabled),
        }}
      >
        {renderIcon({ size: iconSize, color: fg })}
        <FabBadge count={badgeCount} />
      </View>
    </Pressable>
  );
}

interface ExtendedFabProps {
  onPress: () => void;
  accessibilityLabel: string;
  label: string;
  renderIcon: (opts: { size: number; color: string }) => React.ReactNode;
  tone?: FabTone;
  badgeCount?: number;
  style?: StyleProp<ViewStyle>;
}

/** FAB étendu (stadium / pill) — icône + label, hauteur 56. */
export function ExtendedFab({
  onPress,
  accessibilityLabel,
  label,
  renderIcon,
  tone = 'orbit',
  badgeCount = 0,
  style,
}: ExtendedFabProps) {
  const { bg, fg, border } = useToneColors(tone);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: rippleColor(tone), borderless: false }}
      style={[{ height: FAB_SIZE.standard, minWidth: FAB_SIZE.standard }, style]}
    >
      <View
        style={{
          height: FAB_SIZE.standard,
          minWidth: FAB_SIZE.standard,
          borderRadius: FAB_RADIUS.standard,
          paddingHorizontal: 20,
          backgroundColor: bg,
          borderWidth: border === 'transparent' ? 0 : 0.1,
          borderColor: border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          ...fabShadow(pressed),
        }}
      >
        {renderIcon({ size: FAB_ICON.standard, color: fg })}
        <Text style={{ color: fg, fontSize: 14, letterSpacing: 0.1, fontFamily: fontFamily('body', 'medium') }}>
          {label}
        </Text>
        <FabBadge count={badgeCount} />
      </View>
    </Pressable>
  );
}

export interface FabAction {
  key: string;
  label: string;
  renderIcon: (opts: { size: number; color: string }) => React.ReactNode;
  onPress: () => void;
  tone?: FabTone;
  badgeCount?: number;
}

interface FabSpeedDialProps {
  actions: FabAction[];
  renderMainIcon: (opts: { size: number; color: string }) => React.ReactNode;
  accessibilityLabel: string;
  tone?: FabTone;
  mainBadgeCount?: number;
  bottom?: number;
  right?: number;
}

/** Speed dial — FAB principal circulaire + mini-FABs secondaires. */
export function FabSpeedDial({
  actions,
  renderMainIcon,
  accessibilityLabel,
  tone = 'orbit',
  mainBadgeCount = 0,
  bottom = FAB_EDGE_MARGIN,
  right = FAB_EDGE_MARGIN,
}: FabSpeedDialProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const progress = useSharedValue(0);
  const mainBg = tone === 'ink' ? colors.ink : colors.orbit;
  const mainFg = tone === 'ink' ? colors.onPrimary : colors.onOrbit;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    progress.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  const close = () => {
    setOpen(false);
    progress.value = withTiming(0, { duration: 200 });
  };

  const mainIconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 135], Extrapolation.CLAMP)}deg` },
    ],
  }));

  return (
    <>
      {open ? (
        <Pressable
          onPress={close}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
        />
      ) : null}

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right,
          bottom,
          zIndex: 100,
          alignItems: 'flex-end',
          gap: FAB_GAP,
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.key}
            action={action}
            progress={progress}
            open={open}
            onFire={() => {
              close();
              action.onPress();
            }}
          />
        ))}

        <Pressable
          onPress={toggle}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: open }}
          android_ripple={{
            color: rippleColor(tone),
            borderless: true,
            radius: FAB_SIZE.standard / 2,
          }}
          style={{
            width: FAB_SIZE.standard,
            height: FAB_SIZE.standard,
          }}
        >
          <View
            style={{
              width: FAB_SIZE.standard,
              height: FAB_SIZE.standard,
              borderRadius: FAB_RADIUS.standard,
              backgroundColor: mainBg,
              alignItems: 'center',
              justifyContent: 'center',
              ...fabShadow(pressed),
            }}
          >
            <Animated.View style={mainIconStyle}>
              {renderMainIcon({ size: FAB_ICON.standard, color: mainFg })}
            </Animated.View>
            <FabBadge count={open ? 0 : mainBadgeCount} />
          </View>
        </Pressable>
      </View>
    </>
  );
}

interface SpeedDialActionProps {
  action: FabAction;
  progress: SharedValue<number>;
  open: boolean;
  onFire: () => void;
}

function SpeedDialAction({ action, progress, open, onFire }: SpeedDialActionProps) {
  const { colors } = useAppTheme();
  const [pressed, setPressed] = useState(false);
  const tone: FabTone = action.tone ?? 'surface';
  const bg =
    tone === 'orbit' ? colors.orbit : tone === 'ink' ? colors.ink : colors.surfaceCard;
  const fg =
    tone === 'surface' ? colors.ink : tone === 'orbit' ? colors.onOrbit : colors.onPrimary;
  const actionBorder = tone === 'surface' ? colors.border : 'transparent';

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.75, 1], Extrapolation.CLAMP) },
      {
        translateY: interpolate(progress.value, [0, 1], [16, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}
    >
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 4,
          backgroundColor: colors.surfaceCard,
          ...Shadows.fab,
        }}
      >
        <Text
          style={{ color: colors.ink, fontSize: 13, fontFamily: fontFamily('body', 'medium') }}
        >
          {action.label}
        </Text>
      </View>

      <Pressable
        onPress={onFire}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        hitSlop={4}
        android_ripple={{
          color: rippleColor(tone),
          borderless: true,
          radius: FAB_SIZE.mini / 2,
        }}
        style={{
          width: FAB_SIZE.mini,
          height: FAB_SIZE.mini,
        }}
      >
        <View
          style={{
            width: FAB_SIZE.mini,
            height: FAB_SIZE.mini,
            borderRadius: FAB_RADIUS.mini,
            backgroundColor: bg,
            borderWidth: actionBorder === 'transparent' ? 0 : 0.1,
            borderColor: actionBorder,
            alignItems: 'center',
            justifyContent: 'center',
            ...fabShadow(pressed),
          }}
        >
          {action.renderIcon({ size: FAB_ICON.mini - 2, color: fg })}
          <FabBadge count={action.badgeCount ?? 0} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface FabContainerProps {
  children: React.ReactNode;
  bottom?: number;
  right?: number;
}

/** Positionne un FAB unique en bas à droite (fixe, hors scroll). */
export function FabContainer({
  children,
  bottom = FAB_EDGE_MARGIN,
  right = FAB_EDGE_MARGIN,
}: FabContainerProps) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right,
        bottom,
        zIndex: 100,
        alignItems: 'flex-end',
      }}
    >
      {children}
    </View>
  );
}
