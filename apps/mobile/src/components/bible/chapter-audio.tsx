import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  audioTimes,
  useBibleAudioStore,
  useBibleStore,
} from '@bible-app/domain';

import { CircleButton } from '@/components/shared/circle-button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

// NOTE: this is a UI-only scaffold. Actual audio playback requires an audio
// library (e.g. expo-av / expo-audio) that is not yet installed. The controls
// wire up to the audio store but no sounds are played back.
export function ChapterAudio() {
  const {
    isAudioEnabled,
    isAudioPlaying,
    isLoading: isLoadingAudio,
    audioTimer,
    glossChapterAudio,
    mainChapterAudio,
    clearChapterAudio,
    loadChapterAudioForBibles,
    setAudioTimer,
    setIsAudioPlaying,
  } = useBibleAudioStore();
  const { glossSource, mainSource } = useBibleStore();

  useEffect(() => {
    if (!glossSource?.chapter?.id) {
      clearChapterAudio();
      return;
    }
    if (isAudioEnabled) {
      loadChapterAudioForBibles(
        glossSource?.bible?.id ?? '',
        mainSource?.bible?.id ?? '',
        mainSource?.chapter?.id ?? ''
      );
    }
  }, [
    isAudioEnabled,
    glossSource?.bible?.id,
    mainSource?.bible?.id,
    mainSource?.chapter?.id,
  ]);

  if (!isAudioEnabled) return null;

  const canPlay =
    !isLoadingAudio && !!glossChapterAudio && !!mainChapterAudio;

  return (
    <View style={styles.bar}>
      {audioTimer ? (
        <Text style={styles.timer}>Timer: {audioTimer} min</Text>
      ) : null}
      <View style={styles.controls}>
        <CircleButton
          onPress={() => {}}
          disabled={!canPlay}
          icon={
            isLoadingAudio ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={styles.icon}>⏮</Text>
            )
          }
        />
        <CircleButton
          onPress={() => canPlay && setIsAudioPlaying(!isAudioPlaying)}
          disabled={!canPlay}
          icon={
            isLoadingAudio ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={styles.icon}>{isAudioPlaying ? '⏸' : '⏵'}</Text>
            )
          }
        />
        <CircleButton
          onPress={() => {}}
          disabled={!canPlay}
          icon={
            isLoadingAudio ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={styles.icon}>⏭</Text>
            )
          }
        />
        <CircleButton
          style={audioTimer ? styles.timerActive : undefined}
          onPress={() =>
            audioTimer ? setAudioTimer(undefined) : setAudioTimer(audioTimes[0])
          }
          icon={
            <Text
              style={[
                styles.icon,
                audioTimer ? styles.iconTimerActive : null,
              ]}
            >
              ⧗
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    gap: 6,
  },
  timer: { color: '#4B5563', fontSize: 13 },
  controls: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  icon: { fontSize: 16, color: '#111827' },
  timerActive: { backgroundColor: '#22C55E' },
  iconTimerActive: { color: '#ffffff' },
});
