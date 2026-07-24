import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import { Microphone, Stop, Play, Pause, Trash } from 'phosphor-react-native';

import { Text } from '@/components/ui/ThemedText';
import { useAppTheme } from '@/providers/ThemeProvider';
import { useAppDialog } from '@/providers/AppDialogProvider';
import { BorderWidth, Radius, Spacing } from '@/theme/tokens';
import { fontFamily, textStyle } from '@/theme/typography';

const MAX_DURATION_MS = 60_000;

export type VoiceRecordingValue = {
  uri: string;
  durationMs: number;
  mimeType?: string;
} | null;

type VoiceRecorderFieldProps = {
  value: VoiceRecordingValue;
  onChange: (value: VoiceRecordingValue) => void;
  label?: string;
  /** Playback-only (detail). */
  playbackUri?: string | null;
  playbackDurationMs?: number | null;
  readOnly?: boolean;
};

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Record / stop / play / delete — expo-av, max 60s.
 */
export function VoiceRecorderField({
  value,
  onChange,
  label,
  playbackUri,
  playbackDurationMs,
  readOnly = false,
}: VoiceRecorderFieldProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { alert } = useAppDialog();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sourceUri = readOnly ? playbackUri ?? null : value?.uri ?? null;

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      void recording?.stopAndUnloadAsync().catch(() => {});
      void sound?.unloadAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void (async () => {
      await sound?.unloadAsync().catch(() => {});
      setSound(null);
      setPlaying(false);
      if (!sourceUri) return;
      try {
        const { sound: next } = await Audio.Sound.createAsync(
          { uri: sourceUri },
          { shouldPlay: false },
        );
        next.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setPlaying(false);
            void next.setPositionAsync(0);
          }
        });
        setSound(next);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      void sound?.unloadAsync().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUri]);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert({ title: t('common.error'), message: t('order.voicePermission') });
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      if (playing) await sound?.stopAsync();
      onChange(null);
      setElapsedMs(0);

      const next = new Audio.Recording();
      await next.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await next.startAsync();
      setRecording(next);

      tickRef.current = setInterval(async () => {
        const status = await next.getStatusAsync();
        if (!status.isRecording) return;
        setElapsedMs(status.durationMillis);
        if (status.durationMillis >= MAX_DURATION_MS) {
          clearTick();
          await stopRecording(next, status.durationMillis);
        }
      }, 200);
    } catch (err) {
      console.error(err);
      alert({ title: t('common.error'), message: t('order.voiceRecordError') });
    }
  };

  const stopRecording = async (active?: Audio.Recording, durationOverride?: number) => {
    const rec = active ?? recording;
    if (!rec) return;
    clearTick();
    try {
      const status = await rec.getStatusAsync();
      const durationMs = Math.min(
        durationOverride ?? (status.isRecording || status.isDoneRecording ? status.durationMillis : 0),
        MAX_DURATION_MS,
      );
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setRecording(null);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      if (uri) {
        onChange({ uri, durationMs, mimeType: 'audio/m4a' });
        setElapsedMs(durationMs);
      }
    } catch (err) {
      console.error(err);
      setRecording(null);
    }
  };

  const togglePlay = async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
      return;
    }
    if (status.positionMillis > 0 && status.durationMillis && status.positionMillis >= status.durationMillis - 50) {
      await sound.setPositionAsync(0);
    }
    await sound.playAsync();
  };

  const deleteRecording = async () => {
    if (playing) await sound?.stopAsync();
    onChange(null);
    setElapsedMs(0);
  };

  const isRecording = Boolean(recording);
  const hasClip = Boolean(sourceUri);
  const displayDuration = isRecording
    ? elapsedMs
    : readOnly
      ? playbackDurationMs ?? value?.durationMs ?? 0
      : value?.durationMs ?? 0;

  return (
    <View style={{ gap: Spacing.two }}>
      {label ? (
        <Text
          style={[
            textStyle('caption'),
            { fontFamily: fontFamily('body', 'medium'), color: colors.ink },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
          padding: Spacing.four,
          borderRadius: Radius.lg,
          borderWidth: BorderWidth.default,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surfaceCard,
        }}
      >
        {!readOnly && isRecording ? (
          <Pressable
            onPress={() => stopRecording()}
            accessibilityRole="button"
            accessibilityLabel={t('order.voiceStop')}
            style={{ width: 48, height: 48 }}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.88 : 1,
                }}
              >
                <Stop size={20} color={colors.onAccent} weight="fill" />
              </View>
            )}
          </Pressable>
        ) : !readOnly && !hasClip ? (
          <Pressable
            onPress={startRecording}
            accessibilityRole="button"
            accessibilityLabel={t('order.voiceRecord')}
            style={{ width: 48, height: 48 }}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.orbit,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.88 : 1,
                }}
              >
                <Microphone size={22} color={colors.onOrbit} weight="fill" />
              </View>
            )}
          </Pressable>
        ) : hasClip ? (
          <Pressable
            onPress={togglePlay}
            accessibilityRole="button"
            accessibilityLabel={playing ? t('order.voicePause') : t('order.voicePlay')}
            style={{ width: 48, height: 48 }}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.iconWash,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.88 : 1,
                }}
              >
                {playing ? (
                  <Pause size={22} color={colors.ink} weight="fill" />
                ) : (
                  <Play size={22} color={colors.ink} weight="fill" />
                )}
              </View>
            )}
          </Pressable>
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.iconWash,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Microphone size={22} color={colors.muted} />
          </View>
        )}

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: fontFamily('body', 'medium'),
              fontSize: 15,
              color: colors.ink,
            }}
          >
            {isRecording
              ? t('order.voiceRecording')
              : hasClip
                ? t('order.voiceReady')
                : t('order.voiceEmpty')}
          </Text>
          <Text style={[textStyle('micro'), { color: colors.muted }]}>
            {isRecording
              ? `${formatMs(displayDuration)} / ${formatMs(MAX_DURATION_MS)}`
              : hasClip
                ? formatMs(displayDuration)
                : t('order.voiceHint')}
          </Text>
        </View>

        {!readOnly && hasClip && !isRecording ? (
          <Pressable
            onPress={deleteRecording}
            accessibilityRole="button"
            accessibilityLabel={t('order.voiceDelete')}
            style={{ width: 40, height: 40 }}
          >
            {({ pressed }) => (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.error + '12',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.88 : 1,
                }}
              >
                <Trash size={18} color={colors.error} weight="bold" />
              </View>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
