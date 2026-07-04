import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {hasChapter ? <ChapterHeader /> : null}
      <View style={styles.body}>
        {hasChapter ? <ChapterPage /> : <FrontPage />}
        {hasChapter ? (
          <>
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
          </>
        ) : null}
      </View>
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
