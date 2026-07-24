import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Audio } from 'expo-av';
import { Pause, Play } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type AudioMessagePlayerProps = {
  uri: string;
  durationMs?: number;
  mine: boolean;
};

/**
 * Compact play/pause + duration for chat audio bubbles.
 */
export function AudioMessagePlayer({ uri, durationMs = 0, mine }: AudioMessagePlayerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [resolvedDuration, setResolvedDuration] = useState(durationMs);

  const fg = mine ? colors.onOrbit : colors.ink;
  const wash = mine ? 'rgba(255,255,255,0.22)' : colors.iconWash;

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
          { shouldPlay: false },
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
            setPlaying(false);
            setPositionMs(0);
            void next.setPositionAsync(0);
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
    if (
      status.durationMillis &&
      status.positionMillis >= status.durationMillis - 50
    ) {
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
        minWidth: 168,
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

      <View style={{ flex: 1, gap: 6 }}>
        <View
          style={{
            height: 4,
            borderRadius: Radius.xs,
            backgroundColor: wash,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${
                resolvedDuration > 0
                  ? Math.min(100, (positionMs / resolvedDuration) * 100)
                  : 0
              }%`,
              backgroundColor: fg,
              opacity: 0.85,
            }}
          />
        </View>
        <Text style={[textStyle('micro'), { color: fg, opacity: 0.9, fontFamily: fontFamily('body') }]}>
          {formatMs(displayMs)}
        </Text>
      </View>
    </View>
  );
}
