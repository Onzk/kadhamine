import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Audio } from 'expo-av';
import { Pause, Play } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Deterministic pseudo-random heights from URI so each clip has a stable waveform. */
function buildWaveHeights(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const n = (h % 1000) / 1000;
    // Soft peaks / valleys — not a flat line
    const wave = 0.35 + 0.65 * (0.55 + 0.45 * Math.sin(i * 0.55 + n * Math.PI));
    heights.push(4 + Math.round(wave * 16));
  }
  return heights;
}

const BAR_COUNT = 28;

type AudioMessagePlayerProps = {
  uri: string;
  durationMs?: number;
  mine: boolean;
  /** Renders beside the duration (e.g. timestamp), bottom-aligned. */
  trailing?: React.ReactNode;
};

/**
 * Play/pause + modern waveform with progress fill and duration.
 */
export function AudioMessagePlayer({
  uri,
  durationMs = 0,
  mine,
  trailing,
}: AudioMessagePlayerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [resolvedDuration, setResolvedDuration] = useState(durationMs);

  const fg = mine ? colors.onOrbit : colors.ink;
  const barIdle = mine ? 'rgba(255,255,255,0.35)' : colors.dust;
  const barActive = mine ? colors.onOrbit : colors.orbit;
  const wash = mine ? 'rgba(255,255,255,0.22)' : colors.iconWash;

  const heights = useMemo(() => buildWaveHeights(uri, BAR_COUNT), [uri]);
  const progress =
    resolvedDuration > 0 ? Math.min(1, Math.max(0, positionMs / resolvedDuration)) : 0;

  useEffect(() => {
    let mounted = true;
    let created: Audio.Sound | null = null;

    void (async () => {
      setLoading(true);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound: next } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, isLooping: false },
        );
        if (!mounted) {
          await next.unloadAsync();
          return;
        }
        created = next;
        next.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setPlaying(status.isPlaying);
          setPositionMs(status.positionMillis);
          if (status.durationMillis) {
            setResolvedDuration(status.durationMillis);
          }
          if (status.didJustFinish) {
            // Stop only — seeking to 0 here can restart playback on some devices.
            setPlaying(false);
            setPositionMs(0);
            void next.stopAsync().catch(() => {});
          }
        });
        setSound(next);
      } catch {
        // keep UI idle on load failure
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      void created?.unloadAsync().catch(() => {});
    };
  }, [uri]);

  const togglePlay = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
      return;
    }
    const atEnd =
      status.didJustFinish ||
      (status.durationMillis != null &&
        status.positionMillis >= status.durationMillis - 50);
    if (atEnd || positionMs === 0) {
      await sound.setPositionAsync(0);
    }
    await sound.playAsync();
  };

  const displayMs = playing || positionMs > 0 ? positionMs : resolvedDuration;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        minWidth: 196,
        paddingVertical: Spacing.one,
        paddingHorizontal: Spacing.one,
      }}
    >
      <Pressable
        onPress={togglePlay}
        disabled={!sound || loading}
        accessibilityRole="button"
        accessibilityLabel={playing ? t('messages.voicePause') : t('messages.voicePlay')}
        style={({ pressed }) => [
          { width: 40, height: 40, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: wash,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={fg} size="small" />
          ) : playing ? (
            <Pause size={18} color={fg} weight="fill" />
          ) : (
            <Play size={18} color={fg} weight="fill" />
          )}
        </View>
      </Pressable>

      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 22,
            gap: 2,
          }}
        >
          {heights.map((h, i) => {
            const filled = i / BAR_COUNT <= progress;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  borderRadius: 1.5,
                  backgroundColor: filled ? barActive : barIdle,
                  opacity: filled ? 1 : 0.9,
                }}
              />
            );
          })}
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: Spacing.two,
          }}
        >
          <Text
            style={[
              textStyle('micro'),
              { color: fg, opacity: 0.9, fontFamily: fontFamily('body') },
            ]}
          >
            {formatMs(displayMs)}
          </Text>
          {trailing}
        </View>
      </View>
    </View>
  );
}
