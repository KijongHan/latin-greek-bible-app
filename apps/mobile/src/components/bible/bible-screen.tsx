import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useBibleAudioStore, useBibleStore } from '@bible-app/domain';

import { ChapterAudio } from './chapter-audio';
import { ChapterHeader } from './chapter-header';
import { ChapterPage } from './chapter-page';
import { FrontPage } from './front-page';
import { CircleButton } from '@/components/shared/circle-button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function BibleScreen() {
  const [showLoading, setShowLoading] = useState(true);
  const { initialize, isLoading, mainSource, glossSource, nextChapter, previousChapter } =
    useBibleStore();
  const { isAudioEnabled } = useBibleAudioStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }
    const timeoutId = setTimeout(() => setShowLoading(true), 250);
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  const hasChapter = !!mainSource?.chapter && !!glossSource?.chapter;

  const swipeGesture = useMemo(
    () =>
      Gesture.Exclusive(
        Gesture.Fling()
          .direction(Directions.LEFT)
          .onEnd(() => {
            nextChapter();
          })
          .runOnJS(true),
        Gesture.Fling()
          .direction(Directions.RIGHT)
          .onEnd(() => {
            previousChapter();
          })
          .runOnJS(true),
      ),
    [nextChapter, previousChapter],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {hasChapter ? <ChapterHeader /> : null}
      {hasChapter ? (
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.body}>
            <ChapterPage />
            <CircleButton
              onPress={previousChapter}
              style={[styles.navButton, styles.navLeft]}
              icon={<Text style={styles.navIcon}>‹</Text>}
            />
            <CircleButton
              onPress={nextChapter}
              style={[styles.navButton, styles.navRight]}
              icon={<Text style={styles.navIcon}>›</Text>}
            />
          </View>
        </GestureDetector>
      ) : (
        <View style={styles.body}>
          <FrontPage />
        </View>
      )}
      {showLoading ? (
        <View style={[styles.loadingOverlay, hasChapter && styles.loadingOverlayDim]}>
          <LoadingSpinner size="large" />
          {!mainSource ? (
            <Text style={styles.loadingText}>Initializing bible data...</Text>
          ) : null}
        </View>
      ) : null}
      {isAudioEnabled ? <ChapterAudio /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  body: { flex: 1 },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },
  navIcon: { fontSize: 24, color: '#111827', lineHeight: 24 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  loadingOverlayDim: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  loadingText: { color: '#6B7280', fontSize: 13 },
});
